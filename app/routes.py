from fastapi import APIRouter, HTTPException, status, Request, Response, Depends
from starlette.responses import RedirectResponse
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.services import service
from .config import SessionLocal
from models.dto.product_dto import ProductDTO, ProductBase
from models.dto.warehouse_dto import WarehouseDTO, WarehouseBase
from models.dto.category_dto import CategoryDTO, CategoryBase
from models.dto.user_dto import UserDTO, UserBase, UserRoleUpdate
from models.dto.role_dto import RoleDTO, RoleBase
from models.dto.purchase_dto import PurchaseDTO, PurchaseBase
from models.dto.transaction_dto import TransactionDTO, TransactionBase, TypeTransactionDTO
from pydantic import BaseModel
import os
import datetime
import secrets
from pathlib import Path
from werkzeug.security import check_password_hash


# Новая модель для аутентификации
class AuthRequest(BaseModel):
    login: str
    password: str


class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires: datetime.datetime


# Инициализируем шаблоны - используем относительный путь
template_dir = Path(__file__).parent.parent / "templates"
templates = Jinja2Templates(directory=template_dir)

# API маршруты
router = APIRouter(prefix='/api', tags=['Warehouse API'])

# Веб-маршруты
web_router = APIRouter(tags=['Web Pages'])


# Веб-страницы
@web_router.get('/', response_class=HTMLResponse)
async def root(request: Request):
    """ Главная страница - перенаправление на страницу логина """
    return templates.TemplateResponse("login.html", {"request": request})


@web_router.get('/login', response_class=HTMLResponse)
async def login_page(request: Request):
    """ Страница авторизации """
    return templates.TemplateResponse("login.html", {"request": request})


@web_router.get('/register', response_class=HTMLResponse)
async def register_page(request: Request):
    """ Страница регистрации """
    return templates.TemplateResponse("register.html", {"request": request})


@web_router.get('/inventory', response_class=HTMLResponse)
async def inventory_page(request: Request):
    """ Страница инвентаря """
    return templates.TemplateResponse("inventory.html", {"request": request})


# Метод аутентификации
@router.post('/authenticate', status_code=200, response_model=AuthResponse)
async def authenticate(auth_data: AuthRequest):
    """Аутентификация пользователя и получение токена"""
    with SessionLocal() as session:
        user = service.get_user_by_login(session, auth_data.login)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверные учетные данные",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Проверка пароля с использованием werkzeug.security
        if not check_password_hash(user.password, auth_data.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверные учетные данные",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Генерируем токен
        token = secrets.token_hex(32)
        expires = datetime.datetime.now() + datetime.timedelta(hours=24)

        return {
            "token": token,
            "token_type": "bearer",
            "expires": expires
        }


# Существующие API маршруты
@router.get('/')
async def api_root():
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
    """ Получение всех продуктов """
    with SessionLocal() as session:
        return service.get_product_all(session)


@router.get('/get_warehouses')
async def get_warehouses():
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_warehouses(session)


@router.get('/get_warehouse_by_id/{id_warehouse}')
async def get_warehouse_by_id(id_warehouse: int):
    """ Получение склада по ID """
    with SessionLocal() as session:
        return service.get_warehouse_by_id(session, id_warehouse)


@router.get('/get_category_by_id/{id_category}')
async def get_category_by_id(id_category: int):
    """ Получение категории по ID """
    with SessionLocal() as session:
        return service.get_category_by_id(session, id_category)


@router.get('/get_user_by_login/{login}')
async def get_user_by_login(login: str):
    """ Получение пользователя по логину """
    with SessionLocal() as session:
        return service.get_user_by_login(session, login)

@router.get('/get_all_users')
async def get_all_users():
    """ Получение пользователя по логину """
    with SessionLocal() as session:
        return service.get_all_users(session)


@router.get('/get_purchase_by_product/{id_product}')
async def get_purchase_by_product(id_product: int):
    """ Получение списка закупок по ID товара"""
    with SessionLocal() as session:
        return service.get_purchase_by_product(session, id_product)


@router.get('/get_purchase_by_id/{id}')
async def get_purchase_by_product(id: int):
    """ Получение списка закупок по ID товара"""
    with SessionLocal() as session:
        return service.get_purchase_by_id(session, id)


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
async def get_transactions_all():
    """ Получение списка операций """
    with SessionLocal() as session:
        return service.get_transactions_all(session)


@router.get('/get_categories')
async def get_categories():
    """Получение всех категорий товаров"""
    with SessionLocal() as session:
        categories = service.get_all_categories(session)
        return [{"id": category.id, "name": category.name} for category in categories]


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
    """ Создание пользователя """
    with SessionLocal() as session:
        try:
            # Проверка на пустое имя пользователя
            if not user.login or not user.login.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Логин не может быть пустым"
                )

            # Проверка на пустой пароль
            if not user.password or not user.password.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Пароль не может быть пустым"
                )

            # Проверяем, что пользователь с таким логином не существует
            try:
                existing_user = service.get_user_by_login(session, user.login)
                # Если пользователь найден, возвращаем ошибку
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Пользователь с таким логином уже существует"
                    )
            except Exception as check_err:
                # Если при проверке возникла ошибка, но это не HTTPException,
                # значит пользователь не найден и мы можем продолжить
                if not isinstance(check_err, HTTPException):
                    pass
                else:
                    raise check_err

            # Установка роли пользователя, если не указана
            if not user.id_role:
                user.id_role = 2  # По умолчанию обычный пользователь

            # Создаем пользователя
            result = service.create_user(session, login=user.login, password=user.password, id_role=user.id_role)
            return result

        except HTTPException as http_exc:
            # Пробрасываем HTTP исключения дальше
            raise http_exc
        except Exception as e:
            # Если произошла другая ошибка
            print(f"Error in create_user: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Ошибка при создании пользователя: {str(e)}"
            )


