import json
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from ..models.notification import Notification, PushSubscription
from ..models.safety_report import SafetyReport
from ..models.ai_analysis import AIAnalysis
from ..models.user import User
from ..config import settings

logger = logging.getLogger("safetyai.notifications")

# Official Team Mapping Definitions
RESPONSE_TEAM_SPECS = [
    {
        "department": "AMBULANCE_MEDICAL",
        "team_label": "Ambulance / Medical Response Team 🚑",
        "email": "ambulance@safety.com",
        "keywords": [
            "medical emergency", "medical", "ambulance", "paramedic", "injur", "injured worker",
            "injury", "casualty", "unconscious", "first aid", "bleeding", "trauma", "head trauma",
            "cardiac", "medic", "hospital", "asphyxiat", "collapsed", "fainted", "patient",
            "doctor", "cpr", "fracture", "burn injury", "health incident", "health emergency"
        ],
        "required_assistance": "Urgent paramedic dispatch, triage stabilization, and emergency medical evacuation.",
        "priority_rank": 10
    },
    {
        "department": "PROCESS_SAFETY",
        "team_label": "Fire & Process Safety Response Team 🚒",
        "email": "process@safety.com",
        "keywords": [
            "fire", "explosion", "flame", "smoke", "blast", "thermal", "flash fire",
            "hot work", "ignition", "burning", "jet fire", "fireball", "flare", "combustion"
        ],
        "required_assistance": "Immediate fire suppression, perimeter cooling, and emergency shutdown deployment.",
        "priority_rank": 9
    },
    {
        "department": "HAZMAT",
        "team_label": "Hazmat & Gas Emergency Response Team ☣️",
        "email": "hazmat@safety.com",
        "keywords": [
            "gas leak", "gas leakage", "gas release", "gas emergency", "hazardous chemical release",
            "hazardous chemical", "toxic", "h2s", "chemical", "acid", "caustic", "ammonia",
            "chlorine", "spill", "flammable gas", "hydrofluoric", "sour gas", "methane", "propane",
            "benzene", "vapor leak", "gas"
        ],
        "required_assistance": "Hazmat atmospheric containment, downwind isolation perimeter, and vapor neutralization.",
        "priority_rank": 8
    },
    {
        "department": "ELECTRICAL",
        "team_label": "Electrical Maintenance Division ⚡",
        "email": "electrical@safety.com",
        "keywords": [
            "electric", "11kv", "415v", "arc flash", "wire", "cable", "switchgear",
            "breaker", "substation", "voltage", "panel", "busbar", "arcing", "live conductor"
        ],
        "required_assistance": "Positive Lockout/Tagout (LOTO), zero-energy testing, and high-voltage circuit repair.",
        "priority_rank": 7
    },
    {
        "department": "MECHANICAL",
        "team_label": "Mechanical & Pressure Piping Crew ⚙️",
        "email": "mechanical@safety.com",
        "keywords": [
            "mechanical", "pipeline", "valve", "flange", "pump", "compressor", "hydraulic",
            "pressure", "gasket", "rupture", "machine", "bearing", "relief valve", "blowout"
        ],
        "required_assistance": "Mechanical pressure isolation, flange/valve repair, and mechanical integrity verification.",
        "priority_rank": 6
    },
    {
        "department": "RIGGING_LIFTING",
        "team_label": "Rigging & Heavy Lifting Unit 🏗️",
        "email": "rigging@safety.com",
        "keywords": [
            "crane", "rigging", "hoist", "suspended load", "dropped object", "sling",
            "casing lift", "drop zone", "shackle", "overhead lift"
        ],
        "required_assistance": "Rigging exclusion perimeter, crane lift suspension, and tackle recertification.",
        "priority_rank": 5
    },
    {
        "department": "CIVIL_STRUCTURAL",
        "team_label": "Civil & Structural Safety Team 🧱",
        "email": "civil@safety.com",
        "keywords": [
            "fall from height", "height", "scaffold", "ladder", "roof", "grating",
            "elevation", "tie-off", "harness", "handrail", "toe-board", "structural"
        ],
        "required_assistance": "Elevated platform red-tagging, scaffolding barrier repair, and 100% tie-off enforcement.",
        "priority_rank": 4
    }
]


