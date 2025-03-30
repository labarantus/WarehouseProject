from app.config import SessionLocal
from app.services.service import *
import random
from datetime import datetime, timedelta

""" Данный скрипт заполняет БД тестовыми данными с историей транзакций за последние 6 месяцев """

ROLE = ['admin', 'user']
TRANSACTION_TYPE = ['sale', 'purchase', 'expense']
prevIndirectCosts = 2000
prevDirectSoldCosts = 5000
DirectIndirectRatio = prevIndirectCosts / prevDirectSoldCosts

# Категории товаров
CATEGORIES = [
    'Концтовары',
    'Электроника',
    'Книги',
    'Одежда',
    'Хозтовары',
    'Продукты питания',
    'Игрушки',
    'Спорттовары'
]

# Товары по категориям
PRODUCTS = {
    'Концтовары': [
        'Шариковая ручка MS Gold', 'Шариковая ручка Pilot', 'Шариковая ручка Parker',
        'Гелевая ручка Pentel', 'Тетрадь в клетку 48 л', 'Тетрадь в линию 96 л',
        'Блокнот А5', 'Блокнот А6', 'Простой карандаш', 'Цветные карандаши 12 цв.',
        'Механический карандаш', 'Ластик', 'Линейка 30 см', 'Фломастеры 24 цв.',
        'Бумага для заметок', 'Скрепки (100 шт.)', 'Степлер', 'Дырокол'
    ],
    'Электроника': [
        'Смартфон Xiaomi', 'Смартфон Samsung', 'Смартфон Apple',
        'Наушники TWS', 'Наушники проводные', 'Зарядное устройство 65W',
        'Внешний аккумулятор 10000mAh', 'Клавиатура беспроводная', 'Мышь оптическая',
        'Монитор 24"', 'Веб-камера', 'Колонки компьютерные', 'USB-флеш 64GB'
    ],
    'Книги': [
        'Java для начинающих', 'Python для чайников', 'Алгоритмы и структуры данных',
        'Чистый код', 'Грокаем алгоритмы', 'SQL полное руководство', 'C++ для профессионалов',
        'Дизайн интерфейсов', 'Совершенный код', 'JavaScript и jQuery'
    ],
    'Одежда': [
        'Футболка мужская', 'Футболка женская', 'Джинсы мужские',
        'Джинсы женские', 'Рубашка', 'Толстовка', 'Куртка', 'Шапка',
        'Носки (3 пары)', 'Перчатки'
    ],
    'Хозтовары': [
        'Средство для мытья посуды', 'Чистящее средство', 'Губки для посуды',
        'Веник с совком', 'Швабра', 'Мусорные мешки (30 шт)', 'Перчатки хозяйственные',
        'Освежитель воздуха'
    ],
    'Продукты питания': [
        'Чай черный (100 пак.)', 'Кофе растворимый', 'Кофе в зернах', 'Сахар (1 кг)',
        'Печенье (500 г)', 'Шоколад молочный', 'Вода питьевая (5 л)', 'Энергетический напиток'
    ],
    'Игрушки': [
        'Конструктор', 'Мягкая игрушка', 'Набор для творчества', 'Настольная игра',
        'Пазл 500 деталей', 'Радиоуправляемая машинка', 'Кукла'
    ],
    'Спорттовары': [
        'Скакалка', 'Гантели 2 кг', 'Коврик для йоги', 'Шейкер', 'Эспандер',
        'Мяч футбольный', 'Насос для мячей'
    ]
}

# Склады
WAREHOUSES = [
    ('Карла Маркса, 16', 'Склад 1'),
    ('Заки Валиди, 32', 'Склад 2'),
    ('Ленина, 45', 'Склад 3'),
    ('Гагарина, 10', 'Основной склад')
]

# Типы расходов
EXPENSE_TYPES = [
    ('Аренда помещения', 50000),
    ('Коммунальные услуги', 15000),
    ('Зарплата персонала', 120000),
    ('Транспортные расходы', 25000),
    ('Реклама и маркетинг', 30000),
    ('Офисные расходы', 10000),
    ('Налоги', 40000),
    ('Программное обеспечение', 8000),
    ('Интернет и связь', 5000),
    ('Прочие расходы', 12000)
]


