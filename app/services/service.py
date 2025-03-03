from typing import Optional, Iterable, List
from sqlalchemy.orm import Session
from sqlalchemy.testing.pickleable import User

from app.models.dao import *
import functools
import traceback


def dbexception(db_func):
    """ Функция-декоратор для перехвата исключений БД.
        Данный декоратор можно использовать перед любыми
        функциями, работающими с БД, чтобы не повторять в
        теле функции конструкцию try-except (как в функции add_weather). """

    @functools.wraps(db_func)
    def decorated_func(db: Session, *args, **kwargs) -> bool:
        try:
            db_func(db, *args, **kwargs)  # вызов основной ("оборачиваемой") функции
            db.commit()  # подтверждение изменений в БД
            return True
        except Exception as ex:
            # выводим исключение и "откатываем" изменения
            print(f'Exception in {db_func.__name__}: {traceback.format_exc()}')
            db.rollback()
            return False

    return decorated_func


# region
""" _______PRODUCT________ """


def create_product(db: Session, name: str, price: float, id_warehouse: int, id_category: int):
    product = Product(name=name,
                      price=price,
                      id_warehouse=id_warehouse,
                      id_category=id_category)
    return add_product(db, product)


def add_product(db: Session, product: Product):
    try:
        db.add(product)
        db.commit()
    except Exception as ex:
        print(traceback.format_exc())
        db.rollback()
        return False
    return True


@dbexception
def delete_product_by_id(db: Session, id_product: int):
    product = db.query(Product).filter(Product.id == id_product).first()
    db.delete(product)


def get_product_by_id(db: Session, id_product: int):
    product = db.query(Product).filter(Product.id == id_product).first()
    print(product)
    return product

def get_product_all(db: Session):
    product = db.query(Product).all()
    print(product)
    return product

@dbexception
def update_product_name(db: Session, product_id: int, new_name: str):
    product = get_product_by_id(db, product_id)
    product.name = new_name

# можно будет ещё методов сделать для обновления инфы через crud, но мне чет лень
# endregion


# region
""" _______WAREHOUSE______ """


def create_warehouse(db: Session, address: str, name: str):
    warehouse = Warehouse(address=address, name=name)
    return add_warehouse(db, warehouse)


@dbexception
def add_warehouse(db: Session, warehouse: Warehouse):
    try:
        db.add(warehouse)
        db.commit()
        print("Saccess", warehouse.name)
    except Exception as ex:
        print(traceback.format_exc())
        db.rollback()
        return False
    return True


def get_warehouse_by_id(db: Session, id_warehouse: int):
    warehouse = db.query(Warehouse).filter(Warehouse.id == id_warehouse).first()
    return warehouse


@dbexception
def update_warehouse_name(db: Session, warehouse_id: int, new_name: str):
    warehouse = get_warehouse_by_id(db, warehouse_id)
    warehouse.name = new_name


@dbexception
def update_warehouse_address(db: Session, warehouse_id: int, new_address: str):
    warehouse = get_warehouse_by_id(db, warehouse_id)
    warehouse.address = new_address

# endregion


# region
""" _______CATEGORY______ """


def create_category(db: Session, id_warehouse: int, name: str):
    category = Category(id_warehouse=id_warehouse, name=name)
    return add_category(db, category)


@dbexception
def add_category(db: Session, category: Category):
    category = category
    db.add(category)


def get_category_by_id(db: Session, id_category: int):
    category = db.query(Category).filter(Category.id == id_category).first()
    return category


@dbexception
def update_category_name(db: Session, category_id: int, new_name: str):
    category = get_category_by_id(db, category_id)
    category.name = new_name


@dbexception
def update_category_id_warehouse(db: Session, category_id: int, id_warehouse: int):
    category = get_category_by_id(db, category_id)
    category.id_warehouse = id_warehouse

# endregion


# region
""" _______USER______ """


def create_user(db: Session, login: str, password: str, id_role: int):
    user = Users(login=login, password=password, id_role=id_role)
    return add_user(db, user)


@dbexception
def add_user(db: Session, user: User):
    db.add(user)


def get_user_by_login(db: Session, login: str):
    user = db.query(Users).filter(Users.login == login).first()
    return user


@dbexception
def update_user_password(db: Session, login_user: str, new_password: str):
    user = get_user_by_login(db, login_user)
    user.password = new_password
    return True


@dbexception
def update_user_role(db: Session, login_user: str, role: int):
    user = get_user_by_login(db, login_user)
    user.id_role = role
    return True

# endregion


# region
""" _______ROLE______ """


def add_role(db: Session, role_name: str) -> bool:
    try:
        role = Role(name=role_name)
        db.add(role)
        db.commit()
        print("Success", role_name)
    except Exception as ex:
        print(traceback.format_exc())
        db.rollback()
        print("Failed")
        return False
    return True

# endregion


# region
""" _______TRANSACTION_TYPE______ """


def add_transaction_type(db: Session, type_name: str) -> bool:
    try:
        type = TypesTransaction(name=type_name)
        db.add(type)
        db.commit()
        print("Success", type_name)

    except Exception as ex:
        print(traceback.format_exc())
        db.rollback()
        print("Failed")
        return False

    return True

# endregion


# region
""" _______TRANSACTION______ """


def create_transaction(db: Session, id_type: int, price: float, id_product: int, amount: int, id_user: int):
    transaction = Transaction(id_type=id_type, price=price, id_product=id_product, amount=amount, id_user=id_user)
    return add_transaction(db, transaction)


def add_transaction(db: Session, transaction: Transaction) -> bool:
    try:
        db.add(transaction)
        db.commit()
        print("Success", transaction.id_type, transaction.created_on)

    except Exception as ex:
        print(traceback.format_exc())
        db.rollback()
        print("Failed")
        return False

    return True


def get_transaction_by_product_id(db: Session, id_product: int) -> List[Transaction]:
    """ Выборка всех записей о транзакциях по ид товара """
    result = db.query(Transaction).join(Product).filter(Transaction.id_product == id_product).all()
    print(result)
    return result if result else []


@dbexception
def delete_transaction_by_product_id(db: Session, id_product: int) -> bool:
    """ Удаление записей о транзациях для указанного товара """
    transactions = get_transaction_by_product_id(db, id_product)

    if len(transactions) == 0:
        print("Transaction wasn't find")
        return False

    print('Удаление', transactions, id_product)

    try:
        for t in transactions:
            db.delete(t)

    except Exception as ex:
        print(traceback.format_exc())
        db.rollback()
        print("Failed to delete")
        return False

# endregion