def match_response_teams(
    db: Session,
    report: SafetyReport,
    ai: Optional[AIAnalysis] = None,
    risk_score: int = 50,
    raw_nlp_result: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Intelligently matches the single or multi-response teams based on incident type,
    hazard context, physical energy vectors, and required technical capabilities.
    Only returns truly matched teams — does not notify unrelated teams.
    """
    desc = (report.description or "").lower()
    norm_desc = (report.normalized_description or "").lower()
    hazard = ((ai.identified_hazard if ai else "") or (raw_nlp_result.get("identified_hazard", "") if raw_nlp_result else "")).lower()
    energy = ((ai.energy_source if ai else "") or (raw_nlp_result.get("energy_source", "") if raw_nlp_result else "")).lower()
    rep_type = (report.report_type or "").lower().replace("_", " ")
    
    combined_text = f"{desc} {norm_desc} {hazard} {energy} {rep_type} {(report.additional_context or '').lower()}"

    matched_specs = []
    for spec in RESPONSE_TEAM_SPECS:
        score = 0
        for kw in spec["keywords"]:
            if kw in combined_text:
                if len(kw.split()) > 1:
                    score += 6
                elif len(kw) > 5:
                    score += 3
                else:
                    score += 1
        if score > 0:
            matched_specs.append((score * spec["priority_rank"], spec))

    # Sort descending by match score and priority
    matched_specs.sort(key=lambda x: x[0], reverse=True)

    if not matched_specs:
        return []

    # Select top matched team(s); only include secondary team if it is a genuinely strong compound match
    top_score = matched_specs[0][0]
    top_specs = [matched_specs[0][1]]
    if len(matched_specs) > 1 and matched_specs[1][0] >= top_score * 0.65:
        top_specs.append(matched_specs[1][1])

    results = []
    for spec in top_specs:
        # Find registered responder user for this department or fallback to preset email
        responder_user = db.query(User).filter(
            User.organization_id == report.organization_id,
            (User.department == spec["department"]) | (User.email == spec["email"])
        ).first()

        if not responder_user:
            # Fallback across org by email
            responder_user = db.query(User).filter(User.email == spec["email"]).first()

        if responder_user:
            results.append({
                "user": responder_user,
                "department": spec["department"],
                "team_label": spec["team_label"],
                "required_assistance": spec["required_assistance"]
            })

    return results


def find_target_admins(
    db: Session,
    report: SafetyReport,
    reporter: Optional[User] = None
) -> List[User]:
    """
    Locates the appropriate supervisory admin for this report/user,
    or falls back to organization administrators.
    """
    # 1. Directly assigned admin on report
    if report.assigned_admin_id:
        admin = db.query(User).filter(User.id == report.assigned_admin_id).first()
        if admin:
            return [admin]

    # 2. Supervising admin of the reporting worker
    if reporter and reporter.assigned_admin_id:
        admin = db.query(User).filter(User.id == reporter.assigned_admin_id).first()
        if admin:
            return [admin]

    # 3. Organization administrators
    admins = db.query(User).filter(
        User.organization_id == report.organization_id,
        User.role.in_(["ADMINISTRATOR", "ADMIN", "CHIEF_HSE_AUDITOR"])
    ).all()

    if admins:
        return admins

    # 4. Fallback: any system admin
    fallback = db.query(User).filter(User.role.in_(["ADMINISTRATOR", "ADMIN"])).all()
    return fallback or []


def deliver_email(
    to_email: str,
    subject: str,
    title: str,
    message: str,
    metadata: Dict[str, Any]
) -> Tuple[str, Optional[str]]:
    """
    Delivers an email notification via configured SMTP credentials.
    Returns (status, error_message).
    Non-blocking and gracefully reports NOT_CONFIGURED when credentials are absent.
    """
    if not settings.EMAIL_ENABLED or not settings.SMTP_HOST:
        return "NOT_CONFIGURED", "SMTP host or EMAIL_ENABLED not configured in environment."

    if not to_email:
        return "SKIPPED", "Recipient email address is missing."

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAILS_FROM_EMAIL
        msg["To"] = to_email

        text_body = f"{title}\n\n{message}\n\nIncident ID: {metadata.get('report_reference')}\nLocation: {metadata.get('location')}\nRisk Score: {metadata.get('risk_score')}/100"
        
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
            <div style="max-width: 600px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px; margin: auto;">
              <h2 style="color: #0f172a; margin-top: 0;">{title}</h2>
              <p style="color: #334155; font-size: 15px; line-height: 1.5;">{message}</p>
              <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 4px 0; font-size: 13px;"><strong>Report:</strong> {metadata.get('report_reference')}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> {metadata.get('location')}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Risk Score:</strong> <span style="color: #dc2626; font-weight: bold;">{metadata.get('risk_score')}/100</span></p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Severity:</strong> {metadata.get('severity')}</p>
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 24px;">SafetyAI Platform Notification &bull; Smart Incident Triage</p>
            </div>
          </body>
        </html>
        """

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5)
            server.starttls()

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

        server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
        server.quit()
        return "SENT", None
    except Exception as exc:
        logger.warning(f"Email delivery failed to {to_email}: {exc}")
        return "FAILED", str(exc)


def deliver_push(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    metadata: Dict[str, Any]
) -> Tuple[str, Optional[str]]:
    """
    Delivers a Web Push notification to registered subscriptions.
    Returns (status, error_message).
    Non-blocking and gracefully reports NOT_CONFIGURED when VAPID keys are absent.
    """
    subscriptions = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    if not subscriptions:
        return "SKIPPED", "No active web push subscriptions found for user."

    if not settings.VAPID_PUBLIC_KEY or not settings.VAPID_PRIVATE_KEY:
        return "NOT_CONFIGURED", "VAPID keys not configured in environment."

    try:
        # Standard webpush integration
        from pywebpush import webpush, WebPushException
        payload = json.dumps({
            "title": title,
            "body": message,
            "data": metadata
        })

        success_count = 0
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        "endpoint": sub.endpoint,
                        "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
                    },
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}"}
                )
                success_count += 1
            except WebPushException as wpe:
                logger.warning(f"WebPush single endpoint failure: {wpe}")

        return "SENT" if success_count > 0 else "FAILED", None
    except ImportError:
        return "NOT_CONFIGURED", "pywebpush library not installed for push delivery."
    except Exception as exc:
        logger.warning(f"Push delivery failed for user {user_id}: {exc}")
        return "FAILED", str(exc)


def process_incident_notifications(
    db: Session,
    report: SafetyReport,
    ai_analysis: Optional[AIAnalysis] = None,
    reporter: Optional[User] = None,
    raw_nlp_result: Optional[Dict[str, Any]] = None,
    calculated_risk_score: Optional[int] = None
) -> List[Notification]:
    """
    Main End-to-End Incident Notification Engine:
    1. Evaluates incident risk score and SIF status.
    2. Dispatches Admin Notifications for SIF or High-Risk incidents.
    3. Matches specific Response Teams and dispatches Action Notifications.
    4. Escalates to Admin if no response team matched.
    5. Stores records with idempotency to avoid duplicates.
    6. Attempts multi-channel delivery (In-app, Email, Web Push).
    """
    # 1. Determine SIF & Risk Metrics
    sif_assessment = (ai_analysis.sif_precursor_assessment if ai_analysis else "") or (raw_nlp_result.get("sif_precursor_assessment", "") if raw_nlp_result else "")
    is_sif = sif_assessment.upper() == "YES"
    desc_lower = f"{(report.description or '')} {(report.normalized_description or '')} {(report.additional_context or '')}".lower()

    if calculated_risk_score is not None:
        risk_score = calculated_risk_score
    elif raw_nlp_result and "ai_sif_score" in raw_nlp_result:
        risk_score = raw_nlp_result["ai_sif_score"]
    else:
        is_emergency = any(kw in desc_lower for kw in [
            "medical emergency", "casualty", "unconscious", "heavy bleeding", "deep laceration",
            "explosion", "active flame", "fire response", "toxic h2s", "hazardous chemical release",
            "open flames", "arc flash", "high voltage"
        ])
        if is_sif or is_emergency:
            risk_score = 92
        else:
            try:
                from ..ai_services.sif_assessment import compute_maut_risk_score
                hazard = ai_analysis.identified_hazard if ai_analysis else None
                energy = ai_analysis.energy_source if ai_analysis else None
                exposure = ai_analysis.exposure if ai_analysis else None
                barrier = (ai_analysis.barrier_information if ai_analysis else None) or "BARRIER_INSUFFICIENT_INFO"
                risk_score = compute_maut_risk_score(
                    hazard=hazard,
                    energy_source=energy,
                    exposure=exposure,
                    barrier_status=barrier,
                    text=report.description or ""
                )
            except Exception:
                risk_score = 35

    severity = "CRITICAL" if (is_sif or risk_score >= 80) else ("HIGH" if risk_score >= 60 else "MEDIUM")
    reporter_name = reporter.full_name if reporter else "Liam Vance (Field Worker)"
    location_name = report.incident_location_name or report.location or "Operational Unit"
    hazard_title = (ai_analysis.identified_hazard if ai_analysis else "") or (raw_nlp_result.get("identified_hazard", "") if raw_nlp_result else "") or report.report_type.replace("_", " ").title()

    created_notifications: List[Notification] = []

    # 2. Check if Admin Notification is Required (SIF OR High-Risk/Critical >= 70)
    requires_admin_alert = is_sif or risk_score >= 70 or severity == "CRITICAL"
    target_admins = find_target_admins(db, report, reporter) if requires_admin_alert else []

    if requires_admin_alert and target_admins:
        for admin in target_admins:
            idempotency_key = f"admin_{report.id}_{admin.id}_sif_alert"
            existing = db.query(Notification).filter(Notification.idempotency_key == idempotency_key).first()
            if not existing:
                title = f"🚨 Critical Incident Reported"
                message = f"Critical incident reported by {reporter_name}. {hazard_title} at {location_name}. Risk score: {risk_score}. Immediate review required."
                
                metadata = {
                    "report_id": report.id,
                    "report_reference": report.report_reference,
                    "reporter_name": reporter_name,
                    "incident_type": report.report_type,
                    "classification": hazard_title,
                    "risk_score": risk_score,
                    "severity": severity,
                    "location": location_name,
                    "created_at": datetime.utcnow().isoformat(),
                    "action_url": f"/reports?id={report.id}",
                    "is_sif": is_sif
                }

                notif = Notification(
                    organization_id=report.organization_id,
                    recipient_user_id=admin.id,
                    report_id=report.id,
                    notification_type="ADMIN_ALERT",
                    severity=severity,
                    title=title,
                    message=message,
                    metadata_payload=metadata,
                    idempotency_key=idempotency_key,
                    in_app_status="DELIVERED"
                )
                db.add(notif)
                db.flush()

                # Multi-channel delivery
                email_status, _ = deliver_email(admin.email, f"[ALERT] {title} - {report.report_reference}", title, message, metadata)
                push_status, _ = deliver_push(db, admin.id, title, message, metadata)
                notif.email_status = email_status
                notif.push_status = push_status

                created_notifications.append(notif)

    # 3. Match Response Teams (Only when incident requires assistance)
    matched_teams = match_response_teams(db, report, ai_analysis, risk_score, raw_nlp_result)

    if matched_teams:
        primary_match = matched_teams[0]
        primary_user = primary_match["user"]
        report.assigned_team_id = primary_user.id

        # Also store / sync ResponseTask assignment record
        from ..models.response_task import ResponseTask
        existing_task = db.query(ResponseTask).filter(ResponseTask.report_id == report.id).first()
        if not existing_task:
            task_ref = f"TSK-{report.report_reference or report.id}"
            new_task = ResponseTask(
                task_reference=task_ref,
                report_id=report.id,
                organization_id=report.organization_id,
                department=primary_user.department or primary_match["department"],
                title=f"{primary_match['team_label']} Response",
                description=f"{primary_match['required_assistance']} ({report.report_type}: {(report.description or '')[:120]})",
                priority="P1 - Critical" if (is_sif or risk_score >= 80) else "P2 - High",
                status="ASSIGNED",
                assigned_team_name=primary_match["team_label"],
                assigned_by_id=report.assigned_admin_id or (target_admins[0].id if target_admins else None)
            )
            db.add(new_task)

        for match in matched_teams:
            resp_user = match["user"]
            team_label = match["team_label"]
            req_assist = match["required_assistance"]
            dept = match["department"]

            idempotency_key = f"dispatch_{report.id}_{resp_user.id}"
            existing = db.query(Notification).filter(Notification.idempotency_key == idempotency_key).first()
            if not existing:
                title = f"⚠️ Emergency Assistance Required"
                inc_ref = report.report_reference or report.id

                if dept == "AMBULANCE_MEDICAL":
                    message = f"Ambulance assistance required at {location_name}. A worker needs medical attention. Open incident #{inc_ref}."
                elif dept == "PROCESS_SAFETY":
                    message = f"Fire response required at {location_name}. A fire has been reported near processing equipment. Open incident #{inc_ref}."
                elif dept == "HAZMAT":
                    message = f"Gas emergency response required at {location_name}. A gas leak has been reported. Open incident #{inc_ref}."
                else:
                    message = f"{team_label} required at {location_name}. {req_assist} Open incident #{inc_ref}."

                metadata = {
                    "report_id": report.id,
                    "report_reference": report.report_reference,
                    "incident_type": report.report_type,
                    "brief_description": (report.description or "")[:120],
                    "risk_score": risk_score,
                    "severity": severity,
                    "location": location_name,
                    "required_assistance": req_assist,
                    "action_url": f"/reports?id={report.id}",
                    "team_department": match["department"],
                    "assigned_team_id": resp_user.id
                }

                notif = Notification(
                    organization_id=report.organization_id,
                    recipient_user_id=resp_user.id,
                    report_id=report.id,
                    notification_type="RESPONSE_DISPATCH",
                    severity=severity,
                    title=title,
                    message=message,
                    metadata_payload=metadata,
                    idempotency_key=idempotency_key,
                    in_app_status="DELIVERED"
                )
                db.add(notif)
                db.flush()

                email_status, _ = deliver_email(resp_user.email, f"[DISPATCH] {title} - #{inc_ref}", title, message, metadata)
                push_status, _ = deliver_push(db, resp_user.id, title, message, metadata)
                notif.email_status = email_status
                notif.push_status = push_status

                created_notifications.append(notif)

    else:
        # If incident required assistance (SIF or High Risk) but no technical team matched:
        # Notify the authorized admin/dispatcher for manual assignment!
        has_high_risk_flag = any(kw in desc_lower for kw in [
            "high risk", "sif", "critical", "emergency", "fatal", "severe", "life-threatening"
        ])
        if requires_admin_alert or is_sif or has_high_risk_flag:
            target_admins = find_target_admins(db, report, reporter)
            for admin in target_admins:
                idempotency_key = f"escalate_{report.id}_{admin.id}_no_team"
                existing = db.query(Notification).filter(Notification.idempotency_key == idempotency_key).first()
                if not existing:
                    title = f"⚠️ Incident Escalated: No Matched Response Team"
                    inc_ref = report.report_reference or report.id
                    message = f"Incident #{inc_ref} at {location_name} requires manual response dispatch. No automated team matched the conditions."

                    metadata = {
                        "report_id": report.id,
                        "report_reference": report.report_reference,
                        "incident_type": report.report_type,
                        "risk_score": risk_score,
                        "severity": severity,
                        "location": location_name,
                        "action_url": f"/reports?id={report.id}",
                        "escalation_reason": "No automated team matched reported hazard conditions"
                    }

                    notif = Notification(
                        organization_id=report.organization_id,
                        recipient_user_id=admin.id,
                        report_id=report.id,
                        notification_type="ESCALATION",
                        severity="HIGH",
                        title=title,
                        message=message,
                        metadata_payload=metadata,
                        idempotency_key=idempotency_key,
                        in_app_status="DELIVERED"
                    )
                    db.add(notif)
                    db.flush()

                    email_status, _ = deliver_email(admin.email, f"[ESCALATION] {title} - #{inc_ref}", title, message, metadata)
                    push_status, _ = deliver_push(db, admin.id, title, message, metadata)
                    notif.email_status = email_status
                    notif.push_status = push_status

                    created_notifications.append(notif)

    db.commit()
    return created_notifications
