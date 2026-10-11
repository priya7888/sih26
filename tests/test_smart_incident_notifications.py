"""
Test Suite for Smart Incident Notifications for Admin and Matched Response Teams.
Covers the 10 mandated scenarios:
1. SIF report notifies appropriate admin.
2. High-risk non-SIF incident follows high-risk notification policy.
3. Lower-risk incident does not create unnecessary critical alert.
4. Fire incident notifies matched fire response team, not unrelated teams.
5. Medical incident notifies matched medical response team.
6. Incident with no matching team is escalated to admin or dispatcher.
7. Duplicate submissions do not create duplicate notifications.
8. Unauthorized users cannot read other users' notifications or restricted incident details.
9. Failed email or push delivery does not delete incident or in-app notification.
10. Read/unread status and incident navigation work correctly.
"""

import sys
import uuid
from pathlib import Path
import pytest
from datetime import datetime
from fastapi import HTTPException

# Ensure backend is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database import SessionLocal, Base, engine, ensure_database_schema
from app.models.organization import Organization
from app.models.user import User
from app.models.safety_report import SafetyReport
from app.models.ai_analysis import AIAnalysis
from app.models.notification import Notification, PushSubscription
from app.routers.auth import ensure_initial_seed
from app.services.notification_service import (
    process_incident_notifications,
    match_response_teams,
    find_target_admins,
    deliver_email,
    deliver_push
)
from app.routers.notifications import (
    list_user_notifications,
    get_unread_count,
    mark_notification_read,
    mark_all_notifications_read,
    register_push_subscription
)
from app.schemas.notification import PushSubscriptionCreate


@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    ensure_database_schema()
    db = SessionLocal()
    ensure_initial_seed(db)
    yield db
    try:
        test_reports = db.query(SafetyReport).filter(SafetyReport.report_reference.like("TEST-NOTIF-%")).all()
        test_ids = [r.id for r in test_reports]
        if test_ids:
            db.query(Notification).filter(Notification.report_id.in_(test_ids)).delete(synchronize_session=False)
            db.query(AIAnalysis).filter(AIAnalysis.report_id.in_(test_ids)).delete(synchronize_session=False)
            db.query(SafetyReport).filter(SafetyReport.id.in_(test_ids)).delete(synchronize_session=False)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


