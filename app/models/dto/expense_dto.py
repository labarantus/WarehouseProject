from datetime import datetime

from pydantic import BaseModel


class ExpenseBase(BaseModel):
    """ DTO для добавление косвенных затрат"""
    name: str
    description: str
    cost: float


class ExpenseDTO(ExpenseBase):
    id: int
    created_on: datetime
