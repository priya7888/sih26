from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field

class AIAnalysisResponse(BaseModel):
    id: int
    report_id: int
    organization_id: str
    analysis_context: Optional[str] = None
    identified_action: Optional[str] = None
    identified_condition: Optional[str] = None
    identified_event: Optional[str] = None
    identified_hazard: Optional[str] = None
    safety_signals: Optional[List[str]] = []
    energy_source: Optional[str] = None
    exposure: Optional[str] = None
    barrier_information: Optional[str] = None
    potential_consequence: Optional[str] = None
    sif_precursor_assessment: str # YES, NO, INSUFFICIENT_INFORMATION
    explanation: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AIAnalysisRequest(BaseModel):
    report_text: str = Field(..., min_length=5, description="Field description of safety observation")
    report_name: Optional[str] = None
    report_type: Optional[str] = Field(default="NEAR_MISS", description="UNSAFE_ACT, UNSAFE_CONDITION, NEAR_MISS")
    location: Optional[str] = Field(default="Unit 1", min_length=2)
    site: Optional[str] = None
    report_date: Optional[str] = None
    additional_context: Optional[str] = None

class AIAnalysisExecuteResponse(BaseModel):
    report_id: Optional[int] = None
    report_reference: Optional[str] = None
    report_name: str
    sif_precursor: str  # "YES", "NO", "INSUFFICIENT_INFORMATION"
    determination_status: str
    confidence: Union[float, str, int] = 0
    risk_score: int = 0
    sif_potential_score: int = 0
    classification: Optional[str] = "Near Miss"
    hazard: Optional[str] = None
    detected_hazards: List[str] = []
    detected_high_energy_vectors: List[str] = []
    energy_vector: Optional[str] = None
    energy_source: Optional[str] = None
    worker_exposure: Optional[str] = None
    barrier_status: Optional[str] = None
    life_saving_rule: Optional[str] = None
    iogp_rule: Optional[str] = None
    explainable_reasoning: Optional[str] = None
    explanation: Optional[str] = None
    why_identified: Optional[Dict[str, Any]] = None
    recommended_controls: List[str] = []
    corrective_actions: List[str] = []
    recommended_actions: Optional[Dict[str, Any]] = None
    weak_signals: List[Dict[str, Any]] = []
    is_duplicate: bool = False
    is_unrelated: bool = False
    message: Optional[str] = None
    created_at: Optional[datetime] = None
