from pydantic import BaseModel


class UserBase(BaseModel):
    login: str
    password: str
    id_role: int


class UserDTO(UserBase):
    id: int

class UserRoleUpdate(BaseModel):
    user_login: str
    new_role_id: int

