from fastapi import APIRouter, HTTPException, status, Request, Response
from starlette.responses import RedirectResponse
from app.services import service
from .config import SessionLocal
from models.dto.product_dto import ProductDTO, ProductBase
from models.dto.warehouse_dto import WarehouseDTO, WarehouseBase
from models.dto.category_dto import CategoryDTO, CategoryBase
from models.dto.user_dto import UserDTO, UserBase
from models.dto.role_dto import RoleDTO, RoleBase
from models.dto.purchase_dto import PurchaseDTO, PurchaseBase
from models.dto.transaction_dto import TransactionDTO, TransactionBase, TypeTransactionDTO

router = APIRouter(prefix='/api', tags=['Warehouse API'])  # подключаем данный роутер к корневому адресу /api


@router.get('/')
async def root():
    """ Переадресация на страницу Swagger """
    return RedirectResponse(url='/docs', status_code=307)


''' Все get методы ниже '''


@router.get('/get_product_by_id/{id_product}')
async def get_product_by_id(id_product: int):
    """ Получение продукта по ID """
    with SessionLocal() as session:
        return service.get_product_by_id(session, id_product)

@router.get('/get_product_all')
async def get_product_all():
    """ Получение продукта по ID """
    with SessionLocal() as session:
        return service.get_product_all(session)

@router.get('/get_warehouse_by_id/{id_warehouse}')
async def get_warehouse_by_id(id_warehouse: int):
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_warehouse_by_id(session, id_warehouse)


@router.get('/get_category_by_id/{id_category}')
async def get_category_by_id(id_category: int):
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_category_by_id(session, id_category)


@router.get('/get_user_by_login/{login}')
async def get_user_by_login(login: str):
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_user_by_login(session, login)


@router.get('/get_purchase_by_product/{id_product}')
async def get_purchase_by_product(id_product: int):
    """ Получение списка закупок по ID товара"""
    with SessionLocal() as session:
        return service.get_purchase_by_product(session, id_product)


@router.get('/get_transactions_by_id_product/{id_product}')
async def get_transaction_by_id_product(id_product: int):
    """ Получение списка операций по ID товара"""
    with SessionLocal() as session:
        return service.get_transactions_by_id_product(session, id_product)


@router.get('/get_transactions_by_type/{id_type}')
async def get_transactions_by_type(id_type: int):
    """ Получение списка операций по ID типа операции"""
    with SessionLocal() as session:
        return service.get_transactions_by_type(session, id_type)

@router.get('/get_transactions_all')
async def get_transactions_by_type():
    """ Получение списка операций """
    with SessionLocal() as session:
        return service.get_transactions_all(session)


''' Все get методы закончены '''

''' Все create методы ниже '''


@router.post('/create_product', status_code=201)
async def create_product(product: ProductBase):
    with SessionLocal() as session:
        """ Создание товара """
        return service.create_product(session,
                                      name=product.name,
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
        return service.create_category(session, name=category.name)


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
                                          id_purchase=transaction.id_purchase,
                                          amount=transaction.amount,
                                          id_user=transaction.id_user)


@router.post('/add_purchase', status_code=201)
async def add_transaction(purchase: PurchaseBase):
    """ Добавление новой партии закупки товара """
    with SessionLocal() as session:
        return service.create_purchase(session,
                                       id_product=purchase.id_product,
                                       purchase_price=purchase.purchase_price,
                                       id_warehouse=purchase.id_warehouse,
                                       count=purchase.count,
                                       id_user=purchase.id_user)

""" Create-методы закончены """

"""Прочие методы (delete, update)"""


@router.delete('/delete_product_by_id', status_code=201)
async def delete_product_by_id(id_product: int):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.delete_product_by_id(session, id_product)


@router.delete('/delete_user_by_login', status_code=201)
async def delete_user_by_login(login: str):
    with SessionLocal() as session:
        return service.delete_user(session, login)


@router.put('/update_purchase_warehouse', status_code=201)
async def update_purchase_warehouse(id_purchase: int, id_warehouse: int):
    """ Перемещение партии товара на другой склад"""
    with SessionLocal() as session:
        return service.update_purchase_warehouse(session, id_purchase, id_warehouse)


@router.put('/update_product_name', status_code=201)
async def update_product_name(id_product: int, new_name: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_product_name(session, id_product, new_name)


@router.put('/update_warehouse_name', status_code=201)
async def update_warehouse_name(id_warehouse: int, new_name: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_warehouse_name(session, id_warehouse, new_name)


@router.put('/update_warehouse_address', status_code=201)
async def update_warehouse_address(id_warehouse: int, new_address: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_warehouse_address(session, id_warehouse, new_address)


@router.put('/update_category_name', status_code=201)
async def update_category_name(id_category: int, new_name: str):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.update_category_name(session, id_category, new_name)


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


@router.delete('/delete_transaction_by_id_product', status_code=201)
async def delete_transaction_by_id_product(id_product: int):
    """ Создание категории товара """
    with SessionLocal() as session:
        return service.delete_transaction_by_id_product(session, id_product)
