from pydantic import BaseModel


class CategoryDTO(BaseModel):
    id: int
    id_warehouse: int
    name: str