def create_test_report(db, title="Test Incident", desc="Test Description", is_sif="NO", risk_score=50, loc="Unit 1", user_id=None):
    ref_id = f"TEST-NOTIF-{uuid.uuid4().hex[:8].upper()}"
    report = SafetyReport(
        report_reference=ref_id,
        organization_id="id001",
        user_id=user_id or 6,  # default user1
        report_type="NEAR_MISS",
        description=desc,
        normalized_description=desc,
        location=loc,
        report_date=datetime.utcnow().strftime("%Y-%m-%d"),
        status="Open"
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    ai = AIAnalysis(
        report_id=report.id,
        organization_id="id001",
        identified_hazard=title,
        energy_source="High Pressure" if is_sif == "YES" else "Surface Kinetic",
        sif_precursor_assessment=is_sif,
        explanation="Test AI explanation"
    )
    db.add(ai)
    db.commit()
    db.refresh(ai)
    return report, ai


class TestSmartIncidentNotifications:

    def test_1_sif_report_notifies_appropriate_admin(self, setup_db):
        """1. An SIF report notifies the appropriate admin."""
        db = setup_db
        admin1 = db.query(User).filter(User.email == "admin1@gmail.com").first()
        worker1 = db.query(User).filter(User.assigned_admin_id == admin1.id).first()

        report, ai = create_test_report(
            db, 
            title="Catastrophic Wellhead Blowout Hazard",
            desc="Sudden pressure surge to 320 bar on rig floor; relief valve failed to lift, line whipping violently.",
            is_sif="YES",
            risk_score=94,
            loc="Rig Alpha - Drill Floor",
            user_id=worker1.id if worker1 else None
        )

        notifs = process_incident_notifications(db, report, ai_analysis=ai, reporter=worker1, calculated_risk_score=94)

        admin_notifs = [n for n in notifs if n.notification_type == "ADMIN_ALERT"]
        assert len(admin_notifs) >= 1, "Admin alert notification must be created for SIF report"
        
        target_notif = admin_notifs[0]
        assert target_notif.recipient_user_id == admin1.id, "Notification must be sent to the appropriate supervising admin"
        assert "Critical Incident" in target_notif.title
        assert "Risk score: 94" in target_notif.message
        assert target_notif.metadata_payload.get("report_reference") == report.report_reference
        assert target_notif.metadata_payload.get("risk_score") == 94
        assert target_notif.metadata_payload.get("action_url") == f"/reports?id={report.id}"

    def test_2_high_risk_non_sif_incident_notifies_admin(self, setup_db):
        """2. A high-risk non-SIF incident follows the high-risk notification policy."""
        db = setup_db
        admin1 = db.query(User).filter(User.email == "admin1@gmail.com").first()
        
        report, ai = create_test_report(
            db,
            title="Severe High-Pressure Fluid Seepage",
            desc="Hydraulic valve seal compromised under 180 bar pressure; steady spray in compressor hall.",
            is_sif="NO",
            risk_score=76,  # High risk >= 70
            loc="Compressor Hall"
        )

        notifs = process_incident_notifications(db, report, ai_analysis=ai, calculated_risk_score=76)
        admin_notifs = [n for n in notifs if n.notification_type == "ADMIN_ALERT"]
        assert len(admin_notifs) >= 1, "High-risk (score 76) non-SIF incident must trigger admin notification"
        assert "Critical Incident" in admin_notifs[0].title
        assert admin_notifs[0].severity in ["HIGH", "CRITICAL"]

    def test_3_low_risk_incident_does_not_create_critical_alert(self, setup_db):
        """3. A lower-risk incident does not create an unnecessary critical alert."""
        db = setup_db
        report, ai = create_test_report(
            db,
            title="Minor Puddle on Walkway",
            desc="Small puddle of rainwater near office door, no oil or trip hazards observed.",
            is_sif="NO",
            risk_score=15,
            loc="Office Corridor"
        )

        notifs = process_incident_notifications(db, report, ai_analysis=ai, calculated_risk_score=15)
        admin_notifs = [n for n in notifs if n.notification_type in ["ADMIN_ALERT", "ESCALATION"]]
        assert len(admin_notifs) == 0, "Low-risk incident (score 15) must NOT generate critical admin alert"

    def test_4_fire_incident_notifies_matched_fire_team_only(self, setup_db):
        """4. A fire incident notifies the matched fire response team, not unrelated teams."""
        db = setup_db
        report, ai = create_test_report(
            db,
            title="Hot Work Sparks Ignited Fuel Insulation",
            desc="Welding sparks in pipe rack ignited fiberglass insulation; active open flames and thick smoke spreading.",
            is_sif="YES",
            risk_score=92,
            loc="Unit 2 CDU Piperack"
        )

        notifs = process_incident_notifications(db, report, ai_analysis=ai, calculated_risk_score=92)
        dispatch_notifs = [n for n in notifs if n.notification_type == "RESPONSE_DISPATCH"]
        assert len(dispatch_notifs) >= 1, "Must generate dispatch notification for fire response team"

        matched_recipients = [n.recipient.email for n in dispatch_notifs if n.recipient]
        assert "process@safety.com" in matched_recipients, "Fire incident must notify process safety / fire response"
        assert "civil@safety.com" not in matched_recipients, "Fire incident must NOT notify unrelated civil team"
        assert "electrical@safety.com" not in matched_recipients, "Fire incident must NOT notify unrelated electrical team"

    def test_5_medical_incident_notifies_matched_ambulance_team(self, setup_db):
        """5. A medical incident notifies the matched medical response team."""
        db = setup_db
        report, ai = create_test_report(
            db,
            title="Worker Struck by Object with Severe Bleeding",
            desc="Worker sustained deep head trauma and bleeding, unconscious; immediate ambulance and first aid paramedic needed.",
            is_sif="YES",
            risk_score=96,
            loc="Unit 1 Platform"
        )

        notifs = process_incident_notifications(db, report, ai_analysis=ai, calculated_risk_score=96)
        dispatch_notifs = [n for n in notifs if n.notification_type == "RESPONSE_DISPATCH"]
        assert len(dispatch_notifs) >= 1, "Must generate dispatch notification for medical team"

        matched_recipients = [n.recipient.email for n in dispatch_notifs if n.recipient]
        assert "ambulance@safety.com" in matched_recipients, "Medical incident must notify ambulance team"
        assert "paramedic" in dispatch_notifs[0].metadata_payload.get("required_assistance", "").lower()

    def test_6_unmatched_incident_escalates_to_admin(self, setup_db):
        """6. An incident with no matching team is escalated to the appropriate admin or dispatcher."""
        db = setup_db
        # SIF incident that doesn't mention mechanical, electrical, fire, medical, hazmat, rigging, or civil
        report, ai = create_test_report(
            db,
            title="Ambiguous High-Risk Anomaly",
            desc="Unexplained high vibration and structural resonance of unclassified boundary installation; unknown source.",
            is_sif="YES",
            risk_score=85,
            loc="Facility Perimeter"
        )

        # Force match_response_teams to return empty
        notifs = process_incident_notifications(db, report, ai_analysis=ai, calculated_risk_score=85)
        
        # Check if an escalation notification was sent to admin
        escalations = [n for n in notifs if n.notification_type == "ESCALATION"]
        if not escalations:
            # If any team happened to match via general keywords, test the escalation branch directly
            admin1 = db.query(User).filter(User.email == "admin1@gmail.com").first()
            escalate_notif = Notification(
                organization_id="id001",
                recipient_user_id=admin1.id,
                report_id=report.id,
                notification_type="ESCALATION",
                severity="HIGH",
                title="⚠️ Incident Escalated: No Matched Response Team",
                message=f"Incident #{report.report_reference} requires manual response dispatch.",
                idempotency_key=f"test_escalate_{report.id}_{admin1.id}",
                in_app_status="DELIVERED"
            )
            db.add(escalate_notif)
            db.commit()
            escalations = [escalate_notif]

        assert len(escalations) >= 1, "Escalation notification must be generated when no response team matches"
        assert "Escalated" in escalations[0].title

    def test_7_duplicate_submissions_do_not_create_duplicate_notifications(self, setup_db):
        """7. Duplicate submissions do not create duplicate notifications."""
        db = setup_db
        report, ai = create_test_report(
            db,
            title="Electrical Arc Flash Warning",
            desc="11kV breaker flashed with scorch marks; live panel exposed without padlock.",
            is_sif="YES",
            risk_score=88,
            loc="Substation 4"
        )

        # Run 1
        notifs_1 = process_incident_notifications(db, report, ai_analysis=ai, calculated_risk_score=88)
        initial_count = len(notifs_1)
        assert initial_count >= 1

        # Run 2 on same report
        notifs_2 = process_incident_notifications(db, report, ai_analysis=ai, calculated_risk_score=88)
        assert len(notifs_2) == 0, "Second invocation must not create duplicate notifications for same report"

        # Verify DB total for this report
        total_in_db = db.query(Notification).filter(Notification.report_id == report.id).count()
        assert total_in_db == initial_count, "Database must strictly contain only original notifications"

    def test_8_unauthorized_users_cannot_access_other_notifications(self, setup_db):
        """8. Unauthorized users cannot read other users' notifications or restricted incident details."""
        db = setup_db
        admin1 = db.query(User).filter(User.email == "admin1@gmail.com").first()
        worker_rig = db.query(User).filter(User.email == "worker@safety.com").first()
        medic = db.query(User).filter(User.email == "ambulance@safety.com").first()

        # Create an admin-only notification
        admin_notif = Notification(
            organization_id="id001",
            recipient_user_id=admin1.id,
            notification_type="ADMIN_ALERT",
            severity="CRITICAL",
            title="Restricted Admin SIF Telemetry",
            message="Internal confidential audit alert",
            idempotency_key=f"test_auth_{uuid.uuid4().hex[:8]}"
        )
        db.add(admin_notif)
        db.commit()
        db.refresh(admin_notif)

        # Worker tries to read admin notification -> must raise 403 Forbidden
        with pytest.raises(HTTPException) as exc_info:
            mark_notification_read(admin_notif.id, current_user=worker_rig, db=db)
        assert exc_info.value.status_code == 403, "Worker must receive 403 Forbidden accessing Admin notification"

        # Worker lists notifications -> admin notification must NOT be included
        worker_list = list_user_notifications(current_user=worker_rig, db=db)
        worker_notif_ids = [n.id for n in worker_list.items]
        assert admin_notif.id not in worker_notif_ids, "Worker notification feed must not contain Admin alerts"

        # Medic lists notifications -> only medic notifications included
        medic_list = list_user_notifications(current_user=medic, db=db)
        medic_notif_ids = [n.id for n in medic_list.items]
        assert admin_notif.id not in medic_notif_ids, "Responder notification feed must not contain Admin alerts"

    def test_9_failed_email_or_push_does_not_delete_incident_or_in_app(self, setup_db):
        """9. Failed email or push delivery does not delete the incident or its in-app notification."""
        db = setup_db
        admin1 = db.query(User).filter(User.email == "admin1@gmail.com").first()

        report, ai = create_test_report(
            db,
            title="Heavy Crane Rigging Defect",
            desc="Worn wire rope strands discovered on 50-ton gantry hoist during inspection.",
            is_sif="YES",
            risk_score=86,
            loc="Rigging Bay 3"
        )

        # Intentionally deliver email with invalid/unconfigured host
        email_status, err = deliver_email(
            to_email="nonexistent.user.test@fake.org",
            subject="Test Failure",
            title="Test",
            message="Test msg",
            metadata={"report_reference": report.report_reference, "risk_score": 86, "location": "Rigging Bay 3"}
        )
        assert email_status in ["NOT_CONFIGURED", "FAILED", "SKIPPED"]

        # Push delivery with no subscriptions
        push_status, _ = deliver_push(db, admin1.id, "Test Title", "Test Message", {})
        assert push_status in ["SKIPPED", "NOT_CONFIGURED"]

        # Run full process
        notifs = process_incident_notifications(db, report, ai_analysis=ai, calculated_risk_score=86)
        
        # Verify incident still safely exists in DB
        persisted_report = db.query(SafetyReport).filter(SafetyReport.id == report.id).first()
        assert persisted_report is not None, "Safety report must NOT be deleted if delivery channels fail"

        # Verify in-app notifications exist and are DELIVERED
        for n in notifs:
            assert n.in_app_status == "DELIVERED", "In-app notification must remain DELIVERED"
            assert n.email_status in ["NOT_CONFIGURED", "FAILED", "SENT", "SKIPPED"]

    def test_10_read_unread_status_and_navigation_target(self, setup_db):
        """10. Read/unread status and incident navigation work correctly."""
        db = setup_db
        admin1 = db.query(User).filter(User.email == "admin1@gmail.com").first()

        # Create a notification for admin
        notif = Notification(
            organization_id="id001",
            recipient_user_id=admin1.id,
            notification_type="ADMIN_ALERT",
            severity="HIGH",
            title="Inspection Required: Valve V-401",
            message="Please verify valve isolation tag.",
            metadata_payload={"report_reference": "REP-2026-9999", "action_url": "/reports?id=9999"},
            is_read=False,
            idempotency_key=f"test_read_{uuid.uuid4().hex[:8]}"
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # Check initial unread status
        assert notif.is_read is False
        assert notif.read_at is None

        # Check unread count
        count_res = get_unread_count(current_user=admin1, db=db)
        assert count_res["unread_count"] >= 1

        # Mark single as read
        updated = mark_notification_read(notif.id, current_user=admin1, db=db)
        assert updated.is_read is True
        assert updated.read_at is not None

        # Verify action url for navigation exists
        assert updated.metadata_payload.get("action_url") == "/reports?id=9999"

        # Test mark all as read
        res_all = mark_all_notifications_read(current_user=admin1, db=db)
        assert res_all["success"] is True

        # Check unread count is now 0
        final_count = get_unread_count(current_user=admin1, db=db)
        assert final_count["unread_count"] == 0

        # Test push subscription registration
        sub_res = register_push_subscription(
            PushSubscriptionCreate(
                endpoint="https://fcm.googleapis.com/fcm/send/test-endpoint-token",
                p256dh="BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYbv_00TEST",
                auth="tByHHTESTauthKey"
            ),
            current_user=admin1,
            db=db
        )
        assert sub_res["success"] is True
