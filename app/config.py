from configparser import RawConfigParser, ExtendedInterpolation
from app.repository import get_engine, get_session_fabric
import sys
import os

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
"""
    Данный модуль отвечает за конфигурирование приложения
"""


# Читаем файл конфигурации приложения (в результате будет получен dict-подобный объект)
app_config = RawConfigParser(interpolation=ExtendedInterpolation())
app_config.read('.\\app.ini')
# путь на сервере
# app_config.read('/opt/WarehouseProject/app.ini')
#app_config.read('C:\\Users\\bl1nk999\\PycharmProjects\\SQL-AIS\\app.ini')
print("Секции в config.ini:", app_config.sections())

db_config = app_config['Database']      # получаем значения раздела "Database"

# Инициализируем драйвер соединения с БД используя параметры конфигурации 'database_url' (строка подключения к БД)
# и 'database_sync' - флаг автоматической генерации таблиц БД при запуске приложения
engine = get_engine(db_url=db_config['database_url'], db_sync=db_config['database_sync'])

SessionLocal = get_session_fabric(engine)
