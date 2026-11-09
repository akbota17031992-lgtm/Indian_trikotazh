import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_docx(output_paths):
    doc = Document()

    # Set page margins (0.8 in)
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)

    # Base Colors
    HEX_DARK = "451A03"
    HEX_PRIMARY = "78350F"
    HEX_GOLD = "D97706"
    HEX_LIGHT_GOLD = "FEF3C7"
    HEX_BG_ALT = "F8FAFC"
    HEX_GREEN = "059669"
    HEX_LIGHT_GREEN = "ECFDF5"
    HEX_TEXT = "0F172A"

    COLOR_PRIMARY = RGBColor(0x78, 0x35, 0x0F)
    COLOR_DARK = RGBColor(0x45, 0x1A, 0x03)
    COLOR_GOLD = RGBColor(0xD9, 0x77, 0x06)
    COLOR_MUTED = RGBColor(0x64, 0x74, 0x8B)
    COLOR_GREEN = RGBColor(0x05, 0x96, 0x69)

    # -------------------------------------------------------------------------
    # DOCUMENT HEADER / BANNER
    # -------------------------------------------------------------------------
    p_top = doc.add_paragraph()
    r_top = p_top.add_run("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ")
    r_top.font.name = "Arial"
    r_top.font.size = Pt(11)
    r_top.font.bold = True
    r_top.font.color.rgb = COLOR_GOLD

    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Поставка, запуск и сопровождение омниканальной цифровой экосистемы розничной сети «Индийский Трикотаж» (г. Алматы)")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_DARK
    p_title.paragraph_format.space_after = Pt(6)

    # Metadata callout box
    t_meta = doc.add_table(rows=4, cols=2)
    t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Заказчик:", "Руководству и учредителям торговой сети «Индийский Трикотаж»"),
        ("Масштаб проекта:", "16 розничных филиалов в торговых центрах Алматы + Интернет-магазин + Мобильные приложения"),
        ("Статус готовности:", "Платформа разработана, отлажена на боевых данных и готова к промышленному запуску"),
        ("Дата предложения:", "08 ноября 2026 г. • г. Алматы, Республика Казахстан"),
    ]
    for i, (k, v) in enumerate(meta_data):
        row = t_meta.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = COLOR_PRIMARY

        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------------------
    # 1. ВВЕДЕНИЕ И БИЗНЕС-ЦЕЛЬ
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("1. Введение и бизнес-цель проекта")
    r_h1.font.color.rgb = COLOR_PRIMARY
    r_h1.font.bold = True

    p_intro = doc.add_paragraph(
        "Торговая сеть «Индийский Трикотаж» занимает устойчивую позицию на рынке качественного трикотажа из Индии в Алматы с 16 филиалами в торговых центрах и розничных точках города.\n\n"
        "Цель настоящего проекта — объединить 16 розничных магазинов, складские запасы и онлайн-продажи в единую цифровую экосистему, которая:\n"
        "1. Исключает дефицит (Out-of-Stock) и потерю покупателей: сквозной онлайн-мониторинг складов и остатков 16 филиалов. Клиент видит точное наличие своего размера и оформляет самовывоз (Click & Collect) за 2 часа.\n"
        "2. Обеспечивает своевременное пополнение филиалов: автоматический контроль неснижаемого остатка. Если в конкретном магазине заканчиваются популярные размеры или расцветки, система заранее формирует лист перемещения со склада, гарантируя непрерывное наличие товара на витринах.\n"
        "3. Обеспечивает прямой приём платежей Kaspi: приём оплаты через Kaspi QR, Kaspi Gold, Kaspi Red (0-0-3) и Рассрочку без 10–15% комиссий сторонних маркетплейсов.\n"
        "4. Автоматизирует оцифровку товаров через ИИ: распознавание новых партий трикотажа по фото со смартфона, мгновенная генерация характеристик и описаний на казахском и русском языках, а в тарифе «Премиум» — генерация фото одежды на живых виртуальных моделях без дорогостоящих фотосессий.\n"
        "5. Закрепляет мобильное присутствие бренда: нативное приложение с Kaspi-подобной авторизацией по Face ID и СМС без паролей на экранах смартфонов алматинцев."
    )
    p_intro.paragraph_format.line_spacing = 1.15
    p_intro.paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------------------
    # 2. АРХИТЕКТУРА И СОСТАВ СИСТЕМЫ
    # -------------------------------------------------------------------------
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("2. Архитектура и состав разработанного программного комплекса")
    r_h2.font.color.rgb = COLOR_PRIMARY
    r_h2.font.bold = True

    arch_items = [
        ("Интернет-магазин (Web):", "Next.js 15, React 19, Server-Side Rendering для мгновенного SEO в Google/Yandex, многоуровневая фильтрация по составу и 16 филиалам, интерактивная корзина с выбором товаров чекбоксами, мультиязычность (Русский / Қазақша)."),
        ("Мобильное приложение (iOS & Android):", "Нативный кроссплатформенный стек Expo React Native, авторизация Kaspi по СМС без паролей, нативный Face ID / Touch ID / код разблокировки телефона, гостевой режим для покупок без регистрации, программа лояльности (кешбэк 5%)."),
        ("Панель управления & CRM (Админка):", "Сквозной учет остатков по 16 филиалам в реальном времени, автоматический контроль дефицита и листы перемещений, модуль печати ценников со штрихкодами на существующие термопринтеры сети, управление заказами самовывоза и доставки, ролевая модель (Директор, Менеджер, Кассир)."),
        ("Интеграции и Сервисы:", "Платежный шлюз Kaspi Pay (Kaspi QR, Kaspi Gold, Kaspi Red 0-0-3), фискализация чеков ОФД Webkassa, ИИ-модули (AI Product Ingest, WhatsApp AI-продавец 24/7, AI Fashion Studio)."),
    ]
    for title, desc in arch_items:
        p_a = doc.add_paragraph()
        r_at = p_a.add_run(f"• {title} ")
        r_at.font.bold = True
        r_at.font.color.rgb = COLOR_DARK
        p_a.add_run(desc)
        p_a.paragraph_format.space_after = Pt(4)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------------------
    # 3. БЛОК 1: СТОИМОСТЬ РАЗРАБОТКИ САЙТА И ПО
    # -------------------------------------------------------------------------
    h3 = doc.add_heading(level=1)
    r_h3 = h3.add_run("3. БЛОК 1: Стоимость разработки программного комплекса (Сайт и ПО под ключ)")
    r_h3.font.color.rgb = COLOR_PRIMARY
    r_h3.font.bold = True

    p_dev_intro = doc.add_paragraph(
        "В стоимость разработки входит программное ядро, все пользовательские и административные интерфейсы, мобильные приложения, документация и передача полных исключительных прав на исходный код заказчику:"
    )
    p_dev_intro.paragraph_format.space_after = Pt(6)

    t_dev = doc.add_table(rows=7, cols=4)
    t_dev.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_dev_headers = ["№", "Компонент системы", "Рыночная цена в РК", "Стоимость в нашем КП (Тариф «Премиум» / Хит)"]
    for i, h in enumerate(t_dev_headers):
        cell = t_dev.cell(0, i)
        cell.text = h
        set_cell_background(cell, HEX_PRIMARY)
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)

    dev_data = [
        ("1.1", "Интернет-магазин (Next.js 15, SSR, SEO, фильтры 16 филиалов, чекаут)", "3 500 000 ₸", "2 800 000 ₸"),
        ("1.2", "Мобильное приложение iOS & Android (Kaspi-авторизация, Face ID, Push)", "4 500 000 ₸", "3 000 000 ₸"),
        ("1.3", "Панель управления (CRM, сквозной учет 16 складов, листы перемещений)", "2 500 000 ₸", "1 000 000 ₸"),
        ("1.4", "Интеграция Kaspi Pay (QR, Red 0-0-3) и фискализация Webkassa", "1 000 000 ₸", "450 000 ₸"),
        ("1.5", "Интеграция ИИ-модулей (AI Ingest, Fashion Studio, семантический поиск)", "2 500 000 ₸", "550 000 ₸"),
        ("ИТОГО", "СТОИМОСТЬ РАЗРАБОТКИ ПЛАТФОРМЫ ПОД КЛЮЧ (ПРЕМИУМ):", "14 000 000 ₸", "7 800 000 ₸"),
    ]
    for row_idx, r_data in enumerate(dev_data, start=1):
        for col_idx, text in enumerate(r_data):
            cell = t_dev.cell(row_idx, col_idx)
            cell.text = text
            bg = HEX_LIGHT_GOLD if row_idx == 6 else (HEX_BG_ALT if row_idx % 2 == 1 else "FFFFFF")
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9)
            if row_idx == 6:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = COLOR_DARK
            elif col_idx == 3:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = COLOR_GREEN

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------------------
    # 4. БЛОК 2: СТОИМОСТЬ ЗАПУСКА ПРОЕКТА
    # -------------------------------------------------------------------------
    h4 = doc.add_heading(level=1)
    r_h4 = h4.add_run("4. БЛОК 2: Стоимость запуска проекта (Входные расходы заказчика под ключ)")
    r_h4.font.color.rgb = COLOR_PRIMARY
    r_h4.font.bold = True

    p_start_intro = doc.add_paragraph(
        "Стоимость запуска включает обязательные расходы на инфраструктуру, лицензии, сертификаты, шлюзы и техническое сопровождение на 1-й год. Благодаря наличию у сети собственных 2D-сканеров и принтеров этикеток, статья расходов на оборудование равна 0 ₸:"
    )
    p_start_intro.paragraph_format.space_after = Pt(6)

    t_start = doc.add_table(rows=14, cols=4)
    t_start.alignment = WD_TABLE_ALIGNMENT.CENTER
    start_headers = ["Статья расходов", "Назначение статьи", "Срок / Единицы", "Сумма (₸)"]
    for i, h in enumerate(start_headers):
        cell = t_start.cell(0, i)
        cell.text = h
        set_cell_background(cell, HEX_PRIMARY)
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)

    start_data = [
        ("Сервер VPS в Алматы (PS.kz)", "ЦОД в Казахстане (требование Закона РК о защите ПДн)", "12 месяцев", "140 000 ₸"),
        ("Брендовый домен .kz + SSL", "Регистрация indiatrikotaj.kz + Wildcard SSL сертификат", "12 месяцев", "25 000 ₸"),
        ("Облачная СУБД + S3 хранилище", "Отказоустойчивая PostgreSQL + облачный диск медиафайлов", "12 месяцев", "120 000 ₸"),
        ("Apple Developer Program", "Официальная публикация в App Store на имя компании ($99)", "1 год", "49 500 ₸"),
        ("Google Play Console", "Публикация приложения в Google Play ($25 разово)", "Бессрочно", "12 500 ₸"),
        ("Боевое подключение Kaspi Pay", "Регистрация мерчанта, боевые API-ключи, комплаенс", "Разово", "90 000 ₸"),
        ("Фискализация ОФД Webkassa", "Интеграция фискальных чеков с налоговыми органами РК", "12 месяцев", "55 000 ₸"),
        ("Пакет СМС (15 000 шт.)", "Беспарольная авторизация клиентов через Mobizon", "Стартовый пакет", "118 000 ₸"),
        ("Оборудование филиалов и склада", "16 сканеров + принтер: парк Заказчика (сопряжение 0 ₸)", "В наличии у сети", "0 ₸ (Экономия: -272 000 ₸)"),
        ("Настройка WhatsApp AI 24/7 (Setup)", "Обучение промптов (RU/KZ), загрузка номенклатуры, API", "Разово (Setup)", "180 000 ₸"),
        ("Настройка AI Fashion Studio (Setup)", "Развертывание пайплайна генерации одежды на виртуальных моделях", "Разово (Setup)", "350 000 ₸"),
        ("VIP-техподдержка и SLA (6 мес.)", "Мониторинг 24/7, бэкапы каждые 6 часов, приоритетный саппорт", "6 месяцев (гарантия)", "540 000 ₸"),
        ("ИТОГО СТОИМОСТЬ ЗАПУСКА:", "Все ресурсы, лицензии, сопряжение и ввод в эксплуатацию", "Тариф «Премиум»", "1 680 000 ₸"),
    ]
    for row_idx, r_data in enumerate(start_data, start=1):
        for col_idx, text in enumerate(r_data):
            cell = t_start.cell(row_idx, col_idx)
            cell.text = text
            bg = HEX_LIGHT_GOLD if row_idx == 13 else (HEX_LIGHT_GREEN if row_idx == 9 else (HEX_BG_ALT if row_idx % 2 == 1 else "FFFFFF"))
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9)
            if row_idx == 13:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = COLOR_DARK
            elif row_idx == 9:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = COLOR_GREEN
            elif col_idx == 3:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = COLOR_PRIMARY

    # Explanatory Notes Callout
    p_eq_note = doc.add_paragraph()
    r_eq_h = p_eq_note.add_run("🎁 ПРЯМАЯ ЭКОНОМИЯ НА ОБОРУДОВАНИИ (−272 000 ₸):\n")
    r_eq_h.font.bold = True
    r_eq_h.font.color.rgb = COLOR_GREEN
    p_eq_note.add_run(
        "• В розничной сети «Индийский Трикотаж» уже установлены 2D-сканеры на всех 16 кассах, а на центральном складе имеется термопринтер для этикеток. Наша платформа поддерживает работу с существующим парком техники «из коробки» (HID-интерфейс сканеров + прямая печать этикеток из веб-панели). Покупка новых устройств не требуется — бюджет клиента экономит 272 000 ₸ на старте!\n"
        "• WhatsApp AI-продавец 24/7 (180 000 ₸ разово): Это разовая стоимость работ разработчика по интеграции и обучению (Setup fee) — написание системных промптов (RU/KZ), алгоритмы подбора размеров по росту/весу, интеграция с остатками 16 филиалов. Ежемесячные затраты на трафик и токены нейросети (~25 000 – 40 000 ₸/мес) оплачиваются Заказчиком напрямую провайдерам по фактическому объему переписки."
    )
    p_eq_note.paragraph_format.line_spacing = 1.15
    p_eq_note.paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------------------
    # 5. БЛОК 3: ИИ-ИНСТРУМЕНТЫ
    # -------------------------------------------------------------------------
    h5 = doc.add_heading(level=1)
    r_h5 = h5.add_run("5. БЛОК 3: ИИ-инструменты для платформы (3 Варианта на выбор)")
    r_h5.font.color.rgb = COLOR_PRIMARY
    r_h5.font.bold = True

    ai_desc = [
        ("Вариант А: «AI-Товаровед Lite» (Эконом)", "Распознавание одежды по фото со смартфона на складе, определение состава ткани, мгновенная генерация карточки товара на русском и казахском языках за 3 секунды. Заменяет штатного копирайтера (экономия ~150 000 ₸/мес). Настройка: 80 000 ₸. API: ~15 000 ₸/мес."),
        ("Вариант Б: «Smart Business: AI-Товаровед + WhatsApp AI-Консультант 24/7»", "Все из Lite + семантический поиск + виртуальный продавец в WhatsApp 24/7. Бот консультирует клиентов по подбору размера по росту/весу, проверяет остатки в ближайшем из 16 филиалов и присылает готовую ссылку на корзину с Kaspi Red 0-0-3. Заменяет 2 ночных операторов (экономия ~450 000 ₸/мес). Настройка: 180 000 ₸. API: ~35 000 ₸/мес."),
        ("⭐ Вариант В: «Fashion Studio & Virtual Fitting» (Премиум / Флагман)", "Все из Smart Business + генерация фото одежды на живых виртуальных моделях (парни и девушки) в алматинских локациях и интерьерах. Фотография трикотажа на вешалке превращается в студийный лук. Полная замена найма моделей, фотографов и аренды студий (экономия до ~900 000 ₸/мес). Настройка: 350 000 ₸. API: ~65 000 ₸/мес."),
    ]
    for atitle, adesc in ai_desc:
        p_ai = doc.add_paragraph()
        r_ait = p_ai.add_run(f"• {atitle}\n")
        r_ait.font.bold = True
        r_ait.font.color.rgb = COLOR_PRIMARY
        p_ai.add_run(adesc)
        p_ai.paragraph_format.space_after = Pt(6)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------------------
    # 6. БЛОК 4: ИТОГОВАЯ ОБЩАЯ СУММА ПРОЕКТА
    # -------------------------------------------------------------------------
    h6 = doc.add_heading(level=1)
    r_h6 = h6.add_run("6. БЛОК 4: Итоговая стоимость проекта (Стоимость сайта + Стоимость запуска)")
    r_h6.font.color.rgb = COLOR_PRIMARY
    r_h6.font.bold = True

    p_tot_form = doc.add_paragraph()
    r_tf = p_tot_form.add_run("ОБЩАЯ СУММА К ОПЛАТЕ = Стоимость сайта (разработка) + Стоимость запуска проекта под ключ")
    r_tf.font.bold = True
    r_tf.font.color.rgb = COLOR_DARK
    p_tot_form.paragraph_format.space_after = Pt(6)

    t_tariffs = doc.add_table(rows=5, cols=4)
    t_tariffs.alignment = WD_TABLE_ALIGNMENT.CENTER
    tariff_headers = ["Тарифный пакет", "Стоимость сайта (ПО)", "Стоимость запуска", "ИТОГО ОБЩАЯ СУММА"]
    for i, h in enumerate(tariff_headers):
        cell = t_tariffs.cell(0, i)
        cell.text = h
        set_cell_background(cell, HEX_PRIMARY)
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)

    tariff_rows = [
        ("Тариф «СТАНДАРТ» (Базовый запуск: Web + Приложение + 16 филиалов + AI Lite)", "4 900 000 ₸", "950 000 ₸", "5 850 000 ₸ (~$11 700)"),
        ("Тариф «БИЗНЕС» (+ WhatsApp AI 24/7 + свои сканеры 0 ₸ + 3 мес. саппорта)", "6 200 000 ₸", "1 110 000 ₸", "7 310 000 ₸ (~$14 620)"),
        ("⭐ Тариф «ПРЕМИУМ / ENTERPRISE» (ХИТ: + AI Fashion Studio + свои сканеры/принтер 0 ₸ + 6 мес. VIP)", "7 800 000 ₸", "1 680 000 ₸", "9 480 000 ₸ (~$18 960)"),
        ("РЕКОМЕНДАЦИЯ:", "Оптимальный выбор для сети из 16 магазинов:", "ТАРИФ «ПРЕМИУМ»", "9 480 000 ₸ ПОД КЛЮЧ"),
    ]
    for row_idx, r_data in enumerate(tariff_rows, start=1):
        for col_idx, text in enumerate(r_data):
            cell = t_tariffs.cell(row_idx, col_idx)
            cell.text = text
            bg = HEX_LIGHT_GOLD if row_idx in (3, 4) else (HEX_BG_ALT if row_idx % 2 == 1 else "FFFFFF")
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9.5)
            if row_idx == 3 or col_idx == 3:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = COLOR_GREEN if col_idx == 3 else COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # -------------------------------------------------------------------------
    # 7. АБОНЕНТСКОЕ СОПРОВОЖДЕНИЕ
    # -------------------------------------------------------------------------
    h7 = doc.add_heading(level=1)
    r_h7 = h7.add_run("7. Абонентское сопровождение и регламент доработок (MRR)")
    r_h7.font.color.rgb = COLOR_PRIMARY
    r_h7.font.bold = True

    p_mrr = doc.add_paragraph(
        "После завершения гарантийного периода (в тарифе «Премиум» включено 6 месяцев VIP-саппорта) заказчик переходит на сервисный контракт по поддержанию жизнедеятельности и безопасности платформы:\n\n"
        "1. Тариф «Базовый мониторинг и стабильность» — 150 000 ₸ / месяц:\n"
        "   • Мониторинг работоспособности серверов и СУБД 24/7 (SLA 99.9%).\n"
        "   • Автоматическое резервное копирование каждые 6 часов на внешнее S3-хранилище.\n"
        "   • Контроль продления домена .kz, SSL-сертификатов, ключей Apple Developer и Google Play.\n"
        "   • Мониторинг боевых интеграций Kaspi Pay и фискализации ОФД Webkassa.\n"
        "   • Устранение любых сбоев с гарантированным временем реакции до 2 часов.\n\n"
        "2. Тариф «Премиум DevOps и безопасность» — 250 000 ₸ / месяц:\n"
        "   • Все услуги базового мониторинга.\n"
        "   • Обязательная адаптация мобильных приложений под новые требования операционных систем iOS (Apple) и Android (Google) при выходе ежегодных обновлений ОС (гарантия того, что приложения не заблокируют и не удалят из сторов).\n"
        "   • Выделенный приоритет технической поддержки (реакция до 30 минут).\n"
        "   • Мониторинг стабильности AI-пайплайна и вебхуков WhatsApp.\n\n"
        "⚠️ ВАЖНЕЙШИЙ РЕГЛАМЕНТ РАЗРАБОТКИ НОВЫХ ФУНКЦИЙ:\n"
        "Абонентская плата направлена исключительно на отказоустойчивость, безопасность и системную совместимость платформы. Любые доработки функционала, добавление новых модулей, маркетинговых механик, отчетов или изменений дизайна оцениваются и реализуются исключительно на основании отдельных Дополнительных соглашений (по ТЗ или за каждую фичу). Это защищает обе стороны от споров и размывания рамок проекта."
    )
    p_mrr.paragraph_format.line_spacing = 1.15
    p_mrr.paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # 8. ЭКОНОМИЧЕСКИЙ ЭФФЕКТ И ОКУПАЕМОСТЬ
    # -------------------------------------------------------------------------
    h8 = doc.add_heading(level=1)
    r_h8 = h8.add_run("8. Финансовый эффект и сроки окупаемости инвестиций (ROI)")
    r_h8.font.color.rgb = COLOR_PRIMARY
    r_h8.font.bold = True

    p_roi_desc = doc.add_paragraph(
        "Сеть «Индийский Трикотаж» уже обладает ключевым активом — трафиком 16 магазинов и тысячами покупателей. Платформа просто конвертирует этот трафик в прямой доход:\n"
        "• Онлайн-заказы с доставкой курьером по Алматы (20 заказов/день × чек 7 500 ₸ × маржа 55%): + 2 475 000 ₸ / мес.\n"
        "• Самовывоз из 16 филиалов Click & Collect (15 сохраненных покупок/день): + 1 856 000 ₸ / мес.\n"
        "• Ликвидация дефицита (Out-of-Stock) за счет сквозного учета остатков: своевременное пополнение витрин (~12 сохраненных покупок/день): + 1 650 000 ₸ / мес.\n"
        "• Экономия на комиссиях маркетплейса Kaspi.kz (перевод покупателей в свое приложение): + 450 000 ₸ / мес.\n"
        "• Минус ежемесячный OPEX (серверы, СМС, ИИ-токены): - 75 000 ₸ / мес.\n"
        "ИТОГО ЧИСТАЯ ДОПОЛНИТЕЛЬНАЯ ПРИБЫЛЬ СЕТИ: + 6 356 000 ₸ в месяц.\n\n"
        "Сроки окупаемости по ВСЕМ тарифам (с учетом экономии на оборудовании):\n"
        "1. Тариф «СТАНДАРТ» (5 850 000 ₸): 5 850 000 ₸ / 6 356 000 ₸ = 0.92 месяца (ВСЕГО 27–28 ДНЕЙ!).\n"
        "2. Тариф «БИЗНЕС» (7 310 000 ₸): 7 310 000 ₸ / 6 356 000 ₸ = 1.15 месяца (ВСЕГО 34–35 ДНЕЙ!).\n"
        "3. ⭐ Тариф «ПРЕМИУМ / ENTERPRISE» (9 480 000 ₸): 9 480 000 ₸ / 6 356 000 ₸ = 1.49 месяца (ВСЕГО 44–45 ДНЕЙ!).\n\n"
        "Все варианты окупаются быстрее 1.5 месяцев, а годовая дополнительная прибыль сети превышает 75 000 000 ₸ при ROI > 750%."
    )
    p_roi_desc.paragraph_format.line_spacing = 1.15
    p_roi_desc.paragraph_format.space_after = Pt(10)

    # -------------------------------------------------------------------------
    # 9. ГРАФИК ВНЕДРЕНИЯ (14 РАБОЧИХ ДНЕЙ)
    # -------------------------------------------------------------------------
    h9 = doc.add_heading(level=1)
    r_h9 = h9.add_run("9. Поэтапный график внедрения Тарифа «Премиум» (14 рабочих дней)")
    r_h9.font.color.rgb = COLOR_PRIMARY
    r_h9.font.bold = True

    p_steps = doc.add_paragraph(
        "Платформа полностью разработана и отлажена на реальных данных. Ввод в промышленную эксплуатацию занимает 14 рабочих дней:\n\n"
        "• Этап 1 (Дни 1–3): Организационный запуск и инфраструктура\n"
        "  Подписание договора, внесение аванса 50%, регистрация официального домена indiatrikotaj.kz, выпуск корпоративного Wildcard SSL сертификата, оформление корпоративных учетных записей Apple Developer Program ($99) и Google Play ($25), развертывание выделенных серверов PS.kz в ЦОД Алматы и СУБД PostgreSQL.\n\n"
        "• Этап 2 (Дни 4–7): Финансовый контур, касса и мессенджеры\n"
        "  Подключение боевого эквайринга Kaspi Pay (Kaspi QR, Kaspi Gold, Kaspi Red 0-0-3, Рассрочка), интеграция фискализации онлайн-кассы Webkassa, подключение казахстанского СМС-шлюза Mobizon, подключение WhatsApp Business API для AI-продавца.\n\n"
        "• Этап 3 (Дни 8–11): Загрузка каталога, ИИ Премиум и сопряжение оборудования сети\n"
        "  Развертывание AI Fashion Studio: генерация лукбуков на виртуальных фотомоделях, загрузка номенклатуры и сквозных остатков 16 филиалов, обучение и запуск умного WhatsApp AI-консультанта 24/7 с матрицей подбора размеров, бесплатное сопряжение 16 существующих сканеров филиалов и калибровка шаблонов ценников со штрихкодами под имеющиеся термопринтеры склада.\n\n"
        "• Этап 4 (Дни 12–14): Тестирование, обучение кассиров и Официальный Релиз\n"
        "  Проведение контрольных платежей Kaspi QR на 100 ₸ с фискализацией в ОФД, инструктаж старших кассиров 16 филиалов по выдаче заказов самовывоза, отправка на финальную модерацию и релиз приложений в App Store и Google Play, старт рекламной кампании в Instagram."
    )
    p_steps.paragraph_format.line_spacing = 1.15
    p_steps.paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------------------
    # 10. ПОРЯДОК РАСЧЕТОВ И ЮРИДИЧЕСКИЕ ГАРАНТИИ
    # -------------------------------------------------------------------------
    h10 = doc.add_heading(level=1)
    r_h10 = h10.add_run("10. Порядок расчетов и юридические гарантии")
    r_h10.font.color.rgb = COLOR_PRIMARY
    r_h10.font.bold = True

    p_pay_intro = doc.add_paragraph(
        "Оплата производится поэтапно в строгой привязке к видимым результатам работы. Для максимальной прозрачности суммы платежей зафиксированы в договоре:\n"
    )
    p_pay_intro.paragraph_format.space_after = Pt(4)

    t_milestones = doc.add_table(rows=4, cols=4)
    t_milestones.alignment = WD_TABLE_ALIGNMENT.CENTER
    ms_headers = ["Этап оплаты", "Условие и результат этапа", "% от сметы", "Сумма в Тарифе «Премиум»"]
    for i, h in enumerate(ms_headers):
        cell = t_milestones.cell(0, i)
        cell.text = h
        set_cell_background(cell, HEX_PRIMARY)
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)

    ms_data = [
        ("1 этап (Аванс)", "Подписание договора, бронирование серверов, домена, SSL и аккаунтов Apple/Google", "50%", "4 740 000 ₸"),
        ("2 этап (Промежуточный)", "Демонстрация рабочего сайта на боевом домене с подключенным Kaspi Pay и каталогом 16 филиалов", "30%", "2 844 000 ₸"),
        ("3 этап (Финальный)", "Успешная публикация приложений в App Store и Google Play, сдача полного проекта заказчику", "20%", "1 896 000 ₸"),
    ]
    for row_idx, r_data in enumerate(ms_data, start=1):
        for col_idx, text in enumerate(r_data):
            cell = t_milestones.cell(row_idx, col_idx)
            cell.text = text
            set_cell_background(cell, HEX_BG_ALT if row_idx % 2 == 1 else "FFFFFF")
            set_cell_margins(cell, top=60, bottom=60, left=90, right=90)
            p = cell.paragraphs[0]
            p.runs[0].font.size = Pt(9)
            if col_idx in (2, 3):
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = COLOR_GREEN if col_idx == 3 else COLOR_PRIMARY

    p_guar = doc.add_paragraph()
    p_guar.paragraph_format.space_before = Pt(8)
    p_guar.paragraph_format.space_after = Pt(14)
    r_gh = p_guar.add_run("Юридические гарантии заказчика:\n")
    r_gh.font.bold = True
    r_gh.font.color.rgb = COLOR_PRIMARY
    p_guar.add_run(
        "1. Гарантия на программный код — 12 месяцев: бесплатное устранение любых скрытых дефектов или программных сбоев.\n"
        "2. Передача 100% исключительных прав: заказчик получает полный доступ к репозиторию исходного кода, дизайну и базе данных. Никаких скрытых арендных платежей, привязки к разработчику или роялти.\n"
        "3. Полная юридическая чистота: программный комплекс создается на базе передового открытого стека без лицензионных рисков."
    )

    # -------------------------------------------------------------------------
    # 11. SIGNATURE BLOCK
    # -------------------------------------------------------------------------
    h11 = doc.add_heading(level=1)
    r_h11 = h11.add_run("11. Реквизиты и подписи сторон")
    r_h11.font.color.rgb = COLOR_PRIMARY
    r_h11.font.bold = True
    t_sign = doc.add_table(rows=2, cols=2)
    t_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    s00 = t_sign.cell(0, 0)
    s01 = t_sign.cell(0, 1)
    s10 = t_sign.cell(1, 0)
    s11 = t_sign.cell(1, 1)

    s00.width = Inches(3.3)
    s01.width = Inches(3.3)
    s10.width = Inches(3.3)
    s11.width = Inches(3.3)

    p_s00 = s00.paragraphs[0]
    p_s00.add_run("ОТ ИСПОЛНИТЕЛЯ:\nПроектная группа «Индийский Трикотаж»\nг. Алматы • +7 (701) 992-84-12\n\n_____________________ / М.П.").font.size = Pt(9.5)

    p_s01 = s01.paragraphs[0]
    p_s01.add_run("ОТ ЗАКАЗЧИКА:\nТорговая сеть «Индийский Трикотаж»\nг. Алматы, Республика Казахстан\n\n_____________________ / М.П.").font.size = Pt(9.5)

    for p in output_paths:
        os.makedirs(os.path.dirname(os.path.abspath(p)), exist_ok=True)
        try:
            doc.save(p)
            print(f"Document saved successfully to {p}")
        except PermissionError:
            alt_path = p.replace(".docx", "_updated.docx")
            doc.save(alt_path)
            print(f"Warning: {p} is currently locked (open in Word). Saved updated version to {alt_path}")

if __name__ == "__main__":
    target_paths = [
        r"C:\Users\User\.gemini\antigravity\scratch\india-trikotaj\commercial_proposal_indiatrikotaj.docx",
        r"C:\Users\User\.gemini\antigravity\brain\a847fa1d-0601-423a-8270-6915cd64a216\commercial_proposal_indiatrikotaj.docx"
    ]
    create_docx(target_paths)
