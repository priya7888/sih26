from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base

class WeakSignalReview(Base):
    __tablename__ = "weak_signal_reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(String(50), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    signal_id = Column(String(50), nullable=False, index=True)
    status = Column(String(50), default="Under Review", nullable=False)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="weak_signal_reviews")
