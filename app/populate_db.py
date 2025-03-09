from app.config import SessionLocal
from app.services.service import *
import random

""" Данный скрипт заполняет БД тестовыми данными """

ROLE = ['admin', 'user']
TRANSACTION_TYPE = ['expense', 'sale', 'purchase']


def populate_role(db: Session) -> None:
    for role in ROLE:
        add_role(db, role)


def populate_transaction_type(db: Session) -> None:
    for type in TRANSACTION_TYPE:
        add_transaction_type(db, type)

if __name__ == "__main__":
    with SessionLocal() as session:
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
        create_purchase(session, 1, 10, 1, 100)
        create_purchase(session, 1, 12, 1, 100)
        create_purchase(session, 1, 13, 1, 100)
        # create_transaction(session, 2, 1, 100, 2)
        # create_transaction(session, 2, 2, 95, 2)
        # create_transaction(session, 2, 3, 90, 2)


