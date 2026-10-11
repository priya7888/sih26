from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: str
    recipient_user_id: int
    report_id: Optional[int] = None
    notification_type: str
    severity: str
    title: str
    message: str
    metadata_payload: Optional[Dict[str, Any]] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    in_app_status: str = "DELIVERED"
    email_status: str = "NOT_CONFIGURED"
    push_status: str = "NOT_CONFIGURED"
    idempotency_key: Optional[str] = None
    created_at: datetime

class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    unread_count: int
    total_count: int

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: Optional[str] = None
    auth: Optional[str] = None

class NotificationChannelStatus(BaseModel):
    email_configured: bool
    push_configured: bool
    in_app_enabled: bool = True
    details: Dict[str, Any]
