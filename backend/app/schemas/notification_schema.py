"""Notification schemas."""
from pydantic import BaseModel


class NotificationMarkRead(BaseModel):
    read: bool = True
