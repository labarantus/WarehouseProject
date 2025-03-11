from sqlalchemy import Column, ForeignKey, Boolean, Integer, Numeric, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

'''
Модель базы данных.

Так как в теории у нас должно быть несколько складов, то нам необходимо будет сделать id склада, к которому будет
относиться тот или мной товар. 

С категориями чуть сложнее. Так как на каждом из складов будут свои категории, то и для
каждой записи в таблице категорий будет указываться id склада, которому принадлежит категория. А уже для товара просто
применяем ID.

Таблица складов содержит в себе ID, адрес, а также название склада (условно может быть какой-нибудь магазин в названии)

У таблицы пользователей будет такая штука как "роль". По сути админ системы и базовый работник, это разделение есть в ТЗ.
В последствии данная роль будет проверяться при входе в аккаунт. Админа мы будем создавать уже через CRUD-запрос.
А вот сам админ уже может назначать роль админа другим пользователям. Возможно ещё супер-админа какого-нибудь сделать, но
это пока в теории.
'''


class Param(Base):
    __tablename__ = 'params'
    key = Column(String(100), primary_key=True, unique=True)
    value = Column(Numeric, nullable=True)
    description = Column(String(255), nullable=True)


class Product(Base):
    __tablename__ = 'product'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)
    id_category = Column(Integer, ForeignKey('category.id'))
    total_count = Column(Integer, default=0)
    purchase_id = Column(Integer, ForeignKey('purchase.id'))


class Purchase(Base):
    __tablename__ = 'purchase'
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey('product.id'))
    purchase_price = Column(Numeric, nullable=False)
    selling_price = Column(Numeric, nullable=False)
    id_warehouse = Column(Integer, ForeignKey('warehouse.id'))
    count = Column(Integer, default=0)
    current_count = Column(Integer, default=0)
    created_on = Column(DateTime(), default=datetime.now)


class Category(Base):
    __tablename__ = 'category'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)


class Warehouse(Base):
    __tablename__ = 'warehouse'
    id = Column(Integer, primary_key=True)
    address = Column(String(100), unique=True, nullable=False)
    name = Column(String(50), unique=True, nullable=False)
    created_on = Column(DateTime(), default=datetime.now)


class Transaction(Base):
    __tablename__ = 'transaction'
    id = Column(Integer, primary_key=True)
    id_type = Column(Integer, ForeignKey('types_transaction.id'))
    id_purchase = Column(Integer, ForeignKey('purchase.id'))
    amount = Column(Integer, nullable=False)
    id_user = Column(Integer, ForeignKey('users.id'))
    created_on = Column(DateTime(), default=datetime.now)


class Expense(Base):
    __tablename__ = 'expense'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    cost = Column(Numeric, nullable=False)  # Сумма расхода
    id_user = Column(Integer, ForeignKey('users.id'))
    description = Column(String(255), nullable=True)  # Описание расхода
    created_on = Column(DateTime, default=datetime.now)  # Дата расхода


class TypesTransaction(Base):
    __tablename__ = 'types_transaction'
    id = Column(Integer, primary_key=True)
    name = Column(String(20), nullable=False, unique=True)

class Users(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    login = Column(String(100), unique=True, nullable=False)
    password = Column(String(20), nullable=False)
    id_role = Column(Integer, ForeignKey('role.id'))  # can be admin or user

class Role(Base):
    __tablename__ = 'role'
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)

