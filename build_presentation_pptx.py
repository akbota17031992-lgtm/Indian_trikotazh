import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def create_presentation(output_paths):
    prs = Presentation()
    # 16:9 Widescreen (13.333 x 7.5 inches)
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Executive Brand Palette
    C_DARK = RGBColor(0x45, 0x1A, 0x03)       # Deep Warm Brown #451a03
    C_PRIMARY = RGBColor(0x78, 0x35, 0x0F)    # Rich Brown #78350f
    C_GOLD = RGBColor(0xD9, 0x77, 0x06)       # Gold / Amber #d97706
    C_GOLD_LIGHT = RGBColor(0xFE, 0xF3, 0xC7) # Light Gold #fef3c7
    C_BG_LIGHT = RGBColor(0xFD, 0xFB, 0xF7)   # Cream Background #fdfbf7
    C_CARD_BG = RGBColor(0xFF, 0xFF, 0xFF)    # Pure White Card #ffffff
    C_CARD_BORDER = RGBColor(0xE2, 0xE8, 0xF0)# Subtle Border #e2e8f0
    C_TEXT_MAIN = RGBColor(0x0F, 0x17, 0x2A)  # Slate 900
    C_TEXT_MUTED = RGBColor(0x47, 0x55, 0x69) # Slate 600
    C_GREEN = RGBColor(0x05, 0x96, 0x69)      # Emerald 600
    C_GREEN_LIGHT = RGBColor(0xEC, 0xFD, 0xF5)# Light Emerald #ecfdf5
    C_RED = RGBColor(0xDC, 0x26, 0x26)        # Red 600
    C_WHITE = RGBColor(0xFF, 0xFF, 0xFF)      # White
    C_PURPLE = RGBColor(0x7C, 0x3A, 0xED)     # Purple 600 (Premium Accent)

    def add_header(slide, title_text, category_text="ИНДИЙСКИЙ ТРИКОТАЖ • АЛМАТЫ"):
        # Header banner
        shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.15)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = C_DARK
        shape.line.fill.background()

        # Category and Title in one text frame
        tx_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.12), Inches(11.73), Inches(0.95))
        tf = tx_box.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = category_text.upper()
        p.font.name = "Arial"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_GOLD

        p2 = tf.add_paragraph()
        p2.text = title_text
        p2.font.name = "Arial"
        p2.font.size = Pt(19)
        p2.font.bold = True
        p2.font.color.rgb = C_WHITE
        p2.space_before = Pt(3)

    # =========================================================================
    # SLIDE 1: Title Slide (Dark Luxury Brand Theme)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = C_DARK
    bg1.line.fill.background()

    gold_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.4), Inches(0.12), Inches(4.7))
    gold_bar.fill.solid()
    gold_bar.fill.fore_color.rgb = C_GOLD
    gold_bar.line.fill.background()

    t_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.3), Inches(11.3), Inches(4.9))
    tf1 = t_box.text_frame
    tf1.word_wrap = True

    p = tf1.paragraphs[0]
    p.text = "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ И ПРЕЗЕНТАЦИЯ ПРОЕКТА"
    p.font.name = "Arial"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_GOLD

    p2 = tf1.add_paragraph()
    p2.text = "Омниканальная цифровая экосистема розничной сети\n«Индийский Трикотаж» (г. Алматы)"
    p2.font.name = "Arial"
    p2.font.size = Pt(29)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE
    p2.space_before = Pt(12)
    p2.space_after = Pt(12)

    p3 = tf1.add_paragraph()
    p3.text = "Интернет-магазин (Next.js 15) • Мобильное приложение (iOS & Android) • Kaspi Red (0-0-3)\nСквозной учет 16 филиалов в Алматы • ИИ Fashion Studio (виртуальные фотомодели)"
    p3.font.name = "Arial"
    p3.font.size = Pt(14)
    p3.font.color.rgb = RGBColor(0xFD, 0xE6, 0x8A)

    # Metadata badges box
    meta_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.2), Inches(5.1), Inches(11.0), Inches(1.4))
    meta_card.fill.solid()
    meta_card.fill.fore_color.rgb = RGBColor(0x57, 0x22, 0x05)
    meta_card.line.color.rgb = C_GOLD
    meta_card.line.width = Pt(1.0)

    tx_m = s1.shapes.add_textbox(Inches(1.4), Inches(5.15), Inches(10.6), Inches(1.3))
    tf_m = tx_m.text_frame
    tf_m.word_wrap = True

    pm1 = tf_m.paragraphs[0]
    pm1.text = "• Заказчик: Руководству и учредителям торговой сети «Индийский Трикотаж»"
    pm1.font.name = "Arial"
    pm1.font.size = Pt(11)
    pm1.font.bold = True
    pm1.font.color.rgb = C_WHITE

    pm2 = tf_m.add_paragraph()
    pm2.text = "• Масштаб: 16 розничных филиалов в торговых центрах Алматы + Склады + Онлайн-продажи"
    pm2.font.name = "Arial"
    pm2.font.size = Pt(11)
    pm2.font.color.rgb = RGBColor(0xFE, 0xF0, 0x8A)
    pm2.space_before = Pt(3)

    pm3 = tf_m.add_paragraph()
    pm3.text = "• Статус: Платформа разработана, отлажена на реальных данных и готова к запуску • Ноябрь 2026 г."
    pm3.font.name = "Arial"
    pm3.font.size = Pt(11)
    pm3.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    pm3.space_before = Pt(3)

    # =========================================================================
    # SLIDE 2: 5 Ключевых бизнес-задач сети (как в Таблице 1 КП)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    add_header(s2, "1. Бизнес-цели и задачи проекта сети «Индийский Трикотаж»")

    tasks = [
        ("1. Сквозной учет остатков", "Покупатель не нашел размер в филиале — ушел к конкурентам", "Онлайн-мониторинг 16 филиалов в реальном времени, самовывоз Click & Collect за 2 часа", C_PRIMARY),
        ("2. Пополнение витрин", "Полки пустеют незаметно, возникает дефицит (Out-of-Stock)", "Авто-контроль неснижаемого остатка и листы перемещения со склада", C_PRIMARY),
        ("3. Прямой приём Kaspi Pay", "Потеря 10–15% комиссии при продажах через сторонние маркетплейсы", "Приём Kaspi QR, Kaspi Gold, Kaspi Red (0-0-3) без комиссий маркетплейсов + ОФД Webkassa", C_GREEN),
        ("4. Оцифровка коллекций ИИ", "Дорогие и долгие фотосессии моделей (от 900 000 ₸/мес)", "Оцифровка карточки за 3 сек по фото + AI Fashion Studio (виртуальные модели без фотостудий)", C_PURPLE),
        ("5. Мобильное присутствие", "Зависимость от Instagram Direct и потеря повторных продаж", "Нативное приложение iOS & Android с авторизацией по Face ID и СМС без паролей в стиле Kaspi", C_PRIMARY),
    ]

    for idx, (title, problem, solution, accent) in enumerate(tasks):
        top = Inches(1.35 + idx * 1.15)
        
        # Row card
        card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, Inches(11.73), Inches(1.05))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = C_CARD_BORDER
        card.line.width = Pt(1.0)

        # Left indicator bar
        bar = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), top, Inches(0.12), Inches(1.05))
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()

        # Task Name Column
        tx_t = s2.shapes.add_textbox(Inches(1.05), top + Inches(0.1), Inches(2.8), Inches(0.85))
        tf_t = tx_t.text_frame
        tf_t.word_wrap = True
        pt = tf_t.paragraphs[0]
        pt.text = title
        pt.font.name = "Arial"
        pt.font.size = Pt(12.5)
        pt.font.bold = True
        pt.font.color.rgb = C_DARK

        # Offline Problem Column
        tx_p = s2.shapes.add_textbox(Inches(3.9), top + Inches(0.08), Inches(3.7), Inches(0.85))
        tf_p = tx_p.text_frame
        tf_p.word_wrap = True
        pp_h = tf_p.paragraphs[0]
        pp_h.text = "ПРОБЛЕМА ОФЛАЙНА:"
        pp_h.font.name = "Arial"
        pp_h.font.size = Pt(9)
        pp_h.font.bold = True
        pp_h.font.color.rgb = C_RED
        pp = tf_p.add_paragraph()
        pp.text = problem
        pp.font.name = "Arial"
        pp.font.size = Pt(10.5)
        pp.font.color.rgb = C_TEXT_MUTED

        # Digital Solution Column
        tx_s = s2.shapes.add_textbox(Inches(7.7), top + Inches(0.08), Inches(4.7), Inches(0.85))
        tf_s = tx_s.text_frame
        tf_s.word_wrap = True
        ps_h = tf_s.paragraphs[0]
        ps_h.text = "РЕШЕНИЕ ЭКОСИСТЕМЫ:"
        ps_h.font.name = "Arial"
        ps_h.font.size = Pt(9)
        ps_h.font.bold = True
        ps_h.font.color.rgb = C_GREEN
        ps = tf_s.add_paragraph()
        ps.text = solution
        ps.font.name = "Arial"
        ps.font.size = Pt(10.5)
        ps.font.bold = True
        ps.font.color.rgb = C_TEXT_MAIN

    # =========================================================================
    # SLIDE 3: Архитектура готового программного комплекса (как в Таблице 2 КП)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    add_header(s3, "2. Архитектура разработанного программного комплекса")

    modules = [
        ("Интернет-магазин (Web)", "Next.js 15, React 19, SSR", [
            "Мгновенная загрузка каталога",
            "SEO в Google и Yandex",
            "Умные фильтры по составу и филиалам",
            "Мультиязычность (Русский / Қазақша)",
            "Быстрый чекаут и выбор доставки",
        ], C_PRIMARY),

        ("Мобильное приложение", "React Native (Expo 52)", [
            "Вход по СМС без паролей в стиле Kaspi",
            "Авторизация по Face ID и коду смартфона",
            "Кешбэк 5% бонусами и акции сети",
            "Push-уведомления об акциях и скидках",
            "Гостевой режим для быстрых покупок",
        ], C_PRIMARY),

        ("Панель управления (CRM)", "Web Admin, PostgreSQL", [
            "Сквозной учет остатков по 16 складам",
            "Авто-контроль дефицита (Out-of-Stock)",
            "Печать ценников со штрихкодами",
            "Роли: Директор, Менеджер, Кассир",
            "Листы перемещения товаров со склада",
        ], C_PRIMARY),

        ("Платежи, ОФД и ИИ", "Kaspi API + Webkassa + AI", [
            "Kaspi QR, Kaspi Gold, Kaspi Red 0-0-3",
            "Фискализация чеков с отправкой в WhatsApp",
            "AI Ingest (оцифровка одежды за 3 сек)",
            "WhatsApp AI-продавец 24/7 консультант",
            "AI Fashion Studio (виртуальные модели)",
        ], C_GOLD),
    ]

    for idx, (title, stack, bullets, accent) in enumerate(modules):
        left = Inches(0.8 + idx * 2.98)
        top = Inches(1.4)
        width = Inches(2.83)
        height = Inches(5.6)

        card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = accent
        card.line.width = Pt(1.5)

        # Header bar on card
        hbar = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.9))
        hbar.fill.solid()
        hbar.fill.fore_color.rgb = accent
        hbar.line.fill.background()

        tx_h = s3.shapes.add_textbox(left + Inches(0.1), top + Inches(0.08), width - Inches(0.2), Inches(0.75))
        tf_h = tx_h.text_frame
        tf_h.word_wrap = True
        ph1 = tf_h.paragraphs[0]
        ph1.text = title
        ph1.font.name = "Arial"
        ph1.font.size = Pt(11.5)
        ph1.font.bold = True
        ph1.font.color.rgb = C_WHITE
        ph1.alignment = PP_ALIGN.CENTER

        ph2 = tf_h.add_paragraph()
        ph2.text = stack
        ph2.font.name = "Arial"
        ph2.font.size = Pt(9.5)
        ph2.font.color.rgb = RGBColor(0xFE, 0xF0, 0x8A)
        ph2.alignment = PP_ALIGN.CENTER

        # Body bullets
        tx_b = s3.shapes.add_textbox(left + Inches(0.15), top + Inches(1.0), width - Inches(0.3), Inches(4.4))
        tf_b = tx_b.text_frame
        tf_b.word_wrap = True

        for bi, bullet in enumerate(bullets):
            p = tf_b.paragraphs[0] if bi == 0 else tf_b.add_paragraph()
            p.text = "✓ " + bullet
            p.font.name = "Arial"
            p.font.size = Pt(10)
            p.font.color.rgb = C_TEXT_MAIN
            if bi > 0:
                p.space_before = Pt(8)

    # =========================================================================
    # SLIDE 4: Пакет ИИ-инструментов (3 Варианта внедрения)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    add_header(s4, "ИИ-платформа для сети: Оцифровка, WhatsApp-продажи и Fashion Studio")

    ai_cards = [
        ("ВАРИАНТ 1: «AI LITE»", "ЭКОНОМ-ВХОД", [
            "Оцифровка карточки товара по фото со смартфона за 3 секунды",
            "Авто-определение ткани, состава, рекомендаций по уходу",
            "Мгновенный перевод на казахский язык (RU/KZ)",
            "Экономия: заменяет копирайтера (150 000 ₸/мес)",
        ], "Настройка (разово): 80 000 ₸", C_PRIMARY),

        ("ВАРИАНТ 2: «SMART BUSINESS»", "ОПТИМАЛЬНЫЙ УРОВЕНЬ", [
            "Все функции AI Lite (оцифровка за 3 секунды)",
            "WhatsApp AI-продавец 24/7 (консультации в чате)",
            "Подбор размера одежды по росту и весу покупателя",
            "Проверка наличия в 16 филиалах и отправка корзины",
            "Экономия: заменяет 2 менеджеров (450 000 ₸/мес)",
        ], "Настройка (разово): 180 000 ₸", C_GOLD),

        ("⭐ ВАРИАНТ 3: «FASHION STUDIO»", "ХИТ ПРЕМИУМ • ВЫБОР СЕТИ", [
            "Все функции Smart Business + WhatsApp AI 24/7",
            "Виртуальные фотомодели: фото с вешалки превращается в каталог",
            "Полный отказ от аренды фотостудий, моделей и фотографов",
            "Персональные кросс-сейл рекомендации к каждому платью",
            "Экономия: от 900 000 ₸/мес на фотосессиях",
        ], "Настройка (разово): 530 000 ₸ (WhatsApp + Studio)", C_PURPLE),
    ]

    for idx, (title, tag, bullets, cost_text, accent) in enumerate(ai_cards):
        left = Inches(0.8 + idx * 3.98)
        top = Inches(1.4)
        width = Inches(3.78)
        height = Inches(5.6)

        card = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = accent
        card.line.width = Pt(2.0 if idx == 2 else 1.0)

        # Header tag
        hbar = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, Inches(0.85))
        hbar.fill.solid()
        hbar.fill.fore_color.rgb = accent
        hbar.line.fill.background()

        tx_h = s4.shapes.add_textbox(left + Inches(0.1), top + Inches(0.08), width - Inches(0.2), Inches(0.7))
        tf_h = tx_h.text_frame
        tf_h.word_wrap = True
        p1 = tf_h.paragraphs[0]
        p1.text = tag
        p1.font.name = "Arial"
        p1.font.size = Pt(9.5)
        p1.font.bold = True
        p1.font.color.rgb = RGBColor(0xFE, 0xF0, 0x8A) if idx == 2 else C_WHITE
        p1.alignment = PP_ALIGN.CENTER

        p2 = tf_h.add_paragraph()
        p2.text = title
        p2.font.name = "Arial"
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = C_WHITE
        p2.alignment = PP_ALIGN.CENTER

        # Bullets
        tx_b = s4.shapes.add_textbox(left + Inches(0.2), top + Inches(0.95), width - Inches(0.4), Inches(3.7))
        tf_b = tx_b.text_frame
        tf_b.word_wrap = True

        for bi, bullet in enumerate(bullets):
            p = tf_b.paragraphs[0] if bi == 0 else tf_b.add_paragraph()
            p.text = "• " + bullet
            p.font.name = "Arial"
            p.font.size = Pt(10.5)
            p.font.color.rgb = C_TEXT_MAIN
            if bi > 0:
                p.space_before = Pt(6)

        # Cost footer box
        c_foot = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.2), top + Inches(4.7), width - Inches(0.4), Inches(0.75))
        c_foot.fill.solid()
        c_foot.fill.fore_color.rgb = RGBColor(0xF8, 0xFA, 0xFC)
        c_foot.line.color.rgb = accent
        c_foot.line.width = Pt(1.0)

        tx_f = s4.shapes.add_textbox(left + Inches(0.25), top + Inches(4.75), width - Inches(0.5), Inches(0.65))
        tf_f = tx_f.text_frame
        tf_f.word_wrap = True
        pf = tf_f.paragraphs[0]
        pf.text = cost_text
        pf.font.name = "Arial"
        pf.font.size = Pt(11)
        pf.font.bold = True
        pf.font.color.rgb = accent
        pf.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 5: ЕДИНАЯ СВОДНАЯ ТАБЛИЦА РАСЧЕТОВ ПО ВСЕМ ТАРИФАМ (ГЛАВНЫЙ СЛАЙД КП)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    add_header(s5, "3. Единая сводная таблица расчетов по всем тарифам (Разработка + Запуск)")

    # 13 rows, 4 cols table
    t_shape = s5.shapes.add_table(13, 4, Inches(0.8), Inches(1.3), Inches(11.73), Inches(4.9))
    tbl = t_shape.table
    tbl.columns[0].width = Inches(4.53)
    tbl.columns[1].width = Inches(2.2)
    tbl.columns[2].width = Inches(2.2)
    tbl.columns[3].width = Inches(2.8)

    rows_data = [
        ("Статьи сметы и компоненты проекта", "Тариф «СТАНДАРТ»\n(Базовый запуск)", "Тариф «БИЗНЕС»\n(Оптимальный)", "⭐ Тариф «ПРЕМИУМ»\n(ХИТ / ВЫБОР СЕТИ)"),
        ("1. РАЗРАБОТКА САЙТА И ПО ПОД КЛЮЧ:", "4 900 000 ₸", "6 200 000 ₸", "7 800 000 ₸"),
        ("• Интернет-магазин (Next.js 15, SSR, 16 филиалов, RU/KZ)", "2 400 000 ₸", "2 600 000 ₸", "2 800 000 ₸"),
        ("• Мобильное приложение iOS & Android (Face ID, СМС)", "1 800 000 ₸", "2 400 000 ₸", "3 000 000 ₸"),
        ("• CRM (16 складов) + Kaspi Pay + ИИ-пакет", "700 000 ₸", "1 200 000 ₸", "2 000 000 ₸"),
        ("2. СТОИМОСТЬ ЗАПУСКА ПРОЕКТА ПОД КЛЮЧ:", "950 000 ₸", "1 110 000 ₸", "1 680 000 ₸"),
        ("• Сервер VPS (PS.kz), домен .KZ, SSL, PostgreSQL", "285 000 ₸", "285 000 ₸", "285 000 ₸"),
        ("• Лицензии Apple & Google, Kaspi Pay, ОФД, СМС", "255 000 ₸", "295 000 ₸", "325 000 ₸"),
        ("• Оборудование 16 филиалов (сканеры + принтер сети)", "0 ₸ (смартфоны)", "0 ₸ (эк. 240k)", "0 ₸ (Эк. −272 000 ₸)"),
        ("• Настройка ИИ + Включенное тех. сопровождение", "410 000 ₸ (1 мес)", "530 000 ₸ (3 мес)", "1 070 000 ₸ (6 мес VIP)"),
        ("💰 ИТОГО К ОПЛАТЕ (САЙТ + ЗАПУСК ПОД КЛЮЧ):", "5 850 000 ₸", "7 310 000 ₸", "9 480 000 ₸"),
        ("💵 Эквивалент в долларах США ($):", "~ $11 700", "~ $14 620", "~ $18 960"),
        ("⏱️ Срок окупаемости (прибыль +6.35 млн ₸/мес):", "27–28 дней", "34–35 дней", "44–45 дней (до 1.5 мес)"),
    ]

    for ri, rdata in enumerate(rows_data):
        for ci, val in enumerate(rdata):
            cell = tbl.cell(ri, ci)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            p.font.name = "Arial"

            if ri == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = C_DARK if ci < 3 else C_PURPLE
                p.font.size = Pt(10)
                p.font.bold = True
                p.font.color.rgb = C_WHITE
                p.alignment = PP_ALIGN.CENTER if ci > 0 else PP_ALIGN.LEFT
            elif ri in (1, 5):
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(0xFE, 0xF3, 0xC7)
                p.font.size = Pt(9.5)
                p.font.bold = True
                p.font.color.rgb = C_DARK
                if ci > 0:
                    p.alignment = PP_ALIGN.RIGHT
            elif ri == 10:
                cell.fill.solid()
                cell.fill.fore_color.rgb = C_PRIMARY if ci < 3 else C_GREEN
                p.font.size = Pt(11)
                p.font.bold = True
                p.font.color.rgb = C_WHITE
                if ci > 0:
                    p.alignment = PP_ALIGN.RIGHT
            elif ri in (11, 12):
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(0xEC, 0xFD, 0xF5)
                p.font.size = Pt(9.5)
                p.font.bold = True
                p.font.color.rgb = C_GREEN
                if ci > 0:
                    p.alignment = PP_ALIGN.RIGHT
            else:
                bg = RGBColor(0xF8, 0xFA, 0xFC) if ri % 2 == 1 else RGBColor(0xFF, 0xFF, 0xFF)
                cell.fill.solid()
                cell.fill.fore_color.rgb = bg
                p.font.size = Pt(9)
                if ci > 0:
                    p.alignment = PP_ALIGN.RIGHT
                if ci == 3:
                    p.font.bold = True
                if ri == 8:
                    p.font.color.rgb = C_GREEN
                    p.font.bold = True

    # Callout Banner on direct equipment savings
    b_eq = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(6.3), Inches(11.73), Inches(0.8))
    b_eq.fill.solid()
    b_eq.fill.fore_color.rgb = RGBColor(0xEC, 0xFD, 0xF5)
    b_eq.line.color.rgb = C_GREEN
    b_eq.line.width = Pt(1.5)

    tx_eq = s5.shapes.add_textbox(Inches(0.95), Inches(6.32), Inches(11.4), Inches(0.72))
    tf_eq = tx_eq.text_frame
    tf_eq.word_wrap = True
    pe = tf_eq.paragraphs[0]
    pe.text = "🎁 ПРЯМАЯ ЭКОНОМИЯ 272 000 ₸ НА ОБОРУДОВАНИИ СЕТИ:"
    pe.font.name = "Arial"
    pe.font.size = Pt(10.5)
    pe.font.bold = True
    pe.font.color.rgb = C_GREEN

    pe2 = tf_eq.add_paragraph()
    pe2.text = "Существующие 16 сканеров на кассах и принтер этикеток сети работают с платформой «из коробки» (HID + печать). Покупка новых устройств не требуется!"
    pe2.font.name = "Arial"
    pe2.font.size = Pt(9.5)
    pe2.font.color.rgb = C_DARK

    # =========================================================================
    # SLIDE 6: Финансовый возврат (+6.35 млн ₸/мес) и Окупаемость (как в КП)
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    add_header(s6, "4. Финансовый эффект и окупаемость инвестиций (ROI)")

    # Left Card: Sources of Income
    c_left = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.4), Inches(6.3), Inches(5.6))
    c_left.fill.solid()
    c_left.fill.fore_color.rgb = C_CARD_BG
    c_left.line.color.rgb = C_CARD_BORDER

    tx_l = s6.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(5.9), Inches(5.3))
    tf_l = tx_l.text_frame
    tf_l.word_wrap = True

    pl_h = tf_l.paragraphs[0]
    pl_h.text = "ИСТОЧНИКИ ДОПОЛНИТЕЛЬНОЙ ПРИБЫЛИ В МЕСЯЦ"
    pl_h.font.name = "Arial"
    pl_h.font.size = Pt(12)
    pl_h.font.bold = True
    pl_h.font.color.rgb = C_DARK

    fin_rows = [
        ("1. Онлайн-заказы курьером по Алматы", "20 заказов/день × 7 500 ₸ × 55% маржа", "+ 2 475 000 ₸"),
        ("2. Самовывоз из 16 филиалов (Click & Collect)", "15 сохраненных чеков в день", "+ 1 856 000 ₸"),
        ("3. Ликвидация дефицита (Out-of-Stock)", "Своевременное пополнение витрин", "+ 1 650 000 ₸"),
        ("4. Экономия на комиссиях Kaspi Магазина", "Перевод клиентов в свое ПО (1.5%)", "+ 450 000 ₸"),
        ("5. Минус ежемесячный OPEX платформы", "Серверы в Алматы, СМС, токены ИИ", "- 75 000 ₸"),
    ]

    for title, metric, sum_val in fin_rows:
        p_t = tf_l.add_paragraph()
        p_t.text = f"{title}"
        p_t.font.name = "Arial"
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = C_TEXT_MAIN
        p_t.space_before = Pt(8)

        p_m = tf_l.add_paragraph()
        p_m.text = f"{metric}  ➔  {sum_val}"
        p_m.font.name = "Arial"
        p_m.font.size = Pt(10)
        p_m.font.color.rgb = C_GREEN if "+" in sum_val else C_RED
        p_m.font.bold = True

    # Total Banner inside left card
    p_tot = tf_l.add_paragraph()
    p_tot.text = "ИТОГО ЧИСТАЯ ПРИБЫЛЬ:  + 6 356 000 ₸ / месяц"
    p_tot.font.name = "Arial"
    p_tot.font.size = Pt(12.5)
    p_tot.font.bold = True
    p_tot.font.color.rgb = C_GREEN
    p_tot.space_before = Pt(12)

    p_year = tf_l.add_paragraph()
    p_year.text = "Прирост чистой прибыли сети за 1-й год: + 76 272 000 ₸"
    p_year.font.name = "Arial"
    p_year.font.size = Pt(10)
    p_year.font.color.rgb = C_TEXT_MUTED

    # Right Card: Payback Periods
    c_right = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.4), Inches(1.4), Inches(5.13), Inches(5.6))
    c_right.fill.solid()
    c_right.fill.fore_color.rgb = C_CARD_BG
    c_right.line.color.rgb = C_GOLD
    c_right.line.width = Pt(1.5)

    tx_r = s6.shapes.add_textbox(Inches(7.6), Inches(1.5), Inches(4.7), Inches(5.3))
    tf_r = tx_r.text_frame
    tf_r.word_wrap = True

    pr_h = tf_r.paragraphs[0]
    pr_h.text = "СРОКИ ВОЗВРАТА ИНВЕСТИЦИЙ ПО ТАРИФАМ:"
    pr_h.font.name = "Arial"
    pr_h.font.size = Pt(12)
    pr_h.font.bold = True
    pr_h.font.color.rgb = C_DARK

    paybacks = [
        ("Тариф «СТАНДАРТ» (5 850 000 ₸)", "27–28 дней", "5.85 млн ₸ / 6.35 млн ₸ = 0.92 мес\nРентабельность ROI > 1300%", C_PRIMARY),
        ("Тариф «БИЗНЕС» (7 310 000 ₸)", "34–35 дней", "7.31 млн ₸ / 6.35 млн ₸ = 1.15 мес\nРентабельность ROI > 1040%", C_GOLD),
        ("⭐ Тариф «ПРЕМИУМ» (9 480 000 ₸)", "44–45 дней (до 1.5 мес)", "9.48 млн ₸ / 6.35 млн ₸ = 1.49 мес\nРентабельность ROI > 800%", C_GREEN),
    ]

    for p_title, p_time, p_calc, p_col in paybacks:
        p_name = tf_r.add_paragraph()
        p_name.text = p_title
        p_name.font.name = "Arial"
        p_name.font.size = Pt(11)
        p_name.font.bold = True
        p_name.font.color.rgb = C_DARK
        p_name.space_before = Pt(12)

        p_days = tf_r.add_paragraph()
        p_days.text = f"⏱️ Срок окупаемости: {p_time}"
        p_days.font.name = "Arial"
        p_days.font.size = Pt(12)
        p_days.font.bold = True
        p_days.font.color.rgb = p_col

        p_desc = tf_r.add_paragraph()
        p_desc.text = p_calc
        p_desc.font.name = "Arial"
        p_desc.font.size = Pt(9.5)
        p_desc.font.color.rgb = C_TEXT_MUTED

    # =========================================================================
    # SLIDE 7: Абонентское сопровождение и Регламент доработок (Таблица 5 КП)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    add_header(s7, "5. Абонентское сопровождение и регламент доработок (MRR)")

    # 2 Retainer Packages
    mrr_packages = [
        ("БАЗОВЫЙ МОНИТОРИНГ", "150 000 ₸ / мес", [
            "Гарантия Uptime 99.9% доступности сайта и API 24/7",
            "Резервное копирование базы данных каждые 6 часов",
            "Контроль и своевременное продление домена и SSL",
            "Мониторинг платежного шлюза Kaspi Pay и ОФД Webkassa",
            "Разработка новых функций: НЕ входит (по доп. соглашению)",
        ], C_PRIMARY),

        ("ПРЕМИУМ DEVOPS & ОС АДАПТАЦИЯ", "250 000 ₸ / мес", [
            "Все услуги Базового мониторинга 24/7",
            "Обязательная адаптация приложений под новые требования iOS и Android",
            "Обновление под ежегодные требования App Store & Google Play",
            "Защита от блокировки и вылета приложений из сторов",
            "Разработка новых функций: НЕ входит (по доп. соглашению)",
        ], C_GOLD),
    ]

    for idx, (p_name, p_price, bullets, accent) in enumerate(mrr_packages):
        left = Inches(0.8 + idx * 5.98)
        top = Inches(1.4)
        width = Inches(5.75)
        height = Inches(3.7)

        card = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = accent
        card.line.width = Pt(1.5)

        tx = s7.shapes.add_textbox(left + Inches(0.2), top + Inches(0.15), width - Inches(0.4), height - Inches(0.3))
        tf = tx.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = p_name
        p1.font.name = "Arial"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = C_DARK

        p2 = tf.add_paragraph()
        p2.text = p_price
        p2.font.name = "Arial"
        p2.font.size = Pt(16)
        p2.font.bold = True
        p2.font.color.rgb = accent
        p2.space_before = Pt(3)

        for bi, bullet in enumerate(bullets):
            pb = tf.add_paragraph()
            pb.text = "• " + bullet
            pb.font.name = "Arial"
            pb.font.size = Pt(10)
            if "НЕ входит" in bullet:
                pb.font.bold = True
                pb.font.color.rgb = C_RED
            else:
                pb.font.color.rgb = C_TEXT_MAIN
            pb.space_before = Pt(4)

    # Regulation Warning Box
    reg_box = s7.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.3), Inches(11.73), Inches(1.75))
    reg_box.fill.solid()
    reg_box.fill.fore_color.rgb = RGBColor(0xFF, 0xFB, 0xEB)
    reg_box.line.color.rgb = C_GOLD
    reg_box.line.width = Pt(1.5)

    tx_reg = s7.shapes.add_textbox(Inches(1.0), Inches(5.35), Inches(11.3), Inches(1.6))
    tf_reg = tx_reg.text_frame
    tf_reg.word_wrap = True

    pr1 = tf_reg.paragraphs[0]
    pr1.text = "⚠️ ОФИЦИАЛЬНЫЙ РЕГЛАМЕНТ РАЗРАБОТКИ НОВЫХ ФУНКЦИЙ:"
    pr1.font.name = "Arial"
    pr1.font.size = Pt(11)
    pr1.font.bold = True
    pr1.font.color.rgb = C_GOLD

    pr2 = tf_reg.add_paragraph()
    pr2.text = (
        "1. Абонентская плата обеспечивает исключительно стабильность 24/7, безопасность, бэкапы каждые 6 часов и совместимость с обновлениями iOS/Android.\n"
        "2. Доработка любого нового функционала, промо-механик, новых отчетов или интеграций выполняется строго по отдельным Дополнительным соглашениям (по ТЗ).\n"
        "3. Это исключает двусмысленности в договоре, защищает команду от бесплатных переработок и гарантирует прозрачность бюджета для Заказчика."
    )
    pr2.font.name = "Arial"
    pr2.font.size = Pt(10)
    pr2.font.color.rgb = C_DARK
    pr2.space_before = Pt(4)

    # =========================================================================
    # SLIDE 8: График внедрения Тарифа «Премиум» за 14 рабочих дней (как в КП)
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    add_header(s8, "6. Поэтапный график внедрения Тарифа «Премиум» за 14 рабочих дней")

    steps_data = [
        ("ЭТАП 1: Организационный старт", "Дни 1 – 3", "Подписание договора, аванс 50%, регистрация домена .KZ, выпуск SSL, аккаунты Apple/Google, выделенные серверы PS.kz в Алматы", "Развернута серверная инфраструктура в ЦОД Алматы"),
        ("ЭТАП 2: Финансовый контур", "Дни 4 – 7", "Боевой Kaspi Pay (QR, Red 0-0-3), ОФД Webkassa, шлюз СМС-авторизации Mobizon, WhatsApp Business API", "Настроены платежи, фискализация чеков и СМС"),
        ("ЭТАП 3: ИИ и Склады сети", "Дни 8 – 11", "Запуск AI Fashion Studio, сквозные остатки 16 филиалов, бесплатное сопряжение сканеров и принтера сети (0 ₸)", "Каталог оцифрован, 16 касс подключены (эк. 272 000 ₸)"),
        ("ЭТАП 4: Релиз и обучение", "Дни 12 – 14", "Тестовый платеж 100 ₸ Kaspi QR, инструктаж кассиров 16 точек, публикация в App Store & Google Play", "Проект сдан заказчику, старт официальных продаж"),
    ]

    for idx, (stage_name, days, desc, outcome) in enumerate(steps_data):
        top = Inches(1.4 + idx * 1.35)

        card = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top, Inches(11.73), Inches(1.2))
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = C_CARD_BORDER
        card.line.width = Pt(1.0)

        # Day Pill Box
        pill = s8.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.95), top + Inches(0.2), Inches(1.8), Inches(0.8))
        pill.fill.solid()
        pill.fill.fore_color.rgb = C_DARK if idx < 3 else C_GREEN
        pill.line.fill.background()

        tx_p = s8.shapes.add_textbox(Inches(0.95), top + Inches(0.25), Inches(1.8), Inches(0.7))
        tf_p = tx_p.text_frame
        p_day = tf_p.paragraphs[0]
        p_day.text = days
        p_day.font.name = "Arial"
        p_day.font.size = Pt(13)
        p_day.font.bold = True
        p_day.font.color.rgb = C_WHITE
        p_day.alignment = PP_ALIGN.CENTER

        # Stage Content
        tx_c = s8.shapes.add_textbox(Inches(2.9), top + Inches(0.12), Inches(8.8), Inches(0.95))
        tf_c = tx_c.text_frame
        tf_c.word_wrap = True

        ps1 = tf_c.paragraphs[0]
        ps1.text = stage_name
        ps1.font.name = "Arial"
        ps1.font.size = Pt(12.5)
        ps1.font.bold = True
        ps1.font.color.rgb = C_DARK

        ps2 = tf_c.add_paragraph()
        ps2.text = desc
        ps2.font.name = "Arial"
        ps2.font.size = Pt(10)
        ps2.font.color.rgb = C_TEXT_MAIN
        ps2.space_before = Pt(2)

        ps3 = tf_c.add_paragraph()
        ps3.text = f"🎯 Результат: {outcome}"
        ps3.font.name = "Arial"
        ps3.font.size = Pt(9.5)
        ps3.font.bold = True
        ps3.font.color.rgb = C_GREEN
        ps3.space_before = Pt(2)

    # =========================================================================
    # SLIDE 9: Юридические гарантии и Финальный призыв к действию (как в КП)
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    add_header(s9, "7. Юридические гарантии и контакты проектной группы")

    # 3 Guarantees
    guars = [
        ("12 МЕСЯЦЕВ ГАРАНТИИ", "Бесплатное устранение любых скрытых дефектов или сбоев программного кода в течение года.", C_PRIMARY),
        ("100% ПРАВ ЗАКАЗЧИКУ", "Все исключительные права на исходный код, базы данных и дизайн передаются компании по договору.", C_PRIMARY),
        ("ОТСУТСТВИЕ РОЯЛТИ", "Никаких скрытых комиссий, роялти или абонентской привязки к разработчику.", C_GREEN),
    ]

    for idx, (title, desc, accent) in enumerate(guars):
        left = Inches(0.8 + idx * 3.98)
        top = Inches(1.4)
        width = Inches(3.78)
        height = Inches(2.2)

        card = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = C_CARD_BG
        card.line.color.rgb = accent
        card.line.width = Pt(1.5)

        tx = s9.shapes.add_textbox(left + Inches(0.2), top + Inches(0.18), width - Inches(0.4), height - Inches(0.35))
        tf = tx.text_frame
        tf.word_wrap = True

        p1 = tf.paragraphs[0]
        p1.text = title
        p1.font.name = "Arial"
        p1.font.size = Pt(12)
        p1.font.bold = True
        p1.font.color.rgb = accent

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.name = "Arial"
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = C_TEXT_MAIN
        p2.space_before = Pt(8)

    # Big Final CTA Card
    cta = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(3.9), Inches(11.73), Inches(3.1))
    cta.fill.solid()
    cta.fill.fore_color.rgb = C_DARK
    cta.line.color.rgb = C_GOLD
    cta.line.width = Pt(2.0)

    tx_cta = s9.shapes.add_textbox(Inches(1.1), Inches(4.05), Inches(11.1), Inches(2.8))
    tf_cta = tx_cta.text_frame
    tf_cta.word_wrap = True

    pc1 = tf_cta.paragraphs[0]
    pc1.text = "ГОТОВЫ ПРОДЕМОНСТРИРОВАТЬ РАБОТАЮЩЕЕ ПРИЛОЖЕНИЕ И САЙТ ПРЯМО СЕЙЧАС"
    pc1.font.name = "Arial"
    pc1.font.size = Pt(14)
    pc1.font.bold = True
    pc1.font.color.rgb = C_GOLD

    pc2 = tf_cta.add_paragraph()
    pc2.text = (
        "Сеть «Индийский Трикотаж» ежемесячно инвестирует миллионы тенге в аренду торговых площадей.\n"
        "Внедрение собственной омниканальной экосистемы окупается менее чем за 45 дней, экономит 272 000 ₸ на оборудовании сети, навсегда закрепляет клиентскую базу за брендом без 15% комиссий сторонних маркетплейсов и приносит более +6.3 млн тенге дополнительной чистой прибыли каждый месяц."
    )
    pc2.font.name = "Arial"
    pc2.font.size = Pt(11)
    pc2.font.color.rgb = C_WHITE
    pc2.space_before = Pt(8)

    pc3 = tf_cta.add_paragraph()
    pc3.text = "📞 Телефон / WhatsApp: +7 (701) 992-84-12  •  г. Алматы, Республика Казахстан"
    pc3.font.name = "Arial"
    pc3.font.size = Pt(12)
    pc3.font.bold = True
    pc3.font.color.rgb = RGBColor(0xFE, 0xF0, 0x8A)
    pc3.space_before = Pt(12)

    # Save to all target output paths
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
