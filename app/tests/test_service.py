import unittest
import random
from app.config import SessionLocal
from app.services.service import *

"""
   Данный модуль реализует "тестовые случаи/ситуации" для модуля repository_service.
   Для создания "тестового случая" необходимо создать отдельный класс, который наследует 
   базовый класс TestCase. Класс TestCase предоставляется встроенным 
   в Python модулем для тестирования - unittest.

   Более детально см.: https://pythonworld.ru/moduli/modul-unittest.html
"""

ROLE = ['admin', 'user']
TRANSACTION_TYPE = ['expense', 'sale', 'purchase']


class TestWarehouseService(unittest.TestCase):
    """ Все тестовые методы в классе TestCase (по соглашению)
        должны начинаться с префикса test_* """

    def setUp(self):
        """ Наследуемый метод setUp определяет инструкции,
            которые должны быть выполнены ПЕРЕД тестированием """
        self.session = SessionLocal()  # создаем сессию подключения к БД
        print('Test data already created')

    def test_create_transaction(self):
        """ Тест функции создания записи Transation """
        result = create_transaction(self.session,
                                type = 3,
                                price=50,
                                id_user=2,
                                id_product=2,
                                 amount=200,
                                    )
        self.assertTrue(result)  # валидируем результат (result == True)

    def test_get_transaction(self):
        """ Тест функции поиска записи Weather по наименованию населённого пункта """
        transactions_of_pencil = get_transaction_by_product_id(self.session, id_product=2)
        print('ПОиск транзакции',transactions_of_pencil)
        for row in transactions_of_pencil:
            print(row)
            self.assertIsNotNone(row)  # запись должна существовать
            self.assertTrue(row.id_product == 2)  # идентификатор product_id == 1

    def test_delete_transaction(self):
        """ Тест функции удаления записи Transaction по ид товара """
        delete_transaction_by_product_id(self.session, id_product=1)
        result = get_transaction_by_product_id(self.session, id_product=1)        # ищем запись по идентификатору товара
        self.assertTrue(len(result) == 0)       # запись не должна существовать

    def test_upade_product_name(self):
        product = get_product_by_id(self.session, 2)
        update_product_name(self.session, product, "Тетрадь")
        self.assertTrue(product.name == "Тетрадь")

    def tearDown(self):
        """ Наследуемый метод tearDown определяет инструкции,
            которые должны быть выполнены ПОСЛЕ тестирования """
        self.session.close()  # закрываем соединение с БД


if __name__ == '__main__':
    unittest.main()
