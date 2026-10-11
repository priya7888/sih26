from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models.user import User
from ..models.notification import Notification, PushSubscription
from ..schemas.notification import (
    NotificationResponse, 
    NotificationListResponse, 
    PushSubscriptionCreate,
    NotificationChannelStatus
)
from ..dependencies import get_current_user
from ..config import settings

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListResponse)
def list_user_notifications(
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves notifications strictly addressed to the authenticated user.
    Workers cannot access other workers' or admins' notifications;
    Response teams only see alerts dispatched to them.
    """
    base_query = db.query(Notification).filter(
        Notification.organization_id == current_user.organization_id,
        Notification.recipient_user_id == current_user.id
    )

    unread_count = base_query.filter(Notification.is_read == False).count()
    total_count = base_query.count()

    query = base_query
    if unread_only:
        query = query.filter(Notification.is_read == False)

    # Handle both direct Python calls (where defaults may be Query instances) and FastAPI requests
    unread_only = unread_only if isinstance(unread_only, bool) else getattr(unread_only, "default", False)
    limit = limit if isinstance(limit, int) else getattr(limit, "default", 50)
    offset = offset if isinstance(offset, int) else getattr(offset, "default", 0)

    items = query.order_by(desc(Notification.created_at)).offset(offset).limit(limit).all()

    return NotificationListResponse(
        items=items,
        unread_count=unread_count,
        total_count=total_count
    )


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fast endpoint returning the unread notification count for badge counters."""
    count = db.query(Notification).filter(
        Notification.organization_id == current_user.organization_id,
        Notification.recipient_user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a single notification as read, ensuring strict ownership validation."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.organization_id == current_user.organization_id
    ).first()

    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found."
        )

    # Strictly enforce that only the recipient can mark it as read
    if notif.recipient_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to access this notification."
        )

    if not notif.is_read:
        notif.is_read = True
        notif.read_at = datetime.utcnow()
        db.commit()
        db.refresh(notif)

    return notif


@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks all pending unread notifications for current user as read."""
    unread_notifs = db.query(Notification).filter(
        Notification.organization_id == current_user.organization_id,
        Notification.recipient_user_id == current_user.id,
        Notification.is_read == False
    ).all()

    now = datetime.utcnow()
    for n in unread_notifs:
        n.is_read = True
        n.read_at = now

    db.commit()
    return {"success": True, "marked_count": len(unread_notifs)}


@router.post("/push-subscription")
def register_push_subscription(
    payload: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stores or updates browser Web Push credentials for background push delivery."""
    existing = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == payload.endpoint
    ).first()

    if existing:
        existing.p256dh = payload.p256dh
        existing.auth = payload.auth
        db.commit()
    else:
        new_sub = PushSubscription(
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            endpoint=payload.endpoint,
            p256dh=payload.p256dh,
            auth=payload.auth
        )
        db.add(new_sub)
        db.commit()

    return {"success": True, "message": "Push subscription stored successfully."}


@router.get("/status", response_model=NotificationChannelStatus)
def get_channel_status(
    current_user: User = Depends(get_current_user)
):
    """Returns the operational status of configured delivery channels."""
    email_ready = bool(settings.EMAIL_ENABLED and settings.SMTP_HOST)
    push_ready = bool(settings.VAPID_PUBLIC_KEY and settings.VAPID_PRIVATE_KEY)

    return NotificationChannelStatus(
        email_configured=email_ready,
        push_configured=push_ready,
        in_app_enabled=True,
        details={
            "email_sender": settings.EMAILS_FROM_EMAIL if email_ready else None,
            "smtp_host": settings.SMTP_HOST if email_ready else None,
            "vapid_public_key": settings.VAPID_PUBLIC_KEY if push_ready else None,
            "vapid_claim_email": settings.VAPID_CLAIM_EMAIL if push_ready else None,
            "in_app_status": "ONLINE"
        }
    )
