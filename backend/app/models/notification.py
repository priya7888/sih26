from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(50), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id = Column(Integer, ForeignKey("safety_reports.id", ondelete="SET NULL"), nullable=True, index=True)

    notification_type = Column(String(50), nullable=False, index=True)  # ADMIN_ALERT, RESPONSE_DISPATCH, ESCALATION, DIRECTIVE
    severity = Column(String(50), default="HIGH", nullable=False)       # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    metadata_payload = Column(JSON, nullable=True)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)

    in_app_status = Column(String(50), default="DELIVERED", nullable=False)
    email_status = Column(String(50), default="NOT_CONFIGURED", nullable=False)  # SENT, FAILED, NOT_CONFIGURED, SKIPPED
    push_status = Column(String(50), default="NOT_CONFIGURED", nullable=False)   # SENT, FAILED, NOT_CONFIGURED, SKIPPED

    idempotency_key = Column(String(150), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    recipient = relationship("User", foreign_keys=[recipient_user_id])
    safety_report = relationship("SafetyReport", foreign_keys=[report_id])
    organization = relationship("Organization")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(50), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    endpoint = Column(Text, nullable=False)
    p256dh = Column(String(255), nullable=True)
    auth = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id])
