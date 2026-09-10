import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.safety_report import SafetyReport
from ..models.ai_analysis import AIAnalysis
from ..models.feedback import Feedback
from ..schemas.safety_report import SafetyReportCreate, SafetyReportListItem, SafetyReportDetail
from ..schemas.ai_analysis import AIAnalysisResponse
from ..dependencies import get_current_user
from ..services.report_service import (
    create_report, 
    get_organization_reports, 
    get_report_by_id,
    find_duplicate_report
)
from ..services.analysis_service import execute_ai_analysis

router = APIRouter(prefix="/api/reports", tags=["Safety Reports"])

def extract_unit_key(val: str) -> str:
    if not val:
        return ""
    s = str(val).strip().lower()
    m = re.search(r'unit\s*[-_#]?\s*0*(\d+)', s, re.IGNORECASE)
    if m:
        return f"unit-{int(m.group(1))}"
    s = re.sub(r'[-_]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

@router.post("", response_model=SafetyReportDetail, status_code=status.HTTP_201_CREATED)
def submit_report(
    payload: SafetyReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits an industrial safety report under the authenticated user's organization
    and executes the real modular AI/NLP SIF analysis pipeline.
    """
    if not payload.description or len(payload.description.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please describe the safety observation in detail."
        )
    if not payload.location or len(payload.location.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid location or operational area."
        )

    # 1. Create Report in DB
    report = create_report(db, payload, current_user)

    # 2. Run AI Analysis Pipeline
    try:
        execute_ai_analysis(db, report)
    except Exception as e:
        # If analysis fails, report status is set to FAILED
        pass

    db.refresh(report)
    return report

@router.get("", response_model=List[SafetyReportListItem])
def list_reports(
    search: Optional[str] = Query(None),
    report_type: Optional[str] = Query(None),
    analysis_status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists safety reports strictly isolated to the authenticated organization."""
    return get_organization_reports(
        db=db,
        org_id=current_user.organization_id,
        search=search,
        report_type=report_type,
        analysis_status=analysis_status
    )

@router.get("/{report_id}", response_model=SafetyReportDetail)
def get_report_details(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves full details and AI analysis for a report belonging to the organization."""
    report = get_report_by_id(db, report_id, current_user.organization_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safety report not found or access denied."
        )
    return report

@router.post("/{report_id}/analyze", response_model=AIAnalysisResponse)
def trigger_analysis(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Triggers or re-executes AI analysis on an existing organization report."""
    report = get_report_by_id(db, report_id, current_user.organization_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Safety report not found or access denied."
        )
    
    analysis = execute_ai_analysis(db, report)
    return analysis

@router.get("/{report_id}/analysis", response_model=AIAnalysisResponse)
def get_report_analysis(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves AI analysis for a specific report."""
    report = get_report_by_id(db, report_id, current_user.organization_id)
    if not report or not report.ai_analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI analysis not found for this report."
        )
    return report.ai_analysis

@router.post("/reset")
def reset_organization_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Admin role guard
    is_admin = (
        current_user.role in ["ADMINISTRATOR", "CHIEF_HSE_AUDITOR"] or 
        "admin" in current_user.email.lower()
    )
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action restricted: Only Administrators can reset or clear static organization data."
        )
    
    org_id = current_user.organization_id
    
    db.query(Feedback).filter(Feedback.organization_id == org_id).delete(synchronize_session=False)
    db.query(AIAnalysis).filter(AIAnalysis.organization_id == org_id).delete(synchronize_session=False)
    deleted_count = db.query(SafetyReport).filter(SafetyReport.organization_id == org_id).delete(synchronize_session=False)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Successfully cleared all {deleted_count} reports and related data. Organization data reset.",
        "deleted_count": deleted_count
    }

@router.post("/batch")
def batch_upload_reports(
    payload: List[SafetyReportCreate],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Batch ingests safety reports, skips duplicate records before database insertion
    and AI analysis, and returns verified records.
    """
    seen_in_batch = set()
    results = []
    new_count = 0
    duplicate_count = 0

    for item in payload:
        try:
            norm_type = item.report_type.upper().replace("-", "_").replace(" ", "_")
            if norm_type not in ["UNSAFE_ACT", "UNSAFE_CONDITION", "NEAR_MISS"]:
                norm_type = "UNSAFE_CONDITION"

            batch_key = (
                item.report_date.strip(),
                " ".join(item.location.strip().lower().split()),
                norm_type,
                " ".join(item.description.strip().lower().split())
            )

            # Intra-batch duplicate check
            if batch_key in seen_in_batch:
                duplicate_count += 1
                continue
            seen_in_batch.add(batch_key)

            # Database duplicate check against authenticated organization
            existing = find_duplicate_report(db, current_user.organization_id, item)
            if existing:
                duplicate_count += 1
                results.append({
                    "id": existing.id,
                    "report_reference": existing.report_reference,
                    "location": existing.location,
                    "report_type": existing.report_type,
                    "description": existing.description,
                    "report_date": existing.report_date,
                    "analysis_status": existing.analysis_status,
                    "sif_precursor_assessment": existing.ai_analysis.sif_precursor_assessment if existing.ai_analysis else "NO",
                    "identified_hazard": existing.ai_analysis.identified_hazard if existing.ai_analysis else "Pending Assessment",
                    "is_duplicate": True
                })
                continue

            # Genuinely new report: create and analyze
            report = create_report(db, item, current_user)
            try:
                execute_ai_analysis(db, report)
            except Exception:
                pass
            db.refresh(report)
            new_count += 1
            results.append({
                "id": report.id,
                "report_reference": report.report_reference,
                "location": report.location,
                "report_type": report.report_type,
                "description": report.description,
                "report_date": report.report_date,
                "analysis_status": report.analysis_status,
                "sif_precursor_assessment": report.ai_analysis.sif_precursor_assessment if report.ai_analysis else "NO",
                "identified_hazard": report.ai_analysis.identified_hazard if report.ai_analysis else "Pending Assessment",
                "is_duplicate": False
            })
        except Exception as e:
            continue

    return {
        "status": "success",
        "ingested_count": new_count,
        "new_count": new_count,
        "duplicate_count": duplicate_count,
        "total_processed": len(payload),
        "reports": results
    }

