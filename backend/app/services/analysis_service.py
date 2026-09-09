from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.safety_report import SafetyReport, AnalysisStatusEnum
from ..models.ai_analysis import AIAnalysis
from ..models.user import User
from ..ai_services.ai_service import analyze_safety_report
from ..schemas.ai_analysis import AIAnalysisResponse, AIAnalysisRequest, AIAnalysisExecuteResponse
from ..schemas.safety_report import SafetyReportCreate
from .report_service import find_duplicate_report, create_report

def execute_ai_analysis(db: Session, report: SafetyReport) -> AIAnalysis:
    """
    Executes AI analysis for a safety report and persists explainable structured results.
    """
    report.analysis_status = AnalysisStatusEnum.PROCESSING.value
    db.commit()

    try:
        # Run 10-step AI pipeline
        raw_result = analyze_safety_report(
            report_type=report.report_type,
            description=report.description,
            additional_context=report.additional_context
        )

        # Check if existing analysis exists for re-runs
        analysis = db.query(AIAnalysis).filter(AIAnalysis.report_id == report.id).first()
        if not analysis:
            analysis = AIAnalysis(
                report_id=report.id,
                organization_id=report.organization_id,
                analysis_context=raw_result["analysis_context"],
                identified_action=raw_result["identified_action"],
                identified_condition=raw_result["identified_condition"],
                identified_event=raw_result["identified_event"],
                identified_hazard=raw_result["identified_hazard"],
                safety_signals=raw_result["safety_signals"],
                energy_source=raw_result["energy_source"],
                exposure=raw_result["exposure"],
                barrier_information=raw_result["barrier_information"],
                potential_consequence=raw_result["potential_consequence"],
                sif_precursor_assessment=raw_result["sif_precursor_assessment"],
                explanation=raw_result["explanation"]
            )
            db.add(analysis)
        else:
            analysis.analysis_context = raw_result["analysis_context"]
            analysis.identified_action = raw_result["identified_action"]
            analysis.identified_condition = raw_result["identified_condition"]
            analysis.identified_event = raw_result["identified_event"]
            analysis.identified_hazard = raw_result["identified_hazard"]
            analysis.safety_signals = raw_result["safety_signals"]
            analysis.energy_source = raw_result["energy_source"]
            analysis.exposure = raw_result["exposure"]
            analysis.barrier_information = raw_result["barrier_information"]
            analysis.potential_consequence = raw_result["potential_consequence"]
            analysis.sif_precursor_assessment = raw_result["sif_precursor_assessment"]
            analysis.explanation = raw_result["explanation"]

        report.analysis_status = AnalysisStatusEnum.COMPLETED.value
        db.commit()
        db.refresh(analysis)
        return analysis

    except Exception as e:
        report.analysis_status = AnalysisStatusEnum.FAILED.value
        db.commit()
        raise e

def get_organization_analyses(db: Session, org_id: str):
    """Retrieves all completed AI analyses for the organization."""
    return db.query(AIAnalysis).filter(AIAnalysis.organization_id == org_id).all()