@router.post('/create_role', status_code=201)
async def create_role(role: RoleBase):
    """ Создание роли """
    with SessionLocal() as session:
        return service.add_role(session, role_name=role.name)


@router.post('/add_transaction', status_code=201)
async def add_transaction(transaction: TransactionBase):
    """ Создание транзакции """
    with SessionLocal() as session:
        return service.create_transaction(session,
                                          id_type=transaction.id_type,
                                          id_purchase=transaction.id_purchase,
                                          amount=transaction.amount,
                                          id_user=transaction.id_user)


@router.post('/add_purchase', status_code=201)
async def add_purchase(purchase: PurchaseBase):
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
    """ Удаление продукта по ID """
    with SessionLocal() as session:
        return service.delete_product_by_id(session, id_product)


@router.delete('/delete_user_by_login', status_code=201)
async def delete_user_by_login(login: str):
    """ Удаление пользователя по логину """
    with SessionLocal() as session:
        return service.delete_user(session, login)


@router.put('/update_purchase_warehouse', status_code=201)
async def update_purchase_warehouse(id_purchase: int, id_warehouse: int):
    """ Перемещение партии товара на другой склад"""
    with SessionLocal() as session:
        return service.update_purchase_warehouse(session, id_purchase, id_warehouse)


@router.put('/update_product_name', status_code=201)
async def update_product_name(id_product: int, new_name: str):
    """ Обновление имени продукта """
    with SessionLocal() as session:
        return service.update_product_name(session, id_product, new_name)


@router.put('/update_warehouse_name', status_code=201)
async def update_warehouse_name(id_warehouse: int, new_name: str):
    """ Обновление имени склада """
    with SessionLocal() as session:
        return service.update_warehouse_name(session, id_warehouse, new_name)


@router.put('/update_warehouse_address', status_code=201)
async def update_warehouse_address(id_warehouse: int, new_address: str):
    """ Обновление адреса склада """
    with SessionLocal() as session:
        return service.update_warehouse_address(session, id_warehouse, new_address)


@router.put('/update_category_name', status_code=201)
async def update_category_name(id_category: int, new_name: str):
    """ Обновление имени категории """
    with SessionLocal() as session:
        return service.update_category_name(session, id_category, new_name)


@router.put('/update_user_password', status_code=201)
async def update_user_password(user_login: str, new_password: str):
    """ Обновление пароля пользователя """
    with SessionLocal() as session:
        return service.update_user_password(session, user_login, new_password)


@router.put('/update_user_role', status_code=200)
async def update_user_role(user_data: UserRoleUpdate):
    """Обновление роли пользователя"""
    with SessionLocal() as session:
        success = service.update_user_role(session, user_data.user_login, user_data.new_role_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )
        return {"status": "success"}

@router.delete('/delete_transaction_by_id_product', status_code=201)
async def delete_transaction_by_id_product(id_product: int):
    """ Удаление транзакций по ID продукта """
    with SessionLocal() as session:
        return service.delete_transaction_by_id_product(session, id_product)
