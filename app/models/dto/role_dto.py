from pydantic import BaseModel


class RoleBase(BaseModel):
    name: str


class RoleDTO(RoleBase):
    id: int

