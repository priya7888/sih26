from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.ai_analysis import AIAnalysisResponse, AIAnalysisRequest, AIAnalysisExecuteResponse
from ..dependencies import get_current_user
from ..services.analysis_service import get_organization_analyses, execute_direct_analysis
from ..ai_services.ai_service import analyze_safety_report

router = APIRouter(prefix="/api/analysis", tags=["AI Analysis"])
ai_analysis_router = APIRouter(prefix="/api/ai-analysis", tags=["AI Analysis"])

class LiveAnalysisRequest(BaseModel):
    report_text: str
    report_name: Optional[str] = None
    report_type: Optional[str] = "Near Miss"
    location: Optional[str] = "Unit 1"
    site: Optional[str] = None
    report_date: Optional[str] = None

def calculate_dynamic_risk(hazard: Optional[str], energy: Optional[str], exposure: Optional[str], barrier_status: str, sif: str, text: str) -> int:
    sev = 10
    if hazard:
        h_low = hazard.lower()
        if any(k in h_low for k in ["arc flash", "electrical", "explosion", "gas leak", "flammable", "suspended load", "dropped object", "amputation"]):
            sev = 28
        elif any(k in h_low for k in ["fall from height", "work at height", "excavation", "fire", "chemical"]):
            sev = 24
        elif "slip" in h_low or "trip" in h_low:
            sev = 8
    
    ene = 5
    if energy and energy != "Insufficient Information":
        e_low = energy.lower()
        if any(k in e_low for k in ["high-voltage", "arc flash", "pneumatic", "pressure", "toxic", "thermal"]):
            ene = 24
        elif "gravity / kinetic" in e_low or "low kinetic" in e_low:
            ene = 5
        elif "gravity" in e_low or "kinetic" in e_low:
            ene = 15

    exp = 5
    if exposure and exposure != "Insufficient Information":
        ex_low = exposure.lower()
        if any(k in ex_low for k in ["line-of-fire", "direct physical proximity", "fall edge"]):
            exp = 18
        elif "slip/fall exposure" in ex_low:
            exp = 6

    bar = 4
    if barrier_status in ["BARRIER_FAILED", "Barrier Failed"]:
        bar = 15
    elif barrier_status in ["BARRIER_MISSING", "Barrier Missing"]:
        bar = 13
    elif barrier_status in ["BARRIER_PRESENT", "Barrier Intact"]:
        bar = 2
    else:
        bar = 4

    esc = 3
    t_low = text.lower()
    if any(k in t_low for k in ["flame", "smoke", "hiss", "pressure", "high", "spreading"]):
        esc = 9
    elif any(k in t_low for k in ["stairs", "steps", "edge", "ramp"]):
        esc = 5
    elif any(k in t_low for k in ["water", "oil", "grease", "spill"]):
        esc = 4

    total = sev + ene + exp + bar + esc
    return max(0, min(100, total))

def generate_dynamic_recommendations(hazard: Optional[str], text: str) -> List[str]:
    h_low = (hazard or "").lower()
    t_low = text.lower()
    if "slip" in h_low or "slip" in t_low or "slippery" in t_low:
        return [
            "Clean and dry the affected area.",
            "Identify and correct the source of moisture.",
            "Place warning signage if the area remains slippery.",
            "Verify the area during routine inspection."
        ]
    elif "electrical" in h_low or "arc" in h_low:
        return [
            "De-energize electrical circuit and perform Lockout/Tagout (LOTO).",
            "Verify zero voltage using a calibrated test instrument before contact.",
            "Inspect enclosure, insulation, and conductors for thermal damage.",
            "Mandate qualified electrical PPE per NFPA 70E standards."
        ]
    elif "gas" in h_low or "pressure" in h_low or "pipe" in h_low:
        return [
            "Isolate upstream supply valve and depressurize affected line segment.",
            "Evacuate area and perform continuous atmospheric gas testing (0% LEL).",
            "Inspect flange gasket, valve seals, and fittings for degradation.",
            "Establish safety exclusion perimeter until re-pressurization tests pass."
        ]
    elif "height" in h_low or "fall" in h_low or "scaffold" in h_low:
        return [
            "Ensure certified 100% tie-off with inspected harness and lanyard.",
            "Install top-rail, mid-rail, and toe-board fall protection barriers.",
            "Red-tag scaffold or ladder until certified inspection sign-off.",
            "Clear walkway of trip hazards and verify secure planking."
        ]
    elif "load" in h_low or "crane" in h_low or "rigging" in h_low:
        return [
            "Barricade drop zone and prohibit personnel from walking under suspended loads.",
            "Inspect rigging slings, hooks, and shackles for wear before lifting.",
            "Verify crane operator and rigger certifications and review lift plan.",
            "Use tag lines to control load swing from a safe distance."
        ]
    elif "chemical" in h_low:
        return [
            "Deploy chemical spill kit and contain runoff with compatible absorbent.",
            "Wear appropriate chemical-resistant gloves, goggles, and respiratory PPE.",
            "Review Safety Data Sheet (SDS) for specific neutralization protocols.",
            "Ventilate area and verify integrity of primary chemical containers."
        ]
    else:
        return [
            "Conduct immediate walkdown inspection to identify hazard root cause.",
            "Implement appropriate physical controls and warning demarcation.",
            "Verify area condition during regular shift safety inspections.",
            "Log findings in facility safety maintenance tracking register."
        ]

