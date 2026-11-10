import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=70, bottom=70, left=80, right=80):
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

def create_styled_table(doc, headers, data, col_widths, alignments=None, header_bg="78350F", alt_bg="F8FAFC"):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Headers
    for ci, h in enumerate(headers):
        cell = table.cell(0, ci)
        cell.width = col_widths[ci]
        cell.text = h
        set_cell_background(cell, header_bg)
        set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
        p = cell.paragraphs[0]
        align = alignments[ci] if alignments else WD_ALIGN_PARAGRAPH.LEFT
        p.alignment = align
        if len(p.runs) > 0:
            p.runs[0].font.name = "Arial"
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            p.runs[0].font.size = Pt(8.5)

    # Data Rows
    for ri, row_data in enumerate(data, start=1):
        row_cells = table.rows[ri].cells
        bg = alt_bg if ri % 2 == 1 else "FFFFFF"
        for ci, val in enumerate(row_data):
            cell = row_cells[ci]
            cell.width = col_widths[ci]
            cell.text = str(val)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=70, right=70)
            p = cell.paragraphs[0]
            align = alignments[ci] if alignments else WD_ALIGN_PARAGRAPH.LEFT
            p.alignment = align
            if len(p.runs) > 0:
                p.runs[0].font.name = "Arial"
                p.runs[0].font.size = Pt(8)
                p.runs[0].font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return table

