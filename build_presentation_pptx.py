import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_paths):
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Colors
    C_DARK = RGBColor(0x45, 0x1A, 0x03)       # Deep Warm Brown #451a03
    C_PRIMARY = RGBColor(0x78, 0x35, 0x0F)    # Rich Brown #78350f
    C_GOLD = RGBColor(0xD9, 0x77, 0x06)       # Gold / Amber #d97706
    C_GOLD_LIGHT = RGBColor(0xFE, 0xF3, 0xC7) # Light Gold #fef3c7
    C_BG_LIGHT = RGBColor(0xFD, 0xFB, 0xF7)   # Cream Background #fdfbf7
    C_CARD_BG = RGBColor(0xFF, 0xFF, 0xFF)    # White Card #ffffff
    C_CARD_BORDER = RGBColor(0xFD, 0xE6, 0x8A)# Gold Border
    C_TEXT_MAIN = RGBColor(0x0F, 0x17, 0x2A)  # Slate 900
    C_TEXT_MUTED = RGBColor(0x64, 0x74, 0x8B) # Slate 500
    C_GREEN = RGBColor(0x05, 0x96, 0x69)      # Emerald 600
    C_RED = RGBColor(0xDC, 0x26, 0x26)        # Red 600
    C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)

    def add_header(slide, title_text, category_text="ИНДИЙСКИЙ ТРИКОТАЖ • АЛМАТЫ"):
        # Top banner / pill
        shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = C_DARK
        shape.line.fill.background()

        # Category
        tx_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.12), Inches(11.7), Inches(0.3))
        tf = tx_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = category_text.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_GOLD

        # Title
        p2 = tf.add_paragraph()
        p2.text = title_text
        p2.font.size = Pt(20)
        p2.font.bold = True
        p2.font.color.rgb = C_WHITE

    # ----------------------------------------------------
    # SLIDE 1: Title Slide (Dark Luxury Brand Theme)
    # ----------------------------------------------------
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_DARK
    bg1.line.fill.background()

    # Decorative Gold Line
    gold_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.5), Inches(0.12), Inches(4.5))
    gold_bar.fill.solid()
    gold_bar.fill.fore_color.rgb = C_GOLD
    gold_bar.line.fill.background()

    t_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.4), Inches(11.0), Inches(4.8))
    tf1 = t_box.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "КОММЕРЧЕСКАЯ ПРЕЗЕНТАЦИЯ И ИНВЕСТИЦИОННЫЙ ПЛАН"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_GOLD

    p2 = tf1.add_paragraph()
    p2.text = "Цифровая омниканальная экосистема сети «Индийский Трикотаж»"
    p2.font.size = Pt(32)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE
    p2.space_before = Pt(14)
    p2.space_after = Pt(12)

    p3 = tf1.add_paragraph()
    p3.text = "Интернет-магазин (Next.js 15) • Мобильное приложение (iOS & Android) • Kaspi Red 0-0-3 • Сквозной учет 16 филиалов в Алматы • ИИ Fashion Studio"
    p3.font.size = Pt(15)
    p3.font.color.rgb = RGBColor(0xFD, 0xE6, 0x8A)

    p4 = tf1.add_paragraph()
    p4.text = "г. Алматы • Ноябрь 2026 г. • Статус: Готово к демонстрации и промышленному внедрению"
    p4.font.size = Pt(12)
    p4.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    p4.space_before = Pt(40)

    # ----------------------------------------------------
    # SLIDE 2: Reality Check / Problems
    # ----------------------------------------------------
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "Текущая ситуация сети в Алматы и скрытые потери офлайн-модели")

    # 4 Problem Cards
    cards_data = [
        ("1. Дефицит в филиалах (Out-of-Stock)", "Клиент пришел в магазин, нужного размера нет — уходит с пустыми руками. Продавец не видит остатки других филиалов сети.", "Упущенные продажи: 2.0–2.5 млн ₸/мес", C_RED),
        ("2. Ручные продажи в Instagram / WhatsApp", "Менеджеры тратят по 20 минут на отправку фото и реквизитов Kaspi Gold вручную. Ночью и в часы пик заявки сгорают без чекаута.", "Потеря до 35% онлайн-заказов", C_RED),
        ("3. Высокая комиссия Kaspi Магазина", "Маркетплейс Kaspi.kz удерживает до 15% с каждой продажи трикотажа, не передавая базу прямых клиентов бренду.", "Потеря маржи: ~10-15% с чека", C_RED),
        ("4. Долгая оцифровка партий из Индии", "Товар приехал из Мумбаи/Тируппура, лежит на складе неделями, пока организуют фотосессии моделей и описания вручную.", "Замороженные оборотные средства", C_RED),
    ]

    for idx, (head, desc, stat, color) in enumerate(cards_data):
        row = idx // 2
        col = idx % 2
        left = Inches(0.8 + col * 5.95)
        top = Inches(1.5 + row * 2.7)

        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(5.75), Inches(2.45))
        card.fill.solid()
        card.fill.fore_color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        card.line.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)

        tx = s2.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), Inches(5.35), Inches(2.15))
        tf = tx.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = head
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_TEXT_MAIN

        p_desc = tf.add_paragraph()
        p_desc.text = desc
        p_desc.font.size = Pt(12)
        p_desc.font.color.rgb = C_TEXT_MUTED
        p_desc.space_before = Pt(6)

        p_stat = tf.add_paragraph()
        p_stat.text = "⚡ " + stat
        p_stat.font.size = Pt(12)
        p_stat.font.bold = True
        p_stat.font.color.rgb = color
        p_stat.space_before = Pt(8)

    # ----------------------------------------------------
    # SLIDE 3: Ready Solution Architecture
    # ----------------------------------------------------
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "Готовая омниканальная платформа «Индийский Трикотаж»")

    features = [
        ("Интернет-магазин Next.js 15", "Высокая скорость загрузки, адаптив под смартфоны, фильтры по составу, плотности, полу и наличию в 16 филиалах. Корзина с гибким выбором позиций.", C_PRIMARY),
        ("Мобильное приложение (iOS & Android)", "Нативное приложение с авторизацией по Face ID, Touch ID и СМС без паролей в стиле Kaspi. Гостевой режим для покупок и кешбэк 5%.", C_PRIMARY),
        ("Сквозной учет и пополнение 16 филиалов", "Покупатель и кассир видят остатки всех филиалов (Click & Collect за 2 часа). Автоматический контроль остатков и листы перемещений со склада.", C_PRIMARY),
        ("Kaspi Pay + Kaspi Red 0-0-3", "Прямой прием оплаты: Kaspi QR, Kaspi Gold, рассрочка Kaspi Red без переплат. Автоматическая фискализация чеков ОФД Webkassa.", C_PRIMARY),
    ]

    for idx, (title, desc, color) in enumerate(features):
        top = Inches(1.5 + idx * 1.35)
        bar = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, Inches(11.7), Inches(1.2))
        bar.fill.solid()
        bar.fill.fore_color.rgb = C_CARD_BG
        bar.line.color.rgb = RGBColor(0xEA, 0xE8, 0xE0)

        # left indicator
        dot = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), top, Inches(0.12), Inches(1.2))
        dot.fill.solid()
        dot.fill.fore_color.rgb = C_GOLD
        dot.line.fill.background()

        tx = s3.shapes.add_textbox(Inches(1.15), top + Inches(0.12), Inches(11.1), Inches(0.95))
        tf = tx.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"✓  {title}"
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = C_DARK

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = C_TEXT_MUTED
        p2.space_before = Pt(3)

    # ----------------------------------------------------
    # SLIDE 4: AI Variants
    # ----------------------------------------------------
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "ИИ-инструменты для работы платформы (3 Варианта внедрения)")

    ai_tiers = [
        ("ВАРИАНТ 1: «AI-Товаровед Lite»", "Эконом-вариант", [
            "Фото со смартфона на складе",
            "Определение состава ткани и плотности",
            "Генерация продающего описания за 3 сек",
            "Авто-перевод на казахский язык (RU/KZ)",
            "Экономия: заменяет копирайтера (150 тыс ₸/мес)",
        ], "Настройка: 80 000 ₸\nAPI: ~15 000 ₸/мес", RGBColor(0x02, 0x84, 0xC7)),

        ("ВАРИАНТ 2: «Smart Business»", "Оптимальный уровень", [
            "Все функции AI-Товароведа Lite",
            "Семантический умный поиск по смыслу",
            "WhatsApp AI-Консультант 24/7",
            "Подбор размера по росту/весу клиента",
            "Проверка остатков в 16 филиалах и ссылка на корзину",
            "Экономия: заменяет 2 операторов (450 тыс ₸/мес)",
        ], "Настройка: 180 000 ₸\nAPI: ~35 000 ₸/мес", C_GOLD),

        ("⭐ ВАРИАНТ 3: «Fashion Studio»", "ХИТ ПРЕМИУМ • ВЫБОР СЕТИ", [
            "Все функции Smart Business + WhatsApp 24/7",
            "Генерация фото одежды на виртуальных моделях",
            "Фото с манекена превращается в студийный лукбук",
            "Полный отказ от фотографов, моделей и аренды студий",
            "Экономия: от 900 000 ₸/мес на фотосессиях",
        ], "Настройка: 350 000 ₸\nAPI: ~65 000 ₸/мес", RGBColor(0x7C, 0x3A, 0xED)),
    ]

    for idx, (name, tag, bullet_list, price_text, accent_color) in enumerate(ai_tiers):
        left = Inches(0.8 + idx * 3.95)
        top = Inches(1.5)

        card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(3.8), Inches(5.4))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = accent_color
        card.line.width = Pt(2.0 if idx == 2 else 1.0)

        # Header tag
        tag_box = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(3.8), Inches(0.7))
        tag_box.fill.solid()
        tag_box.fill.fore_color.rgb = accent_color
        tag_box.line.fill.background()

        tx_tag = s4.shapes.add_textbox(left, top + Inches(0.08), Inches(3.8), Inches(0.55))
        tf_t = tx_tag.text_frame
        p_t = tf_t.paragraphs[0]
        p_t.text = tag.upper()
        p_t.alignment = PP_ALIGN.CENTER
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = C_WHITE

        # Body
        tx = s4.shapes.add_textbox(left + Inches(0.2), top + Inches(0.8), Inches(3.4), Inches(4.4))
        tf = tx.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = name
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_DARK

        for b in bullet_list:
            pb = tf.add_paragraph()
            pb.text = "• " + b
            pb.font.size = Pt(10)
            pb.font.color.rgb = C_TEXT_MAIN
            pb.space_before = Pt(4)

        pp = tf.add_paragraph()
        pp.text = price_text
        pp.font.size = Pt(11)
        pp.font.bold = True
        pp.font.color.rgb = accent_color
        pp.space_before = Pt(12)

    # ----------------------------------------------------
    # SLIDE 5: Development Cost Breakdown
    # ----------------------------------------------------
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "Стоимость разработки программного комплекса (ПО под ключ)")

    table_shape = s5.shapes.add_table(6, 4, Inches(0.8), Inches(1.5), Inches(11.73), Inches(4.5))
    table = table_shape.table

    table.columns[0].width = Inches(3.5)
    table.columns[1].width = Inches(4.63)
    table.columns[2].width = Inches(1.8)
    table.columns[3].width = Inches(1.8)

    headers = ["Компонент платформы", "Функциональный состав", "Рынок РК", "Наша цена (Премиум)"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_DARK
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = C_WHITE

    dev_rows = [
        ("Интернет-магазин (Web)", "Next.js 15, SSR, умные фильтры, корзина, геолокация 16 филиалов, RU/KZ", "3 500 000 ₸", "2 800 000 ₸"),
        ("Мобильное приложение (iOS/Android)", "Kaspi ID авторизация по СМС, системный Face ID/код, гостевой режим, Push", "4 500 000 ₸", "3 000 000 ₸"),
        ("Панель управления (CRM & Админка)", "Сквозной учет 16 складов в реальном времени, листы перемещений, роли кассиров", "2 500 000 ₸", "1 000 000 ₸"),
        ("Интеграция Kaspi Pay & ОФД", "Kaspi QR, Kaspi Gold, рассрочка Kaspi Red 0-0-3, фискализация Webkassa", "1 000 000 ₸", "450 000 ₸"),
        ("Интеграция ИИ-модулей платформы", "AI-товаровед, Fashion Studio (виртуальные модели) и семантический поиск", "2 500 000 ₸", "550 000 ₸"),
    ]

    for row_idx, r_data in enumerate(dev_rows, start=1):
        for col_idx, text in enumerate(r_data):
            cell = table.cell(row_idx, col_idx)
            cell.text = text
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(10)
            if col_idx == 3:
                p.font.bold = True
                p.font.color.rgb = C_GREEN
            elif col_idx == 2:
                p.font.color.rgb = C_TEXT_MUTED

    # Total Banner below table
    b_total = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.2), Inches(11.73), Inches(0.85))
    b_total.fill.solid()
    b_total.fill.fore_color.rgb = C_GOLD_LIGHT
    b_total.line.color.rgb = C_GOLD

    tx_tot = s5.shapes.add_textbox(Inches(1.0), Inches(6.25), Inches(11.3), Inches(0.75))
    tf_tot = tx_tot.text_frame
    p_tot = tf_tot.paragraphs[0]
    p_tot.text = "ИТОГО СТОИМОСТЬ РАЗРАБОТКИ ПЛАТФОРМЫ ПОД КЛЮЧ (ПРЕМИУМ): 7 800 000 ₸ (~$15 600)"
    p_tot.font.size = Pt(13)
    p_tot.font.bold = True
    p_tot.font.color.rgb = C_DARK

    p_sub = tf_tot.add_paragraph()
    p_sub.text = "Экономия заказчика превышает 45% по сравнению со стоимостью аналогичной заказной разработки в агентствах Алматы (15-18 млн ₸)."
    p_sub.font.size = Pt(10)
    p_sub.font.color.rgb = C_PRIMARY

    # ----------------------------------------------------
    # SLIDE 6: Startup Costs
    # ----------------------------------------------------
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "Стоимость запуска проекта (Входные расходы заказчика под ключ)")

    table_s6 = s6.shapes.add_table(6, 4, Inches(0.8), Inches(1.5), Inches(11.73), Inches(4.5))
    t6 = table_s6.table

    t6.columns[0].width = Inches(3.5)
    t6.columns[1].width = Inches(4.63)
    t6.columns[2].width = Inches(1.8)
    t6.columns[3].width = Inches(1.8)

    headers6 = ["Статья расходов на запуск", "Назначение и состав статьи", "Срок / Кол-во", "Сумма (₸)"]
    for i, h in enumerate(headers6):
        cell = t6.cell(0, i)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_DARK
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = C_WHITE

    start_rows = [
        ("Инфраструктура на 12 мес. (PS.kz)", "VPS в ЦОД Алматы (Закон о ПДн РК) + домен .kz + SSL + БД + S3", "12 месяцев", "285 000 ₸"),
        ("Лицензии Apple & Google Play", "Apple Developer ($99/год) + Google Play Console ($25 разово)", "1 год", "62 000 ₸"),
        ("Kaspi Pay + ОФД Webkassa", "Регистрация мерчанта, боевые ключи Kaspi Pay + онлайн-касса", "12 месяцев", "145 000 ₸"),
        ("Оборудование филиалов и склад", "Парк Заказчика: 16 сканеров + принтер (сопряжение 0 ₸)", "В наличии у сети", "0 ₸ (Экономия: -272 000 ₸)"),
        ("Настройка ИИ (WhatsApp 24/7 + Models)", "Разовая интеграция WhatsApp API (180 тыс) + AI Fashion Studio (350 тыс)", "Разово (Setup)", "530 000 ₸"),
    ]

    for row_idx, r_data in enumerate(start_rows, start=1):
        for col_idx, text in enumerate(r_data):
            cell = t6.cell(row_idx, col_idx)
            cell.text = text
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(10)
            if row_idx == 4:
                p.font.bold = True
                p.font.color.rgb = C_GREEN
            elif col_idx == 3:
                p.font.bold = True
                p.font.color.rgb = C_PRIMARY

    # Bottom launch info
    b_launch = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.2), Inches(11.73), Inches(0.85))
    b_launch.fill.solid()
    b_launch.fill.fore_color.rgb = RGBColor(0xEC, 0xFD, 0xF5)
    b_launch.line.color.rgb = C_GREEN

    tx_l = s6.shapes.add_textbox(Inches(1.0), Inches(6.25), Inches(11.3), Inches(0.75))
    tf_l = tx_l.text_frame
    p_l = tf_l.paragraphs[0]
    p_l.text = "ИТОГО СТОИМОСТЬ ЗАПУСКА ПОД КЛЮЧ (ТАРИФ «ПРЕМИУМ»): 1 680 000 ₸"
    p_l.font.size = Pt(13)
    p_l.font.bold = True
    p_l.font.color.rgb = C_GREEN

    p_lsub = tf_l.add_paragraph()
    p_lsub.text = "🎁 Прямая экономия −272 000 ₸ на оборудовании сети! Включает 15 000 СМС (118 000 ₸) и 6 месяцев VIP-сопровождения (540 000 ₸)."
    p_lsub.font.size = Pt(10)
    p_lsub.font.color.rgb = C_TEXT_MAIN

    # ----------------------------------------------------
    # SLIDE 7: Overall Total Packages (The Big Commercial Pitch)
    # ----------------------------------------------------
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "Итоговая общая сумма проекта (Стоимость сайта + Стоимость запуска)")

    tariffs = [
        ("Тариф «СТАНДАРТ»", "Базовый запуск", "4 900 000 ₸", "950 000 ₸", "5 850 000 ₸", "~ $11 700", [
            "Интернет-магазин (Web)",
            "Мобильные приложения iOS/Android",
            "Kaspi ID (Face ID / СМС)",
            "16 филиалов в Алматы",
            "Kaspi Red 0-0-3 + ОФД",
            "AI Lite (распознавание фото)",
            "Серверы и домен .kz на 1 год",
            "1 месяц гарантийного саппорта",
        ], C_TEXT_MUTED),

        ("Тариф «БИЗНЕС»", "Оптимальный уровень", "6 200 000 ₸", "1 110 000 ₸", "7 310 000 ₸", "~ $14 620", [
            "Все из тарифа «Стандарт»",
            "WhatsApp AI-продавец 24/7",
            "Подбор размера в мессенджере",
            "Сканеры сети: 0 ₸ (Экономия 240 тыс ₸)",
            "Серверы и домен .kz на 1 год",
            "Лицензии Apple & Google",
            "3 месяца техподдержки",
            "Обучение персонала 16 точек",
        ], C_GOLD),

        ("⭐ Тариф «ПРЕМИУМ / ENTERPRISE»", "ХИТ ПРОДАЖ • ВЫБОР СЕТИ", "7 800 000 ₸", "1 680 000 ₸", "9 480 000 ₸", "~ $18 960", [
            "Все из тарифа «Бизнес» + WhatsApp 24/7",
            "AI Fashion Studio (виртуальные модели)",
            "Полная замена фотосессий одеждой",
            "Оборудование сети: 0 ₸ (Экономия 272 тыс ₸)",
            "Пакет 15 000 СМС для входа",
            "6 месяцев VIP-сопровождения (SLA 30 мин)",
            "Выделенный менеджер проекта",
            "Контроль дефицита и листы перемещений",
        ], RGBColor(0x7C, 0x3A, 0xED)),
    ]

    for idx, (t_name, t_tag, t_dev, t_start, t_total, t_usd, bullets, t_col) in enumerate(tariffs):
        left = Inches(0.8 + idx * 3.95)
        top = Inches(1.5)

        card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, Inches(3.8), Inches(5.4))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = t_col
        card.line.width = Pt(2.5 if idx == 2 else 1.0)

        # Header bar
        hbar = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(3.8), Inches(0.7))
        hbar.fill.solid()
        hbar.fill.fore_color.rgb = t_col
        hbar.line.fill.background()

        tx_h = s7.shapes.add_textbox(left, top + Inches(0.08), Inches(3.8), Inches(0.55))
        tf_h = tx_h.text_frame
        p_th = tf_h.paragraphs[0]
        p_th.text = t_tag.upper()
        p_th.alignment = PP_ALIGN.CENTER
        p_th.font.size = Pt(10)
        p_th.font.bold = True
        p_th.font.color.rgb = C_WHITE

        # Content
        tx = s7.shapes.add_textbox(left + Inches(0.2), top + Inches(0.78), Inches(3.4), Inches(4.5))
        tf = tx.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = t_name
        p.font.size = Pt(13.5)
        p.font.bold = True
        p.font.color.rgb = C_DARK

        p_sum = tf.add_paragraph()
        p_sum.text = f"{t_total}"
        p_sum.font.size = Pt(18)
        p_sum.font.bold = True
        p_sum.font.color.rgb = C_GREEN if idx == 2 else t_col
        p_sum.space_before = Pt(4)

        p_usd = tf.add_paragraph()
        p_usd.text = f"({t_usd})"
        p_usd.font.size = Pt(11)
        p_usd.font.color.rgb = C_TEXT_MUTED

        p_split = tf.add_paragraph()
        p_split.text = f"Сайт: {t_dev} + Запуск: {t_start}"
        p_split.font.size = Pt(9.5)
        p_split.font.color.rgb = C_PRIMARY
        p_split.space_before = Pt(4)

        for b in bullets:
            pb = tf.add_paragraph()
            pb.text = "✓ " + b
            pb.font.size = Pt(9.5)
            pb.font.color.rgb = C_TEXT_MAIN
            pb.space_before = Pt(2)

    # ----------------------------------------------------
    # SLIDE 8: ROI and Payback for ALL TARIFFS
    # ----------------------------------------------------
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "Финансовый эффект сети и сроки окупаемости инвестиций (ROI)")

    # Left card: calculations
    c_left = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.5), Inches(6.0), Inches(5.4))
    c_left.fill.solid()
    c_left.fill.fore_color.rgb = C_CARD_BG
    c_left.line.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)

    tx_l = s8.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(5.6), Inches(5.0))
    tf_l = tx_l.text_frame
    tf_l.word_wrap = True

    p = tf_l.paragraphs[0]
    p.text = "РАСЧЕТ ДОПОЛНИТЕЛЬНОЙ ПРИБЫЛИ СЕТИ В МЕСЯЦ"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_DARK

    rows_fin = [
        ("Онлайн-заказы курьером (20 чек/день)", "+ 2 475 000 ₸ / мес"),
        ("Самовывоз из 16 филиалов (Click & Collect)", "+ 1 856 000 ₸ / мес"),
        ("Ликвидация дефицита (Out-of-Stock) по складам", "+ 1 650 000 ₸ / мес"),
        ("Экономия на комиссиях Kaspi Магазина", "+ 450 000 ₸ / мес"),
        ("Минус ежемесячный OPEX (сервер, СМС, ИИ)", "- 75 000 ₸ / мес"),
        ("ИТОГО ЧИСТАЯ ПРИБЫЛЬ СЕТИ:", "+ 6 356 000 ₸ / месяц"),
    ]

    for title, val in rows_fin:
        pt = tf_l.add_paragraph()
        pt.text = f"{title}:  {val}"
        pt.font.size = Pt(11)
        pt.font.bold = ("ИТОГО" in title)
        pt.font.color.rgb = C_GREEN if ("+" in val or "ИТОГО" in title) else (C_RED if "-" in val else C_TEXT_MAIN)
        pt.space_before = Pt(6)

    # Right card: Payback for ALL TARIFFS & Retainer Rules
    c_right = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.1), Inches(1.5), Inches(5.4), Inches(5.4))
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = C_CARD_BG
    c_right.line.color.rgb = C_GOLD
    c_right.line.width = Pt(1.5)

    tx_r = s8.shapes.add_textbox(Inches(7.3), Inches(1.7), Inches(5.0), Inches(5.0))
    tf_r = tx_r.text_frame
    tf_r.word_wrap = True

    pr = tf_r.paragraphs[0]
    pr.text = "СРОКИ ОКУПАЕМОСТИ ПО ВСЕМ ТАРИФАМ:"
    pr.font.size = Pt(13)
    pr.font.bold = True
    pr.font.color.rgb = C_DARK

    paybacks = [
        ("Тариф «СТАНДАРТ» (5 850 000 ₸):", "27–28 дней (0.92 месяца)"),
        ("Тариф «БИЗНЕС» (7 310 000 ₸):", "34–35 дней (1.15 месяца)"),
        ("⭐ Тариф «ПРЕМИУМ» (9 480 000 ₸):", "44–45 дней (1.49 месяца)"),
    ]

    for p_name, p_days in paybacks:
        p_row = tf_r.add_paragraph()
        p_row.text = f"{p_name}  {p_days}"
        p_row.font.size = Pt(11)
        p_row.font.bold = True
        p_row.font.color.rgb = C_GREEN if "ПРЕМИУМ" in p_name else C_PRIMARY
        p_row.space_before = Pt(4)

    p_save = tf_r.add_paragraph()
    p_save.text = "🎁 Экономия 272 000 ₸: за счет использования существующих сканеров и принтеров сети."
    p_save.font.size = Pt(10)
    p_save.font.bold = True
    p_save.font.color.rgb = C_GREEN
    p_save.space_before = Pt(6)

    pr_ret = tf_r.add_paragraph()
    pr_ret.text = "РЕГЛАМЕНТ АБОНЕНТСКОГО СОПРОВОЖДЕНИЯ"
    pr_ret.font.size = Pt(12)
    pr_ret.font.bold = True
    pr_ret.font.color.rgb = C_DARK
    pr_ret.space_before = Pt(10)

    pr_ret_txt = tf_r.add_paragraph()
    pr_ret_txt.text = (
        "• Базовый саппорт: 150 000 ₸/мес (серверы, бэкапы каждые 6 ч, SSL, домен)\n"
        "• Премиум DevOps: 250 000 ₸/мес (+ обязательная адаптация под новые версии iOS/Android)\n"
        "⚠️ Доработка любых новых функций производится исключительно по отдельным Доп. соглашениям по ТЗ. На разработчике никто «не ездит» — каждый новый функционал оплачивается отдельно."
    )
    pr_ret_txt.font.size = Pt(9.5)
    pr_ret_txt.font.color.rgb = C_TEXT_MAIN
    pr_ret_txt.space_before = Pt(3)

    # ----------------------------------------------------
    # SLIDE 9: 14-day Launch & Closing Call to Action (PREMIUM)
    # ----------------------------------------------------
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "Дорожная карта запуска Тарифа «Премиум» за 14 рабочих дней")

    steps_data = [
        ("Дни 1 – 3", "Юридический запуск и инфраструктура", "Подписание договора, аванс 50%, регистрация домена indiatrikotaj.kz, аккаунты Apple/Google, серверы PS.kz в ЦОД Алматы"),
        ("Дни 4 – 7", "Шлюзы и платежный контур", "Боевое подключение Kaspi Pay (QR, Gold, Red 0-0-3), ОФД Webkassa, подключение WhatsApp Business API и СМС-шлюза Mobizon"),
        ("Дни 8 – 11", "ИИ Премиум, Склады и Оборудование", "AI Fashion Studio (виртуальные модели), запуск WhatsApp AI 24/7, сопряжение 16 сканеров касс и калибровка принтеров сети"),
        ("Дни 12 – 14", "Тестирование, Обучение и Релиз", "Тестовый платеж 100 ₸ Kaspi QR с чеком, обучение кассиров 16 филиалов, публикация в App Store & Google Play, старт продаж"),
    ]

    for idx, (days, name, desc) in enumerate(steps_data):
        top = Inches(1.5 + idx * 1.05)
        bar = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, Inches(11.7), Inches(0.92))
        bar.fill.solid()
        bar.fill.fore_color.rgb = C_CARD_BG
        bar.line.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)

        tx = s9.shapes.add_textbox(Inches(1.0), top + Inches(0.08), Inches(11.3), Inches(0.75))
        tf = tx.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = f"{days}  |  {name}"
        p.font.size = Pt(12.5)
        p.font.bold = True
        p.font.color.rgb = C_PRIMARY

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = C_TEXT_MAIN
        p2.space_before = Pt(2)

    # Final CTA Box
    cta_box = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.9), Inches(11.7), Inches(1.2))
    cta_box.fill.solid()
    cta_box.fill.fore_color.rgb = C_DARK
    cta_box.line.color.rgb = C_GOLD

    tx_c = s9.shapes.add_textbox(Inches(1.1), Inches(5.95), Inches(11.1), Inches(1.05))
    tf_c = tx_c.text_frame
    tf_c.word_wrap = True

    pc = tf_c.paragraphs[0]
    pc.text = "ГОТОВЫ ПРОДЕМОНСТРИРОВАТЬ РАБОТАЮЩЕЕ ПРИЛОЖЕНИЕ И САЙТ ПРЯМО СЕЙЧАС"
    pc.font.size = Pt(13)
    pc.font.bold = True
    pc.font.color.rgb = C_GOLD

    pc2 = tf_c.add_paragraph()
    pc2.text = "Контакты проектной группы: +7 (701) 992-84-12 • г. Алматы • Все исключительные права на код переходят к заказчику."
    pc2.font.size = Pt(11)
    pc2.font.color.rgb = C_WHITE
    pc2.space_before = Pt(3)

    for p in output_paths:
        os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
        try:
            prs.save(p)
            print(f"Presentation saved successfully to {p}")
        except PermissionError:
            alt_path = p.replace(".pptx", "_updated.pptx")
            prs.save(alt_path)
            print(f"Warning: {p} is currently locked (open in PowerPoint). Saved updated version to {alt_path}")

if __name__ == "__main__":
    target_paths = [
        r"C:\Users\User\.gemini\antigravity\scratch\india-trikotaj\investor_presentation_indiatrikotaj.pptx",
        r"C:\Users\User\.gemini\antigravity\brain\a847fa1d-0601-423a-8270-6915cd64a216\investor_presentation_indiatrikotaj.pptx"
    ]
    create_presentation(target_paths)
