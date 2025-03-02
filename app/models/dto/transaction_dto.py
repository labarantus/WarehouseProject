from datetime import datetime

from pydantic import BaseModel

class TransactionDTO(BaseModel):
    id: int
    type: int
    price: int
    id_product: int
    amount: int
    id_user: int
    created_on: datetime


class TypeTransactionDTO(BaseModel):
    id: int
    name: int
