from __future__ import annotations

from datetime import datetime
from typing import Optional

from beanie import Document, Insert, Replace, SaveChanges, before_event


class TimeStampedDocument(Document):
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    @before_event(Insert)
    async def set_created_timestamp(self):
        now = datetime.utcnow()
        if self.createdAt is None:
            self.createdAt = now
        self.updatedAt = now

    @before_event(Replace)
    @before_event(SaveChanges)
    async def set_updated_timestamp(self):
        self.updatedAt = datetime.utcnow()