import re

SAFETY_KEYWORDS_PATTERN = re.compile(
    r'\b(leak|leaking|seepage|gas|fire|flame|smoke|spark|explosion|blast|burn|flash|'
    r'spill|blowout|hazard|unsafe|danger|risk|incident|injury|injured|wound|fatality|fatal|'
    r'precursor|sif|near miss|accident|damage|defect|rupture|burst|crack|collapse|corrosion|'
    r'rust|slip|slipping|slipped|trip|tripping|tripped|fall|falling|fell|dropped|pinch|crush|'
    r'struck|whipping|flying|sharp|cut|electrical|electric|voltage|11kv|415v|wire|arc|cable|'
    r'breaker|panel|switch|switchgear|switchboard|transformer|loto|lockout|tagout|isolation|'
    r'isolate|isolated|shock|valve|pipe|pipeline|flange|gasket|tank|cylinder|pressure|relief|'
    r'hiss|manifold|vessel|boiler|steam|hydraulic|pneumatic|toxic|chemical|acid|caustic|'
    r'h2s|hydrocarbon|fume|vapor|confined|crane|lift|lifting|hoist|rigging|sling|shackle|'
    r'derrick|rig|drill|casing|scaffold|scaffolding|ladder|height|catwalk|grating|deck|'
    r'guardrail|harness|lanyard|barrier|barricade|guard|interlock|e-stop|alarm|ppe|helmet|'
    r'goggle|gloves|respirator|permit|ptw|pump|compressor|turbine|generator|forklift|truck|'
    r'vehicle|trailer|reversing|excavat|trench|housekeeping|puddle)\b',
    re.IGNORECASE
)

CONVERSATIONAL_PATTERN = re.compile(
    r'\b(beautiful|handsome|gorgeous|cute|pretty|sweet|sexy|'
    r'how are you|who are you|what is your name|love you|hate you|'
    r'good morning|good afternoon|good evening|good night|thank you|thanks|'
    r'you are|tell me a joke|weather|movie|music|hello|hey|yo)\b',
    re.IGNORECASE
)

def is_unrelated_input(text: str) -> bool:
    if not text:
        return True
    cleaned = text.strip()
    if len(cleaned) < 4:
        return True
    if CONVERSATIONAL_PATTERN.search(cleaned) and not SAFETY_KEYWORDS_PATTERN.search(cleaned):
        return True
    if not SAFETY_KEYWORDS_PATTERN.search(cleaned):
        return True
    return False