def create_docx(output_paths):
    doc = Document()

    # Set page margins (0.75 in)
    for s in doc.sections:
        s.top_margin = Inches(0.75)
        s.bottom_margin = Inches(0.75)
        s.left_margin = Inches(0.75)
        s.right_margin = Inches(0.75)

    # Base Colors
    HEX_DARK = "451A03"
    HEX_PRIMARY = "78350F"
    HEX_GOLD = "D97706"
    HEX_LIGHT_GOLD = "FEF3C7"
    HEX_BG_ALT = "F8FAFC"
    HEX_GREEN = "059669"
    HEX_LIGHT_GREEN = "ECFDF5"

    COLOR_PRIMARY = RGBColor(0x78, 0x35, 0x0F)
    COLOR_DARK = RGBColor(0x45, 0x1A, 0x03)
    COLOR_GOLD = RGBColor(0xD9, 0x77, 0x06)
    COLOR_GREEN = RGBColor(0x05, 0x96, 0x69)

    # -------------------------------------------------------------------------
    # DOCUMENT HEADER
    # -------------------------------------------------------------------------
    p_top = doc.add_paragraph()
    r_top = p_top.add_run("📋 КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ")
    r_top.font.name = "Arial"
    r_top.font.size = Pt(11)
    r_top.font.bold = True
    r_top.font.color.rgb = COLOR_GOLD

    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Омниканальная цифровая экосистема розничной сети «Индийский Трикотаж» (г. Алматы)")
    r_title.font.name = "Arial"
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_DARK
    p_title.paragraph_format.space_after = Pt(4)

    # Metadata callout box
    t_meta = doc.add_table(rows=4, cols=2)
    t_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Заказчик:", "Руководству и учредителям торговой сети «Индийский Трикотаж»"),
        ("Масштаб проекта:", "16 розничных филиалов в торговых центрах Алматы + Интернет-магазин + Мобильные приложения"),
        ("Статус готовности:", "Платформа разработана, отлажена на реальных данных и готова к промышленному запуску"),
        ("Дата предложения:", "10 ноября 2026 г. • г. Алматы, Республика Казахстан"),
    ]
    for i, (k, v) in enumerate(meta_data):
        row = t_meta.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(1.8)
        c1.width = Inches(5.1)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c1, top=50, bottom=50, left=80, right=80)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.name = "Arial"
        r0.font.bold = True
        r0.font.size = Pt(8.5)
        r0.font.color.rgb = COLOR_PRIMARY

        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.name = "Arial"
        r1.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # 1. БИЗНЕС-ЦЕЛИ И ЗАДАЧИ ПРОЕКТА (ТАБЛИЦА)
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("1. Бизнес-цели и задачи проекта")
    r_h1.font.name = "Arial"
    r_h1.font.color.rgb = COLOR_PRIMARY
    r_h1.font.bold = True

    sec1_headers = ["№", "Бизнес-задача сети", "Проблема текущей офлайн-модели", "Цифровое решение экосистемы"]
    sec1_widths = [Inches(0.4), Inches(1.6), Inches(2.4), Inches(2.5)]
    sec1_aligns = [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    sec1_data = [
        ["1", "Сквозной учет остатков", "Покупатель не нашел размер в филиале — ушел к конкурентам", "Онлайн-мониторинг 16 филиалов в реальном времени, самовывоз Click & Collect за 2 часа"],
        ["2", "Пополнение витрин", "Полки пустеют незаметно, возникает дефицит (Out-of-Stock)", "Авто-контроль неснижаемого остатка и листы перемещения со склада"],
        ["3", "Прямой приём Kaspi Pay", "Потеря 10–15% комиссии при продажах через сторонние маркетплейсы", "Приём Kaspi QR, Kaspi Gold, Kaspi Red (0-0-3) без комиссий маркетплейсов + ОФД Webkassa"],
        ["4", "Оцифровка коллекций ИИ", "Дорогие и долгие фотосессии моделей (от 900 000 ₸/мес)", "Оцифровка карточки за 3 сек по фото + AI Fashion Studio (виртуальные модели без фотостудий)"],
        ["5", "Мобильное присутствие", "Зависимость от Instagram Direct и потеря повторных продаж", "Нативное приложение iOS & Android с авторизацией по Face ID и СМС без паролей в стиле Kaspi"],
    ]
    t1 = create_styled_table(doc, sec1_headers, sec1_data, sec1_widths, sec1_aligns)
    # Highlight tasks in bold
    for row in t1.rows[1:]:
        p_task = row.cells[1].paragraphs[0]
        if len(p_task.runs) > 0:
            p_task.runs[0].font.bold = True

    # -------------------------------------------------------------------------
    # 2. АРХИТЕКТУРА ГОТОВОГО РЕШЕНИЯ (ТАБЛИЦА)
    # -------------------------------------------------------------------------
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("2. Архитектура готового программного комплекса")
    r_h2.font.name = "Arial"
    r_h2.font.color.rgb = COLOR_PRIMARY
    r_h2.font.bold = True

    sec2_headers = ["Модуль системы", "Технологический стек", "Функциональный состав для сети"]
    sec2_widths = [Inches(1.6), Inches(1.8), Inches(3.5)]
    sec2_aligns = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    sec2_data = [
        ["Интернет-магазин (Web)", "Next.js 15, React 19, SSR, TypeScript", "Мгновенная загрузка, SEO Google/Yandex, умные фильтры по составу и 16 филиалам, интерактивная корзина, RU/KZ"],
        ["Мобильное приложение", "React Native (Expo 52), iOS & Android", "Вход по Face ID / Touch ID и СМС без паролей в стиле Kaspi, кешбэк 5% бонусами, push-уведомления"],
        ["Панель управления (CRM)", "Web Admin, PostgreSQL, REST API", "Сквозной учет 16 складов, авто-контроль дефицита, печать ценников со штрихкодами, роли кассиров"],
        ["Платежи и фискализация", "Kaspi Pay API, Webkassa ОФД, Mobizon", "Приём Kaspi QR, Gold, Red 0-0-3, фискализация чеков с отправкой покупателям, шлюз СМС-авторизации"],
        ["ИИ-платформа", "Vision AI, WhatsApp API, Fashion Studio", "AI Product Ingest (оцифровка фото), WhatsApp AI-продавец 24/7, виртуальные фотомодели"],
    ]
    t2 = create_styled_table(doc, sec2_headers, sec2_data, sec2_widths, sec2_aligns)
    for row in t2.rows[1:]:
        p_mod = row.cells[0].paragraphs[0]
        if len(p_mod.runs) > 0:
            p_mod.runs[0].font.bold = True
            p_mod.runs[0].font.color.rgb = COLOR_DARK

    # -------------------------------------------------------------------------
    # 3. ЕДИНАЯ СВОДНАЯ ТАБЛИЦА РАСЧЕТОВ ПО ВСЕМ ТАРИФАМ
    # -------------------------------------------------------------------------
    h3 = doc.add_heading(level=1)
    r_h3 = h3.add_run("3. Единая сводная таблица расчетов по всем тарифам")
    r_h3.font.name = "Arial"
    r_h3.font.color.rgb = COLOR_PRIMARY
    r_h3.font.bold = True

    p_table_intro = doc.add_paragraph(
        "Вся финансовая модель, разработка ПО, статьи запуска, оборудование, сроки окупаемости и график оплат сведены в единую таблицу:"
    )
    p_table_intro.paragraph_format.space_after = Pt(4)

    # Master Table: 26 rows, 5 columns
    master_rows = [
        # (type, col0_num, col1_desc, col2_std, col3_biz, col4_prem)
        ("SECTION", "I", "БЛОК 1: РАЗРАБОТКА САЙТА И ПО ПОД КЛЮЧ", "", "", ""),
        ("ROW", "1.1", "Интернет-магазин (Next.js 15, SSR, 16 филиалов, RU/KZ)", "2 400 000 ₸", "2 600 000 ₸", "2 800 000 ₸"),
        ("ROW", "1.2", "Мобильное приложение iOS & Android (Kaspi ID, Face ID)", "1 800 000 ₸", "2 400 000 ₸", "3 000 000 ₸"),
        ("ROW", "1.3", "Панель управления (CRM, 16 складов, листы перемещений)", "400 000 ₸", "600 000 ₸", "1 000 000 ₸"),
        ("ROW", "1.4", "Интеграция Kaspi Pay (QR, Red 0-0-3) и фискализация Webkassa", "200 000 ₸", "350 000 ₸", "450 000 ₸"),
        ("ROW", "1.5", "Пакет ИИ-модулей (AI Ingest / WhatsApp 24/7 / Fashion Studio)", "100 000 ₸", "250 000 ₸", "550 000 ₸"),
        ("SUBTOTAL", "=", "ПОДИТОГ 1: СТОИМОСТЬ САЙТА И ПО (РАЗРАБОТКА)", "4 900 000 ₸", "6 200 000 ₸", "7 800 000 ₸"),
        
        ("SECTION", "II", "БЛОК 2: СТОИМОСТЬ ЗАПУСКА ПОД КЛЮЧ (ВХОДНЫЕ РАСХОДЫ)", "", "", ""),
        ("ROW", "2.1", "Сервер VPS в Алматы (PS.kz, Закон о ПДн РК) + SSL на 1 год", "140 000 ₸", "140 000 ₸", "140 000 ₸"),
        ("ROW", "2.2", "Брендовый домен .KZ + Облачная база PostgreSQL на 1 год", "145 000 ₸", "145 000 ₸", "145 000 ₸"),
        ("ROW", "2.3", "Лицензии публикации App Store ($99/год) + Google Play ($25)", "62 000 ₸", "62 000 ₸", "62 000 ₸"),
        ("ROW", "2.4", "Боевое подключение Kaspi Pay + онлайн-касса Webkassa на 1 год", "145 000 ₸", "145 000 ₸", "145 000 ₸"),
        ("ROW", "2.5", "Стартовый пакет СМС-авторизации Mobizon", "48 000 ₸ (5k)", "88 000 ₸ (10k)", "118 000 ₸ (15k)"),
        ("ROW", "2.6", "Оборудование 16 филиалов (2D сканеры + принтер сети)", "0 ₸ (смартфоны)", "0 ₸ (эк. −240k)", "0 ₸ (Эк. −272 000 ₸)"),
        ("ROW", "2.7", "Настройка ИИ-инструментов (Prompting, база, WhatsApp API)", "80 000 ₸ (Lite)", "180 000 ₸ (WhatsApp)", "530 000 ₸ (Studio)"),
        ("ROW", "2.8", "Включенная техподдержка (гарантийный период)", "330 000 ₸ (1 мес)", "350 000 ₸ (3 мес)", "540 000 ₸ (6 мес VIP)"),
        ("SUBTOTAL", "=", "ПОДИТОГ 2: СТОИМОСТЬ ЗАПУСКА ПРОЕКТА", "950 000 ₸", "1 110 000 ₸", "1 680 000 ₸"),
        
        ("TOTAL", "💰", "ИТОГО ОБЩАЯ СУММА К ОПЛАТЕ (САЙТ + ЗАПУСК):", "5 850 000 ₸", "7 310 000 ₸", "9 480 000 ₸"),
        ("HIGHLIGHT", "💵", "Эквивалент в долларах США ($):", "~ $11 700", "~ $14 620", "~ $18 960"),
        ("HIGHLIGHT", "⏱️", "Срок окупаемости (при чистой прибыли +6.35 млн ₸/мес):", "27–28 дней", "34–35 дней", "44–45 дней (до 1.5 мес)"),
        ("PAY", "💳", "1 ЭТАП: Авансовый платеж (50%) — старт работ:", "2 925 000 ₸", "3 655 000 ₸", "4 740 000 ₸"),
        ("PAY", "💳", "2 ЭТАП: Промежуточный платеж (30%) — запуск сайта и Kaspi:", "1 755 000 ₸", "2 193 000 ₸", "2 844 000 ₸"),
        ("PAY", "💳", "3 ЭТАП: Финальный платеж (20%) — релиз в сторах и сдача:", "1 170 000 ₸", "1 462 000 ₸", "1 896 000 ₸"),
    ]

    t_master = doc.add_table(rows=len(master_rows) + 1, cols=5)
    t_master.alignment = WD_TABLE_ALIGNMENT.CENTER

    col_widths = [Inches(0.4), Inches(2.7), Inches(1.2), Inches(1.2), Inches(1.4)]

    # Headers
    headers = [
        "№",
        "Статьи сметы и компоненты проекта",
        "Тариф «СТАНДАРТ»\n(Базовый запуск)",
        "Тариф «БИЗНЕС»\n(Оптимальный)",
        "⭐ Тариф «ПРЕМИУМ»\n(ХИТ / ВЫБОР СЕТИ)",
    ]
    for ci, h in enumerate(headers):
        cell = t_master.cell(0, ci)
        cell.width = col_widths[ci]
        cell.text = h
        set_cell_background(cell, HEX_PRIMARY)
        set_cell_margins(cell, top=70, bottom=70, left=70, right=70)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER if ci in (0, 2, 3, 4) else WD_ALIGN_PARAGRAPH.LEFT
        p.runs[0].font.name = "Arial"
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(8.5)

    for ri, rdata in enumerate(master_rows, start=1):
        rtype, c0, c1, c2, c3, c4 = rdata
        row_cells = t_master.rows[ri].cells
        for ci, w in enumerate(col_widths):
            row_cells[ci].width = w

        row_cells[0].text = c0
        row_cells[1].text = c1
        row_cells[2].text = c2
        row_cells[3].text = c3
        row_cells[4].text = c4

        if rtype == "SECTION":
            for ci in range(5):
                set_cell_background(row_cells[ci], "E2E8F0")
                set_cell_margins(row_cells[ci], top=40, bottom=40, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                p.runs[0].font.name = "Arial"
                p.runs[0].font.bold = True
                p.runs[0].font.size = Pt(8.5)
                p.runs[0].font.color.rgb = COLOR_DARK
        elif rtype == "SUBTOTAL":
            for ci in range(5):
                set_cell_background(row_cells[ci], HEX_LIGHT_GOLD)
                set_cell_margins(row_cells[ci], top=50, bottom=50, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                p.runs[0].font.name = "Arial"
                p.runs[0].font.bold = True
                p.runs[0].font.size = Pt(8.5)
                p.runs[0].font.color.rgb = COLOR_DARK
                if ci in (2, 3, 4):
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        elif rtype == "TOTAL":
            for ci in range(5):
                set_cell_background(row_cells[ci], HEX_PRIMARY)
                set_cell_margins(row_cells[ci], top=60, bottom=60, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                p.runs[0].font.name = "Arial"
                p.runs[0].font.bold = True
                p.runs[0].font.size = Pt(9.5)
                p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                if ci in (2, 3, 4):
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        elif rtype == "HIGHLIGHT":
            for ci in range(5):
                set_cell_background(row_cells[ci], HEX_LIGHT_GREEN)
                set_cell_margins(row_cells[ci], top=40, bottom=40, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                p.runs[0].font.name = "Arial"
                p.runs[0].font.bold = True
                p.runs[0].font.size = Pt(8.5)
                p.runs[0].font.color.rgb = COLOR_GREEN
                if ci in (2, 3, 4):
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        elif rtype == "PAY":
            for ci in range(5):
                set_cell_background(row_cells[ci], HEX_BG_ALT)
                set_cell_margins(row_cells[ci], top=40, bottom=40, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                p.runs[0].font.name = "Arial"
                p.runs[0].font.size = Pt(8.5)
                if ci in (2, 3, 4):
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                    p.runs[0].font.bold = True
                    p.runs[0].font.color.rgb = COLOR_PRIMARY
        else:
            bg = HEX_BG_ALT if ri % 2 == 1 else "FFFFFF"
            for ci in range(5):
                set_cell_background(row_cells[ci], bg)
                set_cell_margins(row_cells[ci], top=40, bottom=40, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                p.runs[0].font.name = "Arial"
                p.runs[0].font.size = Pt(8)
                if ci in (2, 3, 4):
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                if ci == 4:
                    p.runs[0].font.bold = True
                if c0 == "2.6":
                    p.runs[0].font.color.rgb = COLOR_GREEN

    # Explanatory Callout Box / Table
    t_notes = doc.add_table(rows=1, cols=1)
    t_notes.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_note = t_notes.cell(0, 0)
    c_note.width = Inches(6.9)
    set_cell_background(c_note, "F0FDF4")
    set_cell_margins(c_note, top=70, bottom=70, left=90, right=90)
    p_note = c_note.paragraphs[0]
    r_n1 = p_note.add_run("🎁 Прямая экономия 272 000 ₸ на оборудовании: ")
    r_n1.font.name = "Arial"
    r_n1.font.bold = True
    r_n1.font.size = Pt(8.5)
    r_n1.font.color.rgb = COLOR_GREEN
    r_n2 = p_note.add_run("Платформа поддерживает 16 имеющихся сканеров касс и термопринтер этикеток сети «из коробки» (HID-интерфейс + браузерная печать). Покупка новых устройств не требуется.\n")
    r_n2.font.name = "Arial"
    r_n2.font.size = Pt(8.5)
    
    r_n3 = p_note.add_run("ℹ️ WhatsApp AI (180 000 ₸ разово): ")
    r_n3.font.name = "Arial"
    r_n3.font.bold = True
    r_n3.font.size = Pt(8.5)
    r_n3.font.color.rgb = COLOR_PRIMARY
    r_n4 = p_note.add_run("Разовая настройка промптов, интеграция с остатками 16 филиалов и вебхуков разработчиком (рынок РК: 250–600 тыс. ₸). Ежемесячные токены и трафик (~25–40 тыс. ₸/мес) оплачиваются Заказчиком напрямую провайдерам по факту.")
    r_n4.font.name = "Arial"
    r_n4.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # 4. ФИНАНСОВЫЙ ЭФФЕКТ СЕТИ (ROI) (ТАБЛИЦЫ)
    # -------------------------------------------------------------------------
    h4 = doc.add_heading(level=1)
    r_h4 = h4.add_run("4. Финансовый эффект и окупаемость инвестиций (ROI)")
    r_h4.font.name = "Arial"
    r_h4.font.color.rgb = COLOR_PRIMARY
    r_h4.font.bold = True

    sec4_headers = ["№", "Источник дополнительной прибыли сети", "Расчетная метрика", "Сумма в месяц"]
    sec4_widths = [Inches(0.4), Inches(2.3), Inches(2.7), Inches(1.5)]
    sec4_aligns = [WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.RIGHT]
    sec4_data = [
        ["1", "Онлайн-заказы курьером по Алматы", "20 заказов/день × средний чек 7 500 ₸ × маржа 55%", "+ 2 475 000 ₸"],
        ["2", "Самовывоз из 16 филиалов (Click & Collect)", "15 сохраненных покупок/день (заказ нужного размера)", "+ 1 856 000 ₸"],
        ["3", "Ликвидация дефицита (Out-of-Stock)", "Своевременное пополнение витрин (~12 покупок/день)", "+ 1 650 000 ₸"],
        ["4", "Экономия на комиссиях Kaspi Магазина", "Перевод клиентов с маркетплейса (15%) в свое ПО (1.5%)", "+ 450 000 ₸"],
        ["5", "Минус ежемесячный OPEX платформы", "Серверы в Алматы, СМС, токены нейросетей", "- 75 000 ₸"],
        ["=", "ИТОГО ЧИСТАЯ ДОПОЛНИТЕЛЬНАЯ ПРИБЫЛЬ СЕТИ:", "Суммарный прирост чистой прибыли", "+ 6 356 000 ₸ / мес"],
    ]
    t4 = create_styled_table(doc, sec4_headers, sec4_data, sec4_widths, sec4_aligns)
    # Format total row
    tot_row = t4.rows[-1]
    for ci in range(4):
        set_cell_background(tot_row.cells[ci], HEX_LIGHT_GOLD)
        p = tot_row.cells[ci].paragraphs[0]
        if len(p.runs) > 0:
            p.runs[0].font.bold = True
            p.runs[0].font.size = Pt(8.5)
            p.runs[0].font.color.rgb = COLOR_DARK

    p_roi_sub = doc.add_paragraph()
    r_rsub = p_roi_sub.add_run("Сроки окупаемости и годовая доходность по тарифам:")
    r_rsub.font.name = "Arial"
    r_rsub.font.bold = True
    r_rsub.font.size = Pt(10)
    r_rsub.font.color.rgb = COLOR_DARK
    p_roi_sub.paragraph_format.space_after = Pt(2)

    sec4_roi_headers = ["Тарифный пакет", "Сумма инвестиций", "Формула расчета срока окупаемости", "Срок возврата", "Прибыль за 1-й год", "ROI"]
    sec4_roi_widths = [Inches(1.4), Inches(1.1), Inches(1.7), Inches(1.0), Inches(1.1), Inches(0.6)]
    sec4_roi_aligns = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.RIGHT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.RIGHT, WD_ALIGN_PARAGRAPH.CENTER]
    sec4_roi_data = [
        ["Тариф «СТАНДАРТ»", "5 850 000 ₸", "5 850 000 ₸ / 6 356 000 ₸ = 0.92 мес", "27–28 дней", "+ 76 272 000 ₸", "> 1300%"],
        ["Тариф «БИЗНЕС»", "7 310 000 ₸", "7 310 000 ₸ / 6 356 000 ₸ = 1.15 мес", "34–35 дней", "+ 76 272 000 ₸", "> 1040%"],
        ["⭐ Тариф «ПРЕМИУМ» (Хит)", "9 480 000 ₸", "9 480 000 ₸ / 6 356 000 ₸ = 1.49 мес", "44–45 дней (1.5 мес)", "+ 76 272 000 ₸", "> 800%"],
    ]
    t4_roi = create_styled_table(doc, sec4_roi_headers, sec4_roi_data, sec4_roi_widths, sec4_roi_aligns, header_bg="451A03")
    # Highlight Premium row
    prem_row = t4_roi.rows[3]
    for ci in range(6):
        set_cell_background(prem_row.cells[ci], HEX_LIGHT_GREEN)
        p = prem_row.cells[ci].paragraphs[0]
        if len(p.runs) > 0:
            p.runs[0].font.bold = True
            p.runs[0].font.color.rgb = COLOR_GREEN

    # -------------------------------------------------------------------------
    # 5. АБОНЕНТСКОЕ СОПРОВОЖДЕНИЕ (ТАБЛИЦА)
    # -------------------------------------------------------------------------
    h5 = doc.add_heading(level=1)
    r_h5 = h5.add_run("5. Абонентское сопровождение и регламент доработок (MRR)")
    r_h5.font.name = "Arial"
    r_h5.font.color.rgb = COLOR_PRIMARY
    r_h5.font.bold = True

    sec5_headers = ["Пакет сопровождения", "Стоимость", "Включенный состав услуг и регламент SLA", "Разработка новых функций"]
    sec5_widths = [Inches(1.5), Inches(1.1), Inches(2.7), Inches(1.6)]
    sec5_aligns = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.RIGHT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    sec5_data = [
        ["Базовый мониторинг", "150 000 ₸ / мес", "Uptime 99.9% 24/7, бэкапы каждые 6 часов, контроль домена, SSL, шлюзов Kaspi Pay и Webkassa", "Не входит (строго по доп. соглашению)"],
        ["Премиум DevOps", "250 000 ₸ / мес", "Базовый мониторинг + обязательная адаптация приложений под новые требования iOS и Android при обновлениях ОС", "Не входит (строго по доп. соглашению)"],
    ]
    t5 = create_styled_table(doc, sec5_headers, sec5_data, sec5_widths, sec5_aligns)
    for row in t5.rows[1:]:
        p_pkg = row.cells[0].paragraphs[0]
        if len(p_pkg.runs) > 0:
            p_pkg.runs[0].font.bold = True
            p_pkg.runs[0].font.color.rgb = COLOR_DARK
        p_lim = row.cells[3].paragraphs[0]
        if len(p_lim.runs) > 0:
            p_lim.runs[0].font.color.rgb = RGBColor(0xDC, 0x26, 0x26)

    # Callout about new features
    t_feat = doc.add_table(rows=1, cols=1)
    t_feat.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_feat = t_feat.cell(0, 0)
    c_feat.width = Inches(6.9)
    set_cell_background(c_feat, "FFFBEB")
    set_cell_margins(c_feat, top=60, bottom=60, left=80, right=80)
    p_feat = c_feat.paragraphs[0]
    r_f1 = p_feat.add_run("⚠️ РЕГЛАМЕНТ РАЗРАБОТКИ НОВЫХ ФУНКЦИЙ: ")
    r_f1.font.name = "Arial"
    r_f1.font.bold = True
    r_f1.font.size = Pt(8.5)
    r_f1.font.color.rgb = COLOR_GOLD
    r_f2 = p_feat.add_run("Абонентская плата обеспечивает исключительно стабильность, безопасность и совместимость платформы. Доработка любого нового функционала, отчетов или акций выполняется строго по отдельным Дополнительным соглашениям (по ТЗ).")
    r_f2.font.name = "Arial"
    r_f2.font.size = Pt(8.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # 6. ГРАФИК ВНЕДРЕНИЯ (ТАБЛИЦА)
    # -------------------------------------------------------------------------
    h6 = doc.add_heading(level=1)
    r_h6 = h6.add_run("6. График внедрения Тарифа «Премиум» за 14 рабочих дней")
    r_h6.font.name = "Arial"
    r_h6.font.color.rgb = COLOR_PRIMARY
    r_h6.font.bold = True

    sec6_headers = ["Этап", "Сроки", "Состав работ этапа", "Контрольный результат"]
    sec6_widths = [Inches(1.5), Inches(0.8), Inches(2.6), Inches(2.0)]
    sec6_aligns = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    sec6_data = [
        ["Этап 1: Организационный старт", "Дни 1–3", "Подписание договора, аванс 50%, регистрация домена .KZ, SSL, аккаунты Apple/Google, серверы PS.kz", "Развернута защищенная серверная инфраструктура в ЦОД Алматы"],
        ["Этап 2: Финансовый контур", "Дни 4–7", "Боевой Kaspi Pay (QR, Red 0-0-3), ОФД Webkassa, СМС Mobizon, WhatsApp Business API", "Настроены онлайн-платежи, фискализация и СМС-шлюз"],
        ["Этап 3: ИИ и Склады сети", "Дни 8–11", "Запуск AI Fashion Studio, сквозные остатки 16 филиалов, сопряжение сканеров и принтеров сети (0 ₸)", "Каталог оцифрован, сканеры на кассах 16 филиалов подключены"],
        ["Этап 4: Релиз и обучение", "Дни 12–14", "Тестовый платеж 100 ₸ Kaspi QR, инструктаж кассиров 16 точек, релиз в App Store & Google Play", "Проект сдан заказчику, старт официальных онлайн-продаж"],
    ]
    t6 = create_styled_table(doc, sec6_headers, sec6_data, sec6_widths, sec6_aligns)
    for row in t6.rows[1:]:
        p_st = row.cells[0].paragraphs[0]
        if len(p_st.runs) > 0:
            p_st.runs[0].font.bold = True
            p_st.runs[0].font.color.rgb = COLOR_DARK

    # -------------------------------------------------------------------------
    # 7. ГАРАНТИИ И ПОДПИСИ СТОРОН (ТАБЛИЦЫ)
    # -------------------------------------------------------------------------
    h7 = doc.add_heading(level=1)
    r_h7 = h7.add_run("7. Юридические гарантии и реквизиты сторон")
    r_h7.font.name = "Arial"
    r_h7.font.color.rgb = COLOR_PRIMARY
    r_h7.font.bold = True

    sec7_headers = ["Параметр гарантии", "Обязательства Исполнителя в договоре"]
    sec7_widths = [Inches(2.0), Inches(4.9)]
    sec7_aligns = [WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT]
    sec7_data = [
        ["Гарантия на программный код", "12 месяцев бесплатного устранения любых скрытых дефектов или сбоев"],
        ["Исключительные права", "100% исключительных прав на исходный код, дизайн и базу данных передаются Заказчику"],
        ["Отсутствие роялти", "Никаких скрытых комиссий, роялти или абонентской привязки к разработчику"],
    ]
    t7 = create_styled_table(doc, sec7_headers, sec7_data, sec7_widths, sec7_aligns)
    for row in t7.rows[1:]:
        p_g = row.cells[0].paragraphs[0]
        if len(p_g.runs) > 0:
            p_g.runs[0].font.bold = True
            p_g.runs[0].font.color.rgb = COLOR_DARK

    t_sign = doc.add_table(rows=1, cols=2)
    t_sign.alignment = WD_TABLE_ALIGNMENT.CENTER
    s00 = t_sign.cell(0, 0)
    s01 = t_sign.cell(0, 1)

    s00.width = Inches(3.45)
    s01.width = Inches(3.45)
    set_cell_background(s00, "F8FAFC")
    set_cell_background(s01, "F8FAFC")
    set_cell_margins(s00, top=70, bottom=70, left=80, right=80)
    set_cell_margins(s01, top=70, bottom=70, left=80, right=80)

    p_s00 = s00.paragraphs[0]
    r_s00_h = p_s00.add_run("ОТ ИСПОЛНИТЕЛЯ:\n")
    r_s00_h.font.bold = True
    r_s00_h.font.size = Pt(9.5)
    r_s00_h.font.color.rgb = COLOR_PRIMARY
    p_s00.add_run("Проектная IT-группа «Индийский Трикотаж»\nг. Алматы • Телефон / WhatsApp: +7 (701) 992-84-12\n\n_______________________ / М.П.").font.size = Pt(8.5)

    p_s01 = s01.paragraphs[0]
    r_s01_h = p_s01.add_run("ОТ ЗАКАЗЧИКА:\n")
    r_s01_h.font.bold = True
    r_s01_h.font.size = Pt(9.5)
    r_s01_h.font.color.rgb = COLOR_PRIMARY
    p_s01.add_run("Торговая сеть «Индийский Трикотаж»\nг. Алматы, Республика Казахстан\n\n\n_______________________ / М.П.").font.size = Pt(8.5)

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