def populate_role(db: Session) -> None:
    for role in ROLE:
        add_role(db, role)


def populate_transaction_type(db: Session) -> None:
    for type in TRANSACTION_TYPE:
        add_transaction_type(db, type)


def populate_categories(db: Session) -> None:
    """Заполнение категорий товаров"""
    for category in CATEGORIES:
        create_category(db, category)


def populate_warehouses(db: Session) -> None:
    """Заполнение складов"""
    for address, name in WAREHOUSES:
        create_warehouse(db, address, name)


def populate_products(db: Session) -> dict:
    """Заполнение товаров и возврат словаря с id товаров"""
    products_dict = {}
    for category_name, products in PRODUCTS.items():
        # Получаем id категории
        category = db.query(Category).filter(Category.name == category_name).first()
        if not category:
            print(f"Категория {category_name} не найдена")
            continue

        category_id = category.id

        # Создаем товары
        for product_name in products:
            create_product(db, product_name, category_id)

            # Сохраняем id созданного товара
            product = db.query(Product).filter(Product.name == product_name).first()
            if product:
                products_dict[product_name] = product.id

    return products_dict


def create_purchases_with_history(db: Session, products_dict: dict, start_date: datetime, end_date: datetime):
    """Создание исторических закупок товаров"""
    current_date = start_date
    day_increment = timedelta(days=1)

    # Словарь цен товаров для согласованности
    product_prices = {}

    while current_date <= end_date:
        # Определяем, сколько покупок сделать в этот день (0-5)
        num_purchases = random.randint(0, 5)

        for _ in range(num_purchases):
            # Выбираем случайный товар
            product_name = random.choice(list(products_dict.keys()))
            product_id = products_dict[product_name]

            # Устанавливаем или получаем цену закупки для согласованности
            if product_name not in product_prices:
                # Определяем базовую цену в зависимости от категории
                category_name = next(cat for cat, products in PRODUCTS.items() if product_name in products)
                if category_name == 'Электроника':
                    base_price = random.uniform(1000, 10000)
                elif category_name == 'Книги':
                    base_price = random.uniform(300, 1200)
                elif category_name == 'Одежда':
                    base_price = random.uniform(500, 3000)
                elif category_name == 'Спорттовары':
                    base_price = random.uniform(300, 2000)
                else:
                    base_price = random.uniform(10, 500)

                product_prices[product_name] = round(base_price, 2)

            purchase_price = product_prices[product_name]

            # Выбираем склад
            warehouse_id = random.randint(1, len(WAREHOUSES))

            # Определяем количество
            quantity = random.randint(10, 100)

            # Создаем запись о закупке с указанной датой
            purchase = Purchase(
                id_product=product_id,
                purchase_price=purchase_price,
                selling_price=purchase_price * 1.4,  # наценка 40%
                id_warehouse=warehouse_id,
                count=quantity,
                id_user=1,
                current_count=quantity,
                created_on=current_date
            )

            # Добавляем в БД
            try:
                db.add(purchase)
                db.commit()

                # Создаем транзакцию закупки
                transaction = Transaction(
                    id_type=2,  # тип "purchase"
                    id_purchase=purchase.id,
                    amount=quantity,
                    id_user=1,
                    created_on=current_date
                )
                db.add(transaction)
                db.commit()

                # Обновляем количество товара
                product = get_product_by_id(db, product_id)
                if product:
                    if product.total_count is None:
                        product.total_count = 0
                    product.total_count += quantity

                    # Устанавливаем текущую закупку, если это первая закупка
                    if product.id_purchase is None:
                        product.id_purchase = purchase.id

                    db.commit()

            except Exception as e:
                print(f"Ошибка при создании закупки: {e}")
                db.rollback()

        # Переходим к следующему дню
        current_date += day_increment