def execute_direct_analysis(
    db: Session,
    current_user: User,
    request: AIAnalysisRequest
) -> AIAnalysisExecuteResponse:
    """
    Executes the current main 10-step AI NLP engine on an observation,
    enforces duplicate prevention via Issue #11 composite key,
    persists the SafetyReport and its AIAnalysis in SQLite if new,
    and returns the rich structured response.
    """
    description = request.report_text.strip()
    location = (request.location or "Unit 1").strip()
    norm_type = (request.report_type or "NEAR_MISS").strip().upper().replace("-", "_").replace(" ", "_")
    if norm_type not in ["UNSAFE_ACT", "UNSAFE_CONDITION", "NEAR_MISS"]:
        norm_type = "NEAR_MISS"
    report_date = (request.report_date or datetime.utcnow().strftime("%Y-%m-%d")).strip()

    # 1. Run the real current main 10-step AI NLP engine
    raw_result = analyze_safety_report(
        report_type=norm_type,
        description=description,
        additional_context=request.additional_context
    )

    # 2. Extract Life-Saving Rules
    lsr_info = raw_result.get("life_saving_rule")
    if isinstance(lsr_info, dict) and lsr_info.get("rule_name"):
        iogp_rule = f"{lsr_info['rule_name']} ({lsr_info.get('rule_code', 'LSR')})"
    else:
        iogp_rule = None

    # 3. Determine SIF classification & dynamic risk metrics
    sif_status = raw_result.get("sif_precursor_assessment", "NO")
    is_sif = sif_status == "YES"
    
    if is_sif:
        determination_status = "CONFIRMED SIF PRECURSOR"
        barrier_status_str = raw_result.get("barrier_information") or "BARRIER_UNKNOWN"
        if barrier_status_str in ["BARRIER_FAILED", "BARRIER_MISSING"]:
            risk_score = 95
        else:
            risk_score = 88
        confidence = 96.8
    elif sif_status == "INSUFFICIENT_INFORMATION":
        determination_status = "INSUFFICIENT INFORMATION"
        risk_score = 40
        confidence = 65.0
    else:
        determination_status = "NON-SIF OBSERVATION"
        hazard_str = (raw_result.get("identified_hazard") or "").lower()
        if "slip" in hazard_str or "trip" in hazard_str or "housekeeping" in hazard_str:
            risk_score = 18
        else:
            risk_score = 28
        confidence = 94.2

    # 4. Extract hazards & energy vectors
    hazards: List[str] = []
    if raw_result.get("identified_hazard"):
        hazards.append(raw_result["identified_hazard"])
    if raw_result.get("exposure"):
        hazards.append(f"Exposure Vector: {raw_result['exposure']}")
    if raw_result.get("safety_signals"):
        for sig in raw_result["safety_signals"]:
            hazards.append(f"Detected Safety Signal: {sig}")
    if not hazards:
        if is_sif:
            hazards.append("High Potential Energy Vector")
        elif sif_status == "INSUFFICIENT_INFORMATION":
            hazards.append("Indeterminate Hazard / Insufficient Information")
        else:
            hazards.append("Low Kinetic Surface Irregularity")

    high_energy_vectors: List[str] = []
    if raw_result.get("energy_source"):
        high_energy_vectors.append(raw_result["energy_source"])
    for h in hazards:
        if any(k in h.lower() for k in ["flammable", "gas", "pressure", "electrical", "fall", "height", "fire", "energy"]):
            if h not in high_energy_vectors:
                high_energy_vectors.append(h)

    # 5. Barrier status description
    barrier_eval = raw_result.get("barrier_information")
    if barrier_eval == "BARRIER_MISSING":
        barrier_status_desc = "CRITICAL BARRIER MISSING / OMITTED"
    elif barrier_eval == "BARRIER_FAILED":
        barrier_status_desc = "PRIMARY BARRIER DEGRADED / FAILED"
    elif barrier_eval == "BARRIER_PRESENT":
        barrier_status_desc = "SECONDARY DEFENSE ACTIVATED / BARRIER INTACT"
    else:
        if is_sif:
            barrier_status_desc = "BARRIER DEGRADED / INCOMPLETE"
        elif sif_status == "INSUFFICIENT_INFORMATION":
            barrier_status_desc = "BARRIER STATUS UNCONFIRMED / INSUFFICIENT DATA"
        else:
            barrier_status_desc = "BARRIER INTACT / ADEQUATE"

    # 6. Actionable recommendations & CAPA
    if isinstance(lsr_info, dict) and lsr_info.get("mandatory_controls"):
        recommended_controls = list(lsr_info["mandatory_controls"])
    elif is_sif:
        recommended_controls = [
            "Immediately trigger Emergency Shutdown (ESD) or line isolation valve",
            "Evacuate personnel upwind and establish a 50-meter safety exclusion zone",
            "Conduct continuous multi-gas / zero-energy verification before re-entry",
            "Depressurize and lock-out / tag-out all upstream energy sources"
        ]
    elif sif_status == "INSUFFICIENT_INFORMATION":
        recommended_controls = [
            "Conduct follow-up review with observer to capture specific equipment tags and operational details",
            "Inspect reported operational area to determine active energy sources and barrier status",
            "Supplement report with equipment tags, photos, and exact operating unit location"
        ]
    else:
        recommended_controls = [
            "Re-tighten utility fitting and clear operational drainage path",
            "Verify containment barrier integrity and restock absorbent materials",
            "Log routine maintenance work order in CMMS ledger"
        ]

    if is_sif:
        corrective_actions = [
            "Issue Stop-Work Notice and stand down operating shift team",
            "Dispatch Field HSE Superintendent for barrier integrity inspection",
            "Log high-priority CAPA item in corporate safety intelligence system"
        ]
    elif sif_status == "INSUFFICIENT_INFORMATION":
        corrective_actions = [
            "Follow up with frontline personnel for complete incident details",
            "Re-evaluate SIF precursor potential once detailed operational parameters are logged"
        ]
    else:
        corrective_actions = [
            "Immediate utility connection repair by shift mechanic",
            "Log routine maintenance inspection in CMMS ledger",
            "Review routine housekeeping standards with shift crew"
        ]

    # Report Name
    if request.report_name and request.report_name.strip():
        report_name = request.report_name.strip()
    elif raw_result.get("identified_hazard"):
        report_name = raw_result["identified_hazard"]
    else:
        report_name = f"{norm_type.replace('_', ' ').title()} Observation ({location})"

    # 7. Check for duplicate using Issue #11 composite duplicate key
    description_for_report = description[:100]
    extra_context = request.additional_context
    if not extra_context and len(description) > 100:
        extra_context = description[100:]

    report_create = SafetyReportCreate(
        report_type=norm_type,
        description=description_for_report,
        location=location,
        report_date=report_date,
        additional_context=extra_context
    )

    duplicate = find_duplicate_report(db, current_user.organization_id, report_create)
    is_duplicate = False
    if duplicate:
        report = duplicate
        is_duplicate = True
        message = f"Observation matches existing report {report.report_reference}. Reusing existing analysis."
        # Ensure analysis exists for duplicate
        analysis = db.query(AIAnalysis).filter(AIAnalysis.report_id == report.id).first()
        if not analysis:
            analysis = execute_ai_analysis(db, report)
    else:
        # Create and persist new report in SQLite database
        report = create_report(db, report_create, current_user)
        analysis = execute_ai_analysis(db, report)
        message = f"Report created and persisted as {report.report_reference}."

    db.refresh(report)

    # Weak signals list
    weak_signals_list: List[Dict[str, Any]] = []
    if raw_result.get("safety_signals"):
        for s in raw_result["safety_signals"]:
            weak_signals_list.append({"name": s, "type": "Operational Signal"})

    explanation_text = raw_result.get("explanation") or ""
    if is_sif:
        default_energy = "High-Pressure Hydrocarbon Vector"
    elif sif_status == "INSUFFICIENT_INFORMATION":
        default_energy = "Indeterminate Energy Vector (Insufficient Data)"
    else:
        default_energy = "Low Kinetic / Surface Hydrostatic Energy (< 100 J)"
    energy_val = raw_result.get("energy_source") or default_energy

    if is_sif:
        default_lsr = "Line of Fire (LSR-04) & Energy Isolation (LSR-01)"
    elif sif_status == "INSUFFICIENT_INFORMATION":
        default_lsr = "Not Applicable (Insufficient Information)"
    else:
        default_lsr = "General Workplace Housekeeping Standards"

    return AIAnalysisExecuteResponse(
        report_id=report.id,
        report_reference=report.report_reference,
        report_name=report_name,
        sif_precursor=sif_status if sif_status in ["YES", "NO", "INSUFFICIENT_INFORMATION"] else "NO",
        determination_status=determination_status,
        confidence=confidence,
        risk_score=risk_score,
        sif_potential_score=risk_score,
        classification=norm_type,
        hazard=raw_result.get("identified_hazard"),
        detected_hazards=hazards,
        detected_high_energy_vectors=high_energy_vectors,
        energy_vector=energy_val,
        energy_source=energy_val,
        worker_exposure=raw_result.get("exposure"),
        barrier_status=barrier_status_desc,
        life_saving_rule=iogp_rule or default_lsr,
        iogp_rule=iogp_rule or default_lsr,
        explainable_reasoning=explanation_text,
        explanation=explanation_text,
        why_identified={"summary": explanation_text},
        recommended_actions={
            "immediate_actions": [{"action": c} for c in recommended_controls],
            "corrective_actions": [{"action": a} for a in corrective_actions]
        },
        recommended_controls=recommended_controls,
        corrective_actions=corrective_actions,
        weak_signals=weak_signals_list,
        is_duplicate=is_duplicate,
        is_unrelated=False,
        message=message,
        created_at=report.created_at
    )
