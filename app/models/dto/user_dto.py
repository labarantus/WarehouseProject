from pydantic import BaseModel


class UserBase(BaseModel):
    login: str
    password: str
    id_role: int


class UserDTO(UserBase):
    id: int

