from datetime import datetime

from pydantic import BaseModel


class WarehouseDTO(BaseModel):
    id: int
    address: str
    name: str
    created_on: datetime