def create_sales_with_history(db: Session, products_dict: dict, start_date: datetime, end_date: datetime):
    """Создание исторических продаж товаров"""
    current_date = start_date + timedelta(days=7)  # Начинаем продажи через неделю после первых закупок
    day_increment = timedelta(days=1)

    while current_date <= end_date:
        # Определяем, сколько продаж сделать в этот день (0-8)
        # Делаем больше продаж в выходные
        is_weekend = current_date.weekday() >= 5
        num_sales = random.randint(0, 12 if is_weekend else 8)

        # Создаем сезонность: больше продаж в определенные месяцы
        month = current_date.month
        if month in [9, 12]:  # Сентябрь (школа), Декабрь (праздники)
            num_sales = int(num_sales * 1.5)  # Увеличиваем на 50%
        elif month in [1, 2]:  # Январь, Февраль (затишье)
            num_sales = int(num_sales * 0.7)  # Уменьшаем на 30%

        for _ in range(num_sales):
            # Выбираем случайный товар
            product_name = random.choice(list(products_dict.keys()))
            product_id = products_dict[product_name]

            # Получаем информацию о товаре
            product = get_product_by_id(db, product_id)
            if not product or not product.id_purchase or product.total_count <= 0:
                continue

            # Определяем количество для продажи
            max_quantity = min(product.total_count, 10)  # Не более 10 за раз или сколько осталось
            if max_quantity <= 0:
                continue

            quantity = random.randint(1, max_quantity)

            # Выбираем случайного пользователя
            user_id = random.randint(1, 2)

            # Создаем транзакцию продажи
            try:
                # Получаем текущую партию товара
                purchase_id = product.id_purchase

                # Создаем транзакцию
                create_transaction(db, 1, purchase_id, quantity, user_id)

                # Получаем созданную транзакцию и обновляем её дату
                latest_transaction = db.query(Transaction).order_by(Transaction.id.desc()).first()
                if latest_transaction:
                    latest_transaction.created_on = current_date
                    db.commit()

            except Exception as e:
                print(f"Ошибка при создании продажи: {e}")
                db.rollback()

        # Переходим к следующему дню
        current_date += day_increment


def create_writeoffs_with_history(db: Session, products_dict: dict, start_date: datetime, end_date: datetime):
    """Создание исторических списаний товаров"""
    current_date = start_date + timedelta(days=14)  # Начинаем списания через две недели после первых закупок
    day_increment = timedelta(days=3)  # Списания происходят реже, чем продажи

    while current_date <= end_date:
        # Определяем, сколько списаний сделать в этот день (0-2)
        num_writeoffs = random.randint(0, 2)

        for _ in range(num_writeoffs):
            # Выбираем случайный товар
            product_name = random.choice(list(products_dict.keys()))
            product_id = products_dict[product_name]

            # Получаем информацию о товаре
            product = get_product_by_id(db, product_id)
            if not product or not product.id_purchase or product.total_count <= 0:
                continue

            # Определяем количество для списания (обычно меньше, чем для продажи)
            max_quantity = min(product.total_count, 5)  # Не более 5 за раз или сколько осталось
            if max_quantity <= 0:
                continue

            quantity = random.randint(1, max_quantity)

            # Выбираем случайного пользователя
            user_id = random.randint(1, 2)

            # Создаем транзакцию списания
            try:
                # Получаем текущую партию товара
                purchase_id = product.id_purchase

                # Создаем транзакцию списания
                create_transaction(db, 3, purchase_id, quantity, user_id)

                # Получаем созданную транзакцию и обновляем её дату
                latest_transaction = db.query(Transaction).order_by(Transaction.id.desc()).first()
                if latest_transaction:
                    latest_transaction.created_on = current_date
                    db.commit()

            except Exception as e:
                print(f"Ошибка при создании списания: {e}")
                db.rollback()

        # Переходим к следующему дню (с шагом в несколько дней)
        current_date += day_increment


