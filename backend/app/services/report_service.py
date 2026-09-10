from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..models.safety_report import SafetyReport, AnalysisStatusEnum
from ..models.ai_analysis import AIAnalysis
from ..models.user import User
from ..schemas.safety_report import SafetyReportCreate, SafetyReportListItem

def generate_report_reference(db: Session, org_id: str) -> str:
    """Generates an enterprise-formatted report reference ID."""
    count = db.query(SafetyReport).filter(SafetyReport.organization_id == org_id).count() + 1
    org_suffix = org_id.upper().replace("-", "")
    return f"REP-{org_suffix}-{count:04d}"

def create_report(db: Session, report_data: SafetyReportCreate, user: User) -> SafetyReport:
    """Creates a new safety report under the authenticated user's organization."""
    ref_id = generate_report_reference(db, user.organization_id)
    
    # Normalize report type string
    norm_type = report_data.report_type.upper().replace("-", "_").replace(" ", "_")
    if norm_type not in ["UNSAFE_ACT", "UNSAFE_CONDITION", "NEAR_MISS"]:
        norm_type = "UNSAFE_CONDITION"

    db_report = SafetyReport(
        report_reference=ref_id,
        organization_id=user.organization_id,
        user_id=user.id,
        report_type=norm_type,
        description=report_data.description.strip(),
        location=report_data.location.strip(),
        report_date=report_data.report_date.strip(),
        additional_context=report_data.additional_context.strip() if report_data.additional_context else None,
        analysis_status=AnalysisStatusEnum.PENDING.value
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_organization_reports(
    db: Session,
    org_id: str,
    search: Optional[str] = None,
    report_type: Optional[str] = None,
    analysis_status: Optional[str] = None
) -> List[SafetyReportListItem]:
    """Retrieves all reports strictly isolated to the authenticated organization."""
    query = db.query(SafetyReport).filter(SafetyReport.organization_id == org_id)

    if report_type and report_type.upper() != "ALL":
        query = query.filter(SafetyReport.report_type == report_type.upper())
    
    if analysis_status and analysis_status.upper() != "ALL":
        query = query.filter(SafetyReport.analysis_status == analysis_status.upper())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (SafetyReport.report_reference.ilike(term)) |
            (SafetyReport.description.ilike(term)) |
            (SafetyReport.location.ilike(term))
        )

    reports = query.order_by(desc(SafetyReport.created_at)).all()
    
    result = []
    for r in reports:
        sif_assessment = None
        identified_hazard = None
        if r.ai_analysis:
            sif_assessment = r.ai_analysis.sif_precursor_assessment
            identified_hazard = r.ai_analysis.identified_hazard
            
        result.append(SafetyReportListItem(
            id=r.id,
            report_reference=r.report_reference,
            organization_id=r.organization_id,
            report_type=r.report_type,
            description=r.description,
            location=r.location,
            report_date=r.report_date,
            additional_context=r.additional_context,
            analysis_status=r.analysis_status,
            sif_precursor_assessment=sif_assessment,
            identified_hazard=identified_hazard,
            created_at=r.created_at
        ))
    return result

def get_report_by_id(db: Session, report_id: int, org_id: str) -> Optional[SafetyReport]:
    """Gets safety report ensuring strict organization ownership."""
    return db.query(SafetyReport).filter(
        SafetyReport.id == report_id,
        SafetyReport.organization_id == org_id
    ).first()

def find_duplicate_report(
    db: Session,
    org_id: str,
    report_data: SafetyReportCreate
) -> Optional[SafetyReport]:
    """
    Finds an existing report in the database matching the composite duplicate key:
    organization_id + report_date + normalized location + normalized report_type + normalized description.
    """
    clean_date = report_data.report_date.strip()
    norm_type = report_data.report_type.upper().replace("-", "_").replace(" ", "_")
    if norm_type not in ["UNSAFE_ACT", "UNSAFE_CONDITION", "NEAR_MISS"]:
        norm_type = "UNSAFE_CONDITION"

    norm_target_loc = " ".join(report_data.location.strip().lower().split())
    norm_target_desc = " ".join(report_data.description.strip().lower().split())

    # Filter by indexed fields first: organization_id, report_date, report_type
    candidates = db.query(SafetyReport).filter(
        SafetyReport.organization_id == org_id,
        SafetyReport.report_date == clean_date,
        SafetyReport.report_type == norm_type
    ).all()

    for candidate in candidates:
        candidate_loc = " ".join((candidate.location or "").strip().lower().split())
        candidate_desc = " ".join((candidate.description or "").strip().lower().split())
        if candidate_loc == norm_target_loc and candidate_desc == norm_target_desc:
            return candidate

    return None
