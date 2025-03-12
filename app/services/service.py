from typing import Optional, Iterable, List
from sqlalchemy.orm import Session
from sqlalchemy.testing.pickleable import User
from sqlalchemy import desc, asc
from werkzeug.security import generate_password_hash, check_password_hash

from app.models.dao import *
import functools
import traceback
import logging


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
""" _______PARAMS________ """


def add_param(db: Session, param_key: str, val: Optional[float] = None, description: Optional[str] = None) -> bool:
    param_data = {"key": param_key}
    if val is not None:
        param_data["value"] = val
    if description is not None:
        param_data["description"] = description

    param = Param(**param_data)

    try:
        db.add(param)
        db.commit()
    except Exception as ex:
        logging.warning(traceback.format_exc())
        db.rollback()
        return False
    return True


def get_param(db: Session, param_key: str):
    """Получает параметр из таблицы params по ключу."""
    param = db.query(Param).filter(Param.key == param_key).first()

    if param is None:
        return None  # Параметр не найден

    return param  # Возвращаем объект Param


@dbexception
def update_param_value(db: Session, param_key: str, new_value: float):
    param = get_param(db, param_key)

    if param is None:
        raise ValueError(f"Параметр с ключом '{param_key}' не найден.")

    param.value = new_value  # Обновляем значение
    return True  # Возвращаем успех


@dbexception
def increase_param(db: Session, param_key: str, delta: float):
    param = get_param(db, param_key)

    if param is None:
        raise ValueError(f"Параметр с ключом '{param_key}' не найден.")
    if param.value is None:
        param.value = delta
    else:
        param.value += delta
    return True  # Возвращаем успех


# endregion


# region
""" _______PRODUCT________ """