def create_expenses_with_history(db: Session, start_date: datetime, end_date: datetime):
    """Создание исторических расходов"""
    # Определяем периодичность разных типов расходов:
    # Ежемесячные, еженедельные и нерегулярные
    monthly_expenses = [0, 2, 6]  # Аренда, зарплата, налоги
    weekly_expenses = [3, 4, 5]  # Транспорт, реклама, офисные
    irregular_expenses = [1, 7, 8, 9]  # Коммуналка, ПО, интернет, прочие

    current_date = start_date
    day_increment = timedelta(days=1)

    while current_date <= end_date:
        day_of_month = current_date.day
        day_of_week = current_date.weekday()

        # Ежемесячные расходы (первое число месяца)
        if day_of_month == 1:
            for expense_idx in monthly_expenses:
                expense_name, base_amount = EXPENSE_TYPES[expense_idx]
                # Небольшое случайное отклонение в сумме расходов
                amount = base_amount * (0.9 + random.random() * 0.2)
                create_expense_with_date(db, expense_name, amount, 1, current_date)

        # Еженедельные расходы (каждый понедельник)
        if day_of_week == 0:
            for expense_idx in weekly_expenses:
                expense_name, base_amount = EXPENSE_TYPES[expense_idx]
                # Небольшое случайное отклонение в сумме расходов
                amount = base_amount * (0.8 + random.random() * 0.4)
                create_expense_with_date(db, expense_name, amount, 1, current_date)

        # Нерегулярные расходы (случайно с вероятностью 10%)
        if random.random() < 0.1:
            expense_idx = random.choice(irregular_expenses)
            expense_name, base_amount = EXPENSE_TYPES[expense_idx]
            # Значительное случайное отклонение в сумме нерегулярных расходов
            amount = base_amount * (0.5 + random.random() * 1.0)
            create_expense_with_date(db, expense_name, amount, 1, current_date)

        # Переходим к следующему дню
        current_date += day_increment


def create_expense_with_date(db: Session, name: str, cost: float, id_user: int, date: datetime):
    """Создание расхода с указанной датой"""
    expense = Expense(name=name, cost=cost, id_user=id_user, created_on=date)

    try:
        db.add(expense)
        db.commit()

        # Увеличиваем сумму косвенных расходов
        increase_param(db, "IndirectCosts", cost)

        print(f"Добавлен расход '{name}' на сумму {cost:.2f} от {date.strftime('%d.%m.%Y')}")
    except Exception as e:
        print(f"Ошибка при создании расхода: {e}")
        db.rollback()


if __name__ == "__main__":
    # Определяем временной период для данных (6 месяцев назад от текущей даты)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=180)

    with SessionLocal() as session:
        # Инициализация параметров
        add_param(session, "VAT", 20.0, description="НДС")
        add_param(session, "prevIndirectCosts", prevIndirectCosts,
                  description="Сумма косвенных расходов за прошлый месяц")
        add_param(session, "prevDirectSoldCosts", prevDirectSoldCosts,
                  description="Сумма прямых расходов реализованного товара за прошлый месяц")
        add_param(session, "IndirectCosts", 0, description="Сумма косвенных расходов")
        add_param(session, "DirectCosts", 0, description="Сумма прямых расходов")
        add_param(session, "DirectSoldCosts", 0, description="Сумма прямых расходов реализованного товара")
        add_param(session, "DirectIndirectRatio", DirectIndirectRatio,
                  description="Процент косвенных расходов от реализованного товара за прошлый месяц")
        add_param(session, "GM", 40, description="Желаемая маржинальность")
        add_param(session, "Rev", 0, description="Доход за текущий период")
        add_param(session, "NP", 0, description="Чистая прибыль за текущий период")
        add_param(session, "TE", 0, description="Общие расходы за текущий период")

        # Заполняем базовые справочники
        populate_role(session)
        populate_transaction_type(session)
        populate_categories(session)
        populate_warehouses(session)

        # Создаем пользователей
        create_user(session, 'admin', 'qwerty', 1)
        create_user(session, 'user1', 'qwerty', 2)

        # Заполняем товары и получаем их ID
        products_dict = populate_products(session)

        # Создаем исторические данные
        print(f"Создание исторических данных с {start_date.strftime('%d.%m.%Y')} по {end_date.strftime('%d.%m.%Y')}")
        create_purchases_with_history(session, products_dict, start_date, end_date)
        create_sales_with_history(session, products_dict, start_date, end_date)
        create_writeoffs_with_history(session, products_dict, start_date, end_date)
        create_expenses_with_history(session, start_date, end_date)

        # Подсчет итоговых результатов
        calc_period_results(session)

        print("Заполнение БД завершено успешно!")