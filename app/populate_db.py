from app.config import SessionLocal
from app.services.service import *
import random

""" Данный скрипт заполняет БД тестовыми данными """

ROLE = ['admin', 'user']
TRANSACTION_TYPE = ['sale', 'purchase', 'expense']
prevIndirectCosts = 2000
prevDirectSoldCosts = 5000
DirectIndirectRatio = prevIndirectCosts / prevDirectSoldCosts


def populate_role(db: Session) -> None:
    for role in ROLE:
        add_role(db, role)


def populate_transaction_type(db: Session) -> None:
    for type in TRANSACTION_TYPE:
        add_transaction_type(db, type)


if __name__ == "__main__":
    with SessionLocal() as session:
        add_param(session, "VAT", 20.0, description="НДС")
        add_param(session, "prevIndirectCosts", prevIndirectCosts, description="Сумма косвенных расходов за прошлый месяц")
        add_param(session, "prevDirectSoldCosts", prevDirectSoldCosts, description="Сумма прямых расходов реализованного товара за прошлый месяц")
        add_param(session, "IndirectCosts", description="Сумма косвенных расходов")
        add_param(session, "DirectCosts", description="Сумма прямых расходов")
        add_param(session, "DirectSoldCosts", description="Сумма прямых расходов реализованного товара")
        add_param(session, "DirectIndirectRatio", DirectIndirectRatio, description="Процент косвенных расходов от реализованного товара за прошлый месяц")
        add_param(session, "GM", 40, description="Желаемая маржинальность")
        add_param(session, "Rev", description="Доход за текущий период")
        add_param(session, "NP", description="Чистая прибыль за текущий период")
        add_param(session, "TE", description="Общие расходы за текущий период")
        populate_role(session)
        populate_transaction_type(session)
        create_user(session, 'admin', 'qwerty', 1)
        create_user(session, 'user1', 'qwerty', 2)
        create_warehouse(session, 'Карла Маркса, 16', 'Склад 1')
        create_warehouse(session, 'Заки Валиди, 32', 'Склад 2')
        create_category(session, 'Концтовары')
        create_product(session, 'Шариковая ручка MS Gold', 1)
        create_product(session, 'Тетрадь в клетку 48 л', 1)
        create_product(session, 'Простой карандаш', 1)
        create_purchase(session, 1, 10, 1, 10, 1)
        create_purchase(session, 1, 12, 2, 10, 1)
        create_purchase(session, 1, 13, 1, 10, 1)
        create_purchase(session, 2, 5, 2, 9000, 1)
        create_purchase(session, 2, 6, 2, 8000, 1)
        create_purchase(session, 3, 3, 1, 20000, 1)
        create_transaction(session, 1, 1, 25, 1)
       # create_transaction(session, 1, 1, 40, 2)
        #create_transaction(session, 1, 3, 33, 1)
        #create_transaction(session, 1, 3, 44, 2)
        create_transaction(session, 1, 6, 26, 1)
        create_transaction(session, 1, 6, 73, 2)
        #create_transaction(session, 3, 1, 40, 1)
        create_transaction(session, 1, 4, 30, 2)
        create_transaction(session, 1, 6, 40, 2)
        #create_transaction(session, 1, 2, 100, 1)
        create_transaction(session, 3, 6, 40, 2)
        create_transaction(session, 3, 5, 80, 2)
        create_expense(session, "Аренда", 1000, 1)
        create_expense(session, "Комуналка", 200, 1)
        create_expense(session, "ЗП помощника", 200, 1)
        calc_period_results(session)
        # create_transaction(session, 2, 1, 100, 2)
        # create_transaction(session, 2, 2, 95, 2)
        # create_transaction(session, 2, 3, 90, 2)