def create_product(db: Session, name: str, id_category: int):
    product = Product(name=name,
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


@dbexception
def update_product_count(db: Session, product: Product, new_count: int):
    product.total_count = new_count
    db.commit()


@dbexception
def set_current_purchase(db: Session, product: Product, new_purchase_id: int):
    product.purchase_id = new_purchase_id
    db.commit()

def update_current_purchase(db: Session, product_id: int):
    next_purchase = (
        db.query(Purchase)
        .filter(Purchase.product_id == product_id)  # Фильтр по product_id
        .filter(Purchase.current_count != 0)  # Только записи, где current_count > 0
        .order_by(asc(Purchase.created_on))  # Сортируем по дате (от старых к новым)
        .first()  # Берём самую раннюю запись
    )

    product = get_product_by_id(db, product_id)

    if next_purchase:
        product.purchase_id = next_purchase.id
    else:
        product.purchase_id = None





# можно будет ещё методов сделать для обновления инфы через crud, но мне чет лень
# endregion


# region
""" _______PURCHASE______ """


def create_purchase(db: Session, product_id: int, purchase_price: float, id_warehouse: int, count: int):
    selling_price = purchase_price * 3  # Заменить на нормальный расчет цены!!!!!!!!
    purchase = Purchase(product_id=product_id,
                        purchase_price=purchase_price,
                        selling_price=selling_price,
                        id_warehouse=id_warehouse,
                        count=count,
                        current_count=count)
    return add_purchase(db, purchase)


def add_purchase(db: Session, purchase: Purchase):

    product = get_product_by_id(db, purchase.product_id)
    if product:
        # увеличиваем количество товара
        new_count = product.total_count + purchase.count
        try:
            db.add(purchase)
            db.commit()

            if product.total_count == 0:
                set_current_purchase(db, product, purchase.id)
            # обновляем количество товара
            update_product_count(db, product, new_count)
            # создаем транзакцию с закупкой
            create_transaction(db, 2, purchase.id, purchase.count, 2)

        except Exception as ex:
            logging.warning(f"Ошибка добавления закупки: product {purchase.product_id}, "
                            f"count {purchase.count}, "
                            f"purchase_price{purchase.purchase_price}.")
            logging.warning(traceback.format_exc())
            db.rollback()
            return False
        return True
    else:
        logging.warning(f"Закупка не существующего товар {purchase.product_id}.")
        return False


@dbexception
def delete_purchase_by_id(db: Session, id_purchase: int):
    purchase = db.query(Purchase).filter(Purchase.id == id_purchase).first()
    db.delete(purchase)


def get_purchase_by_id(db: Session, id_purchase: int):
    purchase = db.query(Purchase).filter(Purchase.id == id_purchase).first()
    if not purchase:
        logging.warning(f"Не найдена закупка с id {id_purchase}")
    print(purchase)
    return purchase


def get_purchase_by_product(db: Session, id_product: int):
    purchases = db.query(Product).filter(Purchase.id_product == id_product).all()
    print(purchases)
    return purchases


@dbexception
def update_purchase_product(db: Session, id_purchase: int, new_id_product: int):
    purchase = get_purchase_by_id(db, id_purchase)
    purchase.id_product = new_id_product

@dbexception
def decrease_purchase_count(db: Session, id_purchase: int, delta: int):
    purchase = get_purchase_by_id(db, id_purchase)
    new_count = purchase.current_count - delta
    if new_count < 0:
        raise RuntimeError("Отрицательное количество товара в партии!")
    purchase.current_count = new_count
    decrease_total_count(db, purchase.product_id, delta)

    db.commit()

    if new_count == 0:
        update_current_purchase(db, purchase.product_id)


@dbexception
def decrease_total_count(db: Session, id_product: int, delta: int):
    product = get_product_by_id(db, id_product)
    new_count = product.total_count - delta
    if new_count < 0:
        raise RuntimeError("Отрицательное общеее количество товара!")
    product.total_count = new_count

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


def create_category(db: Session, name: str):
    category = Category(name=name)
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

# endregion


# region
""" _______USER______ """


def create_user(db: Session, login: str, password: str, id_role: int):
    hashed_password = generate_password_hash(password)
    user = Users(login=login, password=hashed_password, id_role=id_role)
    return add_user(db, user)


@dbexception
def add_user(db: Session, user: User):
    db.add(user)


def get_user_by_login(db: Session, login: str):
    user = db.query(Users).filter(Users.login == login).first()
    return user


@dbexception
def update_user_password(db: Session, login_user: str, new_password: str) -> bool:
    """ Обновление пароля пользователя """
    user = get_user_by_login(db, login_user)

    if user:
        # Хешируем новый пароль перед сохранением
        hashed_password = generate_password_hash(new_password)

        user.password = hashed_password
        db.commit()  # Сохраняем изменения в БД

        logging.info(f"Пароль для пользователя {login_user} успешно обновлен.")
        return True
    else:
        logging.warning(f"Пользователь с логином {login_user} не найден.")
        return False


@dbexception
def delete_user(db: Session, login_user: str) -> bool:
    """ Удаление пользователя по логину """
    user = get_user_by_login(db, login_user)

    if user:
        db.delete(user)
        db.commit()  # Важно: фиксируем изменения в БД
        logging.info(f"Пользователь с логином {login_user} успешно удален.")
        return True
    else:
        logging.warning(f"Пользователь с логином {login_user} не найден.")
        return False


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


def create_transaction(db: Session, id_type: int, id_purchase: int, amount: int, id_user: int):
    transaction = Transaction(id_type=id_type, id_purchase=id_purchase, amount=amount, id_user=id_user)
    return add_transaction(db, transaction)


def add_transaction(db: Session, transaction: Transaction) -> bool:
    try:
        db.add(transaction)
        db.commit()

        purchase = get_purchase_by_id(db, transaction.id_purchase)

        if transaction.id_type == 1 or transaction.id_type == 3:
            decrease_purchase_count(db, transaction.id_purchase, transaction.amount)

        if transaction.id_type == 1:
            increase_param(db, "Rev", purchase.selling_price * transaction.amount)
        if transaction.id_type == 2:
            increase_param(db, "DirectCosts", purchase.purchase_price * transaction.amount)
        if transaction.id_type == 3:
            increase_param(db, "IndirectCosts", purchase.purchase_price * transaction.amount)

        print("Success", transaction.id_type, transaction.created_on)

    except Exception as ex:
        print(traceback.format_exc())
        db.rollback()
        print("Failed")
        return False

    return True


@dbexception
def get_transactions_by_product_id(db: Session, id_product: int) -> List[Transaction]:
    try:
        # Шаг 1: Найдем все закупки, связанные с данным товаром
        purchases = db.query(Purchase).filter(Purchase.product_id == id_product).all()

        if not purchases:
            print(f"Не найдено закупок для товара с id {id_product}")
            return []

        # Шаг 2: Получаем список ids закупок для данного товара
        purchase_ids = [purchase.id for purchase in purchases]

        # Шаг 3: Находим все транзакции, связанные с найденными закупками
        transactions = db.query(Transaction).filter(Transaction.id_purchase.in_(purchase_ids)).all()

        if not transactions:
            print(f"Не найдено транзакций для товара с id {id_product}")
            return []

        # Возвращаем все найденные транзакции
        return transactions

    except Exception as ex:
        print("Ошибка при получении транзакций:", ex)
        return []


@dbexception
def delete_transaction_by_product_id(db: Session, id_product: int) -> bool:
    """ Удаление записей о транзакциях для указанного товара """
    transactions = get_transactions_by_product_id(db, id_product)

    if not transactions:
        logging.warning(f"Транзакции для товара с ID {id_product} не найдены.")
        return False

    logging.info(f"Удаление транзакций для товара с ID {id_product}: {transactions}")

    try:
        # Используем один запрос для удаления всех транзакций
        db.query(Transaction).filter(Transaction.product_id == id_product).delete(synchronize_session=False)
        db.commit()  # Зафиксировать изменения в базе данных
        logging.info(f"Транзакции для товара с ID {id_product} успешно удалены.")
        return True
    except Exception as ex:
        db.rollback()
        logging.error(f"Ошибка при удалении транзакций для товара с ID {id_product}: {traceback.format_exc()}")
        return False

# endregion

# region
""" _______Expense______ """


def create_expense(db: Session, name: str, cost: float, id_user: int, description: Optional[str] = None):
    expense = Expense(name=name, cost=cost, description=description, id_user=id_user)
    return add_expense(db, expense)


def add_expense(db: Session, expense: Expense) -> bool:
    try:
        db.add(expense)
        db.commit()
        print("Success", expense.name, expense.created_on)

    except Exception as ex:
        print(traceback.format_exc())
        db.rollback()
        print("Failed")
        return False

    return True


def get_expense_by_id(db: Session, expense_id: int):
    """ Получение записи о расходах по ID """
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    return expense


def get_expense_by_date(db: Session, start_date: datetime, end_date: datetime) -> List[Expense]:
    """Выборка всех записей о затратах по заданному временному промежутку."""
    expenses = db.query(Expense).filter(Expense.created_on.between(start_date, end_date)).all()

    logging.info(f"Найдено {len(expenses)} записей о расходах с {start_date} по {end_date}")

    return expenses if expenses else []


@dbexception
def delete_expense_by_id(db: Session, id_expense: int) -> bool:
    """ Удаление пользователя по логину """
    expense = get_expense_by_id(db, id_expense)

    if expense:
        expense_name = expense.name
        date = expense.created_on
        db.delete(expense)
        db.commit()
        logging.info(f"Запись о расходах {expense_name} от {date} успешно удалена.")
        return True
    else:
        logging.warning(f"Запись о расходах {int} не найдена.")
        return False


# endregion
