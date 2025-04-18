import json
import time
import random
import json
from locust import HttpUser, task, tag, between


# Статичные данные для тестирования
CITY_NAMES = ['GM', 'prevIndirectCosts', 'saint-petersburg', 'kazan']


class RESTServerUser(HttpUser):
    """ Класс, эмулирующий пользователя / клиента сервера """
    wait_time = between(1.0, 5.0)       # время ожидания пользователя перед выполнением новой task

    # Адрес, к которому клиенты (предположительно) обращаются в первую очередь (это может быть индексная страница, страница авторизации и т.п.)
    def on_start(self):
        self.client.get("/docs")    # базовый класс HttpUser имеет встроенный HTTP-клиент для выполнения запросов (self.client)

    @tag("get_transactions_by_type")
    @task(3)
    def get_transactions_by_type(self):
        """ Тест GET-запроса (получение всех транзакций определенного типа) """
        id_type = random.randint(1, 3)      # генерируем случайный id в диапазоне [1, 3]
        with self.client.get(f'/api/get_transactions_by_type/{id_type}',
                             catch_response=True,
                             name='/api/get_transactions_by_type/{id_type}') as response:
            # Если получаем код HTTP-код 200, то оцениваем запрос как "успешный"
            if response.status_code == 200:
                response.success()
            # Иначе обозначаем как "отказ"
            else:
                response.failure(f'Status code is {response.status_code}')


    @tag("get_all_task")
    @task(3)
    def get_transactions_by_id_product(self):
        """ Тест GET-запроса (получение всех транзакций по ид товара) """
        id_product = random.randint(1, 3)      # генерируем случайный id в диапазоне [1, 3]
        with self.client.get(f'/api/get_transactions_by_id_product/{id_product}',
                             catch_response=True,
                             name='/api/get_transactions_by_id_product/{id_product}') as response:
            # Если получаем код HTTP-код 200, то оцениваем запрос как "успешный"
            if response.status_code == 200:
                response.success()
            # Иначе обозначаем как "отказ"
            else:
                response.failure(f'Status code is {response.status_code}')

    @tag("get_one_task")
    @task(10)
    def get_product_by_id(self):
        """ Тест GET-запроса (получение одной записи) """
        id_product = random.randint(1, 3)
        with self.client.get(f'/api/get_product_by_id/{id_product}',
                             catch_response=True,
                             name='/api/get_product_by_id/{id_product}') as response:
            # Если получаем код HTTP-код 200 или 204, то оцениваем запрос как "успешный"
            if response.status_code == 200 or response.status_code == 204:
                response.success()
            else:
                response.failure(f'Status code is {response.status_code}')

    @tag("post_task")
    @task(3)
    def add_purchase(self):
        """ Тест POST-запроса (создание записи о погоде) """
        # Генерируем случайные данные в опредленном диапазоне
        test_data = {'id_product': random.randint(1, 3),
                     'purchase_price': random.uniform(10.0, 100.0),
                     'id_warehouse': random.randint(1, 2),
                     'count': random.randint(1000, 3000),
                     'id_user': 1}

        post_data = json.dumps(test_data)       # сериализуем тестовые данные в json-строку
        # отправляем POST-запрос с данными (POST_DATA) на адрес <SERVER>/api/weatherforecast
        with self.client.post('/api/add_purchase',
                              catch_response=True,
                              name='/api/add_purchase', data=post_data,
                              headers={'content-type': 'application/json'}) as response:
            # проверяем, корректность возвращаемого HTTP-кода
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f'Status code is {response.status_code}')

    @tag("post_task")
    @task(6)
    def add_transaction(self):
        """ Тест POST-запроса (создание записи о погоде) """
        # Генерируем случайные данные в опредленном диапазоне
        test_data = {'id_type': 1,
                     'id_purchase': random.randint(1, 6),
                     'amount': random.randint(1, 2),
                     'id_user': random.randint(1, 2)}

        post_data = json.dumps(test_data)  # сериализуем тестовые данные в json-строку
        # отправляем POST-запрос с данными (POST_DATA) на адрес <SERVER>/api/weatherforecast
        with self.client.post('/api/add_transaction',
                              catch_response=True,
                              name='/api/add_transaction', data=post_data,
                              headers={'content-type': 'application/json'}) as response:
            # проверяем, корректность возвращаемого HTTP-кода
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f'Status code is {response.status_code}')

    @tag("put_task")
    @task(1)
    def update_purchase_warehouse(self):
        """ Тест PUT-запроса (обновление записи о погоде) """
        id_purchase = random.randint(1, 6)  # генерируем случайный id в диапазоне [0, 3]
        new_id_warehouse = random.randint(1, 2)
        # отправляем PUT-запрос на адрес <SERVER>/api/weatherforecast/{city_name}
        with self.client.put(f'/api/update_purchase_warehouse?id_purchase={id_purchase}&id_warehouse={new_id_warehouse}',
                             catch_response=True,
                             name='/api/update_purchase_warehouse?id_purchase={ID1}&id_warehouse={ID2}') as response:
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f'Status code is {response.status_code}')

