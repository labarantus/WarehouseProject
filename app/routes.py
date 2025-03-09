from fastapi import APIRouter, HTTPException, status, Request, Response
from starlette.responses import RedirectResponse
from app.services import service
from .config import SessionLocal
from models.dto.product_dto import ProductDTO, ProductBase
from models.dto.warehouse_dto import WarehouseDTO, WarehouseBase
from models.dto.category_dto import CategoryDTO, CategoryBase
from models.dto.user_dto import UserDTO, UserBase
from models.dto.role_dto import RoleDTO, RoleBase
from models.dto.transaction_dto import TransactionDTO, TransactionBase, TypeTransactionDTO

router = APIRouter(prefix='/api', tags=['Warehouse API'])  # подключаем данный роутер к корневому адресу /api


@router.get('/')
async def root():
    """ Переадресация на страницу Swagger """
    return RedirectResponse(url='/docs', status_code=307)


''' Все get методы ниже '''


@router.get('/get_product_by_id/{product_id}')
async def get_product_by_id(product_id: int):
    """ Получение продукта по ID """
    with SessionLocal() as session:
        return service.get_product_by_id(session, product_id)

@router.get('/get_product_all')
async def get_product_all():
    """ Получение продукта по ID """
    with SessionLocal() as session:
        return service.get_product_all(session)

@router.get('/get_warehouse_by_id/{warehouse_id}')
async def get_warehouse_by_id(warehouse_id: int):
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_warehouse_by_id(session, warehouse_id)


@router.get('/get_category_by_id/{category_id}')
async def get_category_by_id(category_id: int):
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_category_by_id(session, category_id)


@router.get('/get_user_by_login/{login}')
async def get_user_by_login(login: str):
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_user_by_login(session, login)


@router.get('/get_transaction_by_product_id/{product_id}')
async def get_transaction_by_product_id(product_id: int):
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_transaction_by_product_id(session, product_id)


''' Все get методы закончены '''

''' Все create методы ниже '''


@router.post('/create_product', status_code=201)
async def create_product(product: ProductBase):
    with SessionLocal() as session:
        """ Создание товара """
        return service.create_product(session,
                                      name=product.name,
                                      price=product.price,
                                      id_warehouse=product.id_warehouse,
                                      id_category=product.id_category)


@router.post('/create_warehouse', status_code=201)
async def create_warehouse(warehouse: WarehouseBase):
    """ Создание склада """
    with SessionLocal() as session:
        return service.create_warehouse(session, warehouse.address, warehouse.name)


@router.post('/create_category', status_code=201)
async def create_category(category: CategoryBase):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.create_category(session, id_warehouse=category.id_warehouse, name=category.name)


@router.post('/create_user', status_code=201)
async def create_user(user: UserBase):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.create_user(session, login=user.login, password=user.password, id_role=user.id_role)


@router.post('/create_role', status_code=201)
async def create_role(role: RoleBase):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.add_role(session, role_name=role.name)


# @router.post('/add_transaction_type', status_code=201)
# async def add_transaction_type(transaction_type: TypeTransactionDTO):
#     """ Создание категории товара """
#     with SessionLocal() as session:
#         return service.add_transaction_type(session, transaction_type)


@router.post('/add_transaction', status_code=201)
async def add_transaction(transaction: TransactionBase):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.create_transaction(session,
                                          id_type=transaction.id_type,
                                          price=transaction.price,
                                          id_product=transaction.id_product,
                                          amount=transaction.amount,
                                          id_user=transaction.id_user)


""" Create-методы закончены """

"""Прочие методы (delete, update)"""


@router.delete('/delete_product_by_id', status_code=201)
async def delete_product_by_id(product_id: int):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.delete_product_by_id(session, product_id)
@router.delete('/delete_user_by_login', status_code=201)
async def delete_user_by_login(login: str):
    with SessionLocal() as session:
        return service.delete_user(session, login)


@router.put('/update_product_name', status_code=201)
async def update_product_name(product_id: int, new_name: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_product_name(session, product_id, new_name)


@router.put('/update_warehouse_name', status_code=201)
async def update_warehouse_name(warehouse_id: int, new_name: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_warehouse_name(session, warehouse_id, new_name)


@router.put('/update_warehouse_address', status_code=201)
async def update_warehouse_address(warehouse_id: int, new_address: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_warehouse_address(session, warehouse_id, new_address)


@router.put('/update_category_name', status_code=201)
async def update_category_name(category_id: int, new_name: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_category_name(session, category_id, new_name)


@router.put('/update_category_id_warehouse', status_code=201)
async def update_category_id_warehouse(category_id: int, id_warehouse: int):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_category_id_warehouse(session, category_id, id_warehouse)


@router.put('/update_user_password', status_code=201)
async def update_user_password(user_login: str, new_password: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_user_password(session, user_login, new_password)


@router.put('/update_user_role', status_code=201)
async def update_user_role(user_login: str, new_role_id: int):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_user_role(session, user_login, new_role_id)


@router.delete('/delete_transaction_by_product_id', status_code=201)
async def delete_transaction_by_product_id(product_id: int):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.delete_transaction_by_product_id(session, product_id)