def handle_live_analysis(payload: LiveAnalysisRequest) -> Dict[str, Any]:
    text = payload.report_text.strip()
    r_type = payload.report_type or "Near Miss"

    # Intercept unrelated, conversational, or non-safety inputs
    if is_unrelated_input(text):
        return {
            "is_unrelated": True,
            "report_name": "Enter Correct Issue",
            "determination_status": "UNRELATED INPUT",
            "sif_precursor": "NO",
            "sif_potential_score": 0,
            "confidence": 0,
            "detected_hazards": [
                "Observation does not contain recognized industrial safety hazards or equipment context",
                "Zero physical energy vectors or critical barrier failures found in input"
            ],
            "energy_vector": "None Identified",
            "worker_exposure": "Not Applicable",
            "barrier_status": "Not Applicable (Unrelated Input)",
            "life_saving_rule": "Not Applicable",
            "recommendations": [
                "Enter a correct safety issue describing equipment, location, and conditions",
                "Include specific hazard parameters (e.g. pressure, voltage, chemical, elevation)"
            ],
            "corrective_actions": [
                "Provide frontline coaching on entering actionable safety observations"
            ],
            "explanation": f'The input "{text}" is not recognized as a related operational safety issue. Please enter a correct safety issue describing equipment, location, barrier conditions, or hazardous energy vectors.'
        }
    
    # Run 10-step AI pipeline
    raw_result = analyze_safety_report(
        report_type=r_type,
        description=text,
        additional_context=f"Location: {payload.location or 'Unit 1'}"
    )

    hazard = raw_result.get("identified_hazard") or "Insufficient Information"
    energy = raw_result.get("energy_source") or "Insufficient Information"
    exposure = raw_result.get("exposure") or "Insufficient Information"
    barrier_raw = raw_result.get("barrier_information") or "BARRIER_INSUFFICIENT_INFO"
    
    if barrier_raw == "BARRIER_FAILED":
        barrier_display = "Failed"
    elif barrier_raw == "BARRIER_MISSING":
        barrier_display = "Missing / Not Deployed"
    elif barrier_raw == "BARRIER_PRESENT":
        barrier_display = "Intact / Functioning"
    else:
        barrier_display = "Insufficient Information"

    sif_assessment = raw_result.get("sif_precursor_assessment", "NO")
    if sif_assessment in ["YES", "SIF"]:
        determination = "CONFIRMED SIF PRECURSOR"
        sif_val = "YES"
    elif sif_assessment == "INSUFFICIENT_INFORMATION":
        determination = "INSUFFICIENT INFORMATION"
        sif_val = "INSUFFICIENT_INFORMATION"
    else:
        determination = "NON-SIF"
        sif_val = "NO"

    risk_score = calculate_dynamic_risk(hazard, energy, exposure, barrier_raw, sif_val, text)
    recommendations = generate_dynamic_recommendations(hazard, text)

    # Dynamic confidence
    words = len(text.split())
    if words < 3 or (hazard == "Insufficient Information" and energy == "Insufficient Information"):
        confidence = "Not Available"
    else:
        # Grounded confidence calculated from completeness and match clarity
        score_base = 82.0
        if hazard != "Insufficient Information": score_base += 6.5
        if energy != "Insufficient Information": score_base += 4.5
        if barrier_display != "Insufficient Information": score_base += 3.5
        confidence = min(96.8, round(score_base, 1))

    detected_items = [
        f"Hazard: {hazard}",
        f"Energy Vector: {energy}",
        f"Worker Exposure: {exposure}",
        f"Barrier Status: {barrier_display}"
    ]

    return {
        "report_name": payload.report_name or f"Safety Observation ({payload.location or 'Unit 1'})",
        "determination_status": determination,
        "sif_precursor": sif_val,
        "sif_potential_score": risk_score,
        "confidence": confidence,
        "hazard": hazard,
        "energy_vector": energy,
        "worker_exposure": exposure,
        "barrier_status": barrier_display,
        "detected_high_energy_vectors": detected_items,
        "detected_hazards": detected_items,
        "recommended_controls": recommendations,
        "recommended_actions": {
            "immediate_actions": [{"action": a} for a in recommendations[:2]],
            "corrective_actions": [{"action": a} for a in recommendations[2:]]
        },
        "why_identified": {
            "summary": raw_result.get("explanation", "No evidence of high-energy exposure, significant worker exposure, or barrier deficiency was identified from the available report information.")
        },
        "explanation": raw_result.get("explanation", "No evidence of high-energy exposure, significant worker exposure, or barrier deficiency was identified from the available report information."),
        "weak_signals": []
    }

@router.post("/analyze", response_model=AIAnalysisExecuteResponse)
def analyze_safety_observation(
    payload: AIAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Canonical direct AI Analysis endpoint:
    Intercepts conversational/non-safety inputs, executes the 10-step AI NLP engine,
    persists new SafetyReport and AIAnalysis in SQLite, and skips duplicates via Issue #11 composite key.
    """
    if not payload.report_text or len(payload.report_text.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Safety observation description must be at least 5 characters."
        )
    if not payload.location or len(payload.location.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid operating unit or location."
        )

    text = payload.report_text.strip()
    if is_unrelated_input(text):
        return AIAnalysisExecuteResponse(
            report_name="Enter Correct Issue",
            determination_status="UNRELATED INPUT",
            sif_precursor="NO",
            confidence=0,
            risk_score=0,
            sif_potential_score=0,
            classification=payload.report_type or "Near Miss",
            detected_hazards=[
                "Observation does not contain recognized industrial safety hazards or equipment context",
                "Zero physical energy vectors or critical barrier failures found in input"
            ],
            energy_source="None Identified",
            barrier_status="Not Applicable (Unrelated Input)",
            life_saving_rule="Not Applicable",
            iogp_rule="Not Applicable",
            explainable_reasoning=f'The input "{text}" is not recognized as a related operational safety issue. Please enter a correct safety issue describing equipment, location, barrier conditions, or hazardous energy vectors.',
            explanation=f'The input "{text}" is not recognized as a related operational safety issue. Please enter a correct safety issue describing equipment, location, barrier conditions, or hazardous energy vectors.',
            why_identified={"summary": "Unrelated non-safety input"},
            recommended_controls=[
                "Enter a correct safety issue describing equipment, location, and conditions",
                "Include specific hazard parameters (e.g. pressure, voltage, chemical, elevation)"
            ],
            corrective_actions=[
                "Provide frontline coaching on entering actionable safety observations"
            ],
            is_unrelated=True,
            message="Unrelated or conversational input. No safety report created."
        )

    try:
        return execute_direct_analysis(db, current_user, payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis execution failed: {str(e)}"
        )

@ai_analysis_router.post("/analyze", response_model=AIAnalysisExecuteResponse)
def analyze_safety_observation_alias(
    payload: AIAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compatibility alias routing to canonical analysis handler."""
    return analyze_safety_observation(payload, current_user, db)

@router.get("", response_model=List[AIAnalysisResponse])
def list_completed_analyses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all completed AI analyses belonging to the authenticated organization."""
    return get_organization_analyses(db, current_user.organization_id)
