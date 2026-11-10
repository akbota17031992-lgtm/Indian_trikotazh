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

def set_cell_margins(cell, top=80, bottom=80, left=100, right=100):
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
    r_top = p_top.add_run("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ")
    r_top.font.name = "Arial"
    r_top.font.size = Pt(11)
    r_top.font.bold = True
    r_top.font.color.rgb = COLOR_GOLD

    p_title = doc.add_paragraph()
    r_title = p_title.add_run("Поставка, запуск и сопровождение омниканальной цифровой экосистемы розничной сети «Индийский Трикотаж» (г. Алматы)")
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
        c0.width = Inches(2.0)
        c1.width = Inches(4.7)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, top=50, bottom=50, left=80, right=80)
        set_cell_margins(c1, top=50, bottom=50, left=80, right=80)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9)
        r0.font.color.rgb = COLOR_PRIMARY

        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(9)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # 1. БИЗНЕС-ЦЕЛЬ И ЗАДАЧИ ПРОЕКТА
    # -------------------------------------------------------------------------
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("1. Бизнес-цель и ключевые задачи проекта")
    r_h1.font.color.rgb = COLOR_PRIMARY
    r_h1.font.bold = True

    p_intro = doc.add_paragraph(
        "Торговая сеть «Индийский Трикотаж» объединяет 16 филиалов в торговых центрах и розничных точках Алматы. "
        "Цель проекта — объединить магазины, склады и онлайн-продажи в единую экосистему:\n"
        "1. Сквозной учет остатков и ликвидация дефицита (Out-of-Stock): клиент и кассир видят точное наличие нужного размера в любом из 16 филиалов (Click & Collect за 2 часа).\n"
        "2. Автоматическое пополнение филиалов: система отслеживает неснижаемый остаток и формирует листы перемещения со склада, устраняя дефицит на витринах.\n"
        "3. Прямой приём Kaspi Pay: приём оплаты через Kaspi QR, Kaspi Gold, Kaspi Red (0-0-3) и Рассрочку без 10–15% комиссий сторонних маркетплейсов с фискализацией Webkassa.\n"
        "4. Оцифровка коллекций через ИИ: создание карточек товаров на казахском и русском языках по фото со смартфона, а в тарифе «Премиум» — генерация лукбуков на виртуальных фотомоделях без затрат на фотостудии.\n"
        "5. Мобильное присутствие бренда: нативное приложение с авторизацией по Face ID и СМС без паролей в стиле Kaspi."
    )
    p_intro.paragraph_format.line_spacing = 1.15
    p_intro.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # 2. АРХИТЕКТУРА ГОТОВОГО РЕШЕНИЯ
    # -------------------------------------------------------------------------
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("2. Архитектура разработанного программного комплекса")
    r_h2.font.color.rgb = COLOR_PRIMARY
    r_h2.font.bold = True

    arch_items = [
        ("Интернет-магазин (Web):", "Next.js 15, SSR, SEO-оптимизация, фильтры по составу и 16 филиалам, интерактивная корзина, мультиязычность (Русский / Қазақша)."),
        ("Мобильное приложение (iOS & Android):", "Нативный кроссплатформенный стек Expo React Native, авторизация Kaspi по СМС без паролей, Face ID / Touch ID / код разблокировки, гостевой режим, кешбэк 5% бонусами."),
        ("Панель управления & CRM (Админка):", "Сквозной учет остатков по 16 складам в реальном времени, авто-контроль дефицита, печать ценников со штрихкодами на принтеры сети, роли персонала (Директор, Менеджер, Кассир)."),
        ("Интеграционный контур:", "Kaspi Pay (QR, Red 0-0-3), ОФД Webkassa, СМС Mobizon, ИИ-платформа (AI Ingest, WhatsApp AI-продавец 24/7, AI Fashion Studio)."),
    ]
    for title, desc in arch_items:
        p_a = doc.add_paragraph()
        r_at = p_a.add_run(f"• {title} ")
        r_at.font.bold = True
        r_at.font.color.rgb = COLOR_DARK
        p_a.add_run(desc)
        p_a.paragraph_format.space_after = Pt(2)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # -------------------------------------------------------------------------
    # 3. ЕДИНАЯ СВОДНАЯ ТАБЛИЦА РАСЧЕТОВ ПО ВСЕМ ТАРИФАМ
    # -------------------------------------------------------------------------
    h3 = doc.add_heading(level=1)
    r_h3 = h3.add_run("3. Единая сводная таблица расчетов по всем тарифам")
    r_h3.font.color.rgb = COLOR_PRIMARY
    r_h3.font.bold = True

    p_table_intro = doc.add_paragraph(
        "В единой таблице сведены все финансовые расчеты: стоимость разработки ПО, статьи запуска, бесплатная интеграция оборудования сети (экономия 272 000 ₸), сроки окупаемости и график платежей:"
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

    # Col widths: 0.4 in, 2.7 in, 1.2 in, 1.2 in, 1.5 in
    col_widths = [Inches(0.4), Inches(2.7), Inches(1.2), Inches(1.2), Inches(1.5)]

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
            # Merge across cells
            for ci in range(5):
                set_cell_background(row_cells[ci], "E2E8F0")
                set_cell_margins(row_cells[ci], top=40, bottom=40, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                p.runs[0].font.bold = True
                p.runs[0].font.size = Pt(8.5)
                p.runs[0].font.color.rgb = COLOR_DARK
        elif rtype == "SUBTOTAL":
            for ci in range(5):
                set_cell_background(row_cells[ci], HEX_LIGHT_GOLD)
                set_cell_margins(row_cells[ci], top=50, bottom=50, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
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
                p.runs[0].font.size = Pt(8.5)
                if ci in (2, 3, 4):
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                    p.runs[0].font.bold = True
                    p.runs[0].font.color.rgb = COLOR_PRIMARY
        else:
            # Regular row
            bg = HEX_BG_ALT if ri % 2 == 1 else "FFFFFF"
            for ci in range(5):
                set_cell_background(row_cells[ci], bg)
                set_cell_margins(row_cells[ci], top=40, bottom=40, left=60, right=60)
                p = row_cells[ci].paragraphs[0]
                p.runs[0].font.size = Pt(8)
                if ci in (2, 3, 4):
                    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
                if ci == 4:
                    p.runs[0].font.bold = True
                if c0 == "2.6":
                    p.runs[0].font.color.rgb = COLOR_GREEN

    # Explanatory Callout
    p_eq_note = doc.add_paragraph()
    p_eq_note.paragraph_format.space_before = Pt(6)
    p_eq_note.paragraph_format.space_after = Pt(6)
    r_eq_h = p_eq_note.add_run("🎁 ПРЯМАЯ ЭКОНОМИЯ 272 000 ₸ НА ОБОРУДОВАНИИ СЕТИ:\n")
    r_eq_h.font.bold = True
    r_eq_h.font.size = Pt(9)
    r_eq_h.font.color.rgb = COLOR_GREEN
    r_eq_b = p_eq_note.add_run(
        "• В розничной сети «Индийский Трикотаж» уже установлены 2D-сканеры на всех 16 кассах, а на складе есть термопринтер для этикеток. Наша платформа поддерживает работу с существующей техникой сети «из коробки» (HID-интерфейс + браузерная печать). Закупка нового оборудования не требуется — экономия бюджета 272 000 ₸ на старте!\n"
        "• WhatsApp AI-продавец 24/7 (180 000 ₸ разово): это разовая настройка и обучение нейросети разработчиком под трикотаж (рыночная цена в РК: 250–600 тыс. ₸). Ежемесячные токены и трафик (~25–40 тыс. ₸/мес) оплачиваются Заказчиком напрямую провайдерам по факту."
    )
    r_eq_b.font.size = Pt(8.5)

    # -------------------------------------------------------------------------
    # 4. ФИНАНСОВЫЙ ЭФФЕКТ СЕТИ (ROI)
    # -------------------------------------------------------------------------
    h4 = doc.add_heading(level=1)
    r_h4 = h4.add_run("4. Финансовый эффект сети и окупаемость инвестиций (ROI)")
    r_h4.font.color.rgb = COLOR_PRIMARY
    r_h4.font.bold = True

    p_roi = doc.add_paragraph(
        "Платформа конвертирует существующий покупательский поток сети в дополнительную чистую прибыль:\n"
        "• Онлайн-заказы курьером (20 чек/день × 7 500 ₸ × маржа 55%): + 2 475 000 ₸ / месяц\n"
        "• Самовывоз Click & Collect из 16 филиалов (15 сохраненных чеков/день): + 1 856 000 ₸ / месяц\n"
        "• Ликвидация дефицита (Out-of-Stock) по складам (~12 покупок/день): + 1 650 000 ₸ / месяц\n"
        "• Экономия на комиссиях Kaspi Магазина (перевод клиентов в свое ПО): + 450 000 ₸ / месяц\n"
        "• Минус ежемесячный OPEX (серверы, СМС, токены ИИ): - 75 000 ₸ / месяц\n"
        "ИТОГО ДОПОЛНИТЕЛЬНАЯ ЧИСТАЯ ПРИБЫЛЬ СЕТИ: + 6 356 000 ₸ в месяц.\n\n"
        "Сроки окупаемости по всем тарифам:\n"
        "1. Тариф «СТАНДАРТ» (5 850 000 ₸): 5 850 000 ₸ / 6 356 000 ₸ = 0.92 месяца (всего 27–28 дней!).\n"
        "2. Тариф «БИЗНЕС» (7 310 000 ₸): 7 310 000 ₸ / 6 356 000 ₸ = 1.15 месяца (всего 34–35 дней!).\n"
        "3. ⭐ Тариф «ПРЕМИУМ» (9 480 000 ₸): 9 480 000 ₸ / 6 356 000 ₸ = 1.49 месяца (всего 44–45 дней!).\n"
        "Каждый тариф полностью окупается менее чем за 1.5 месяца, принося более 75 млн ₸ дополнительного дохода за первый год."
    )
    p_roi.paragraph_format.line_spacing = 1.15
    p_roi.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # 5. АБОНЕНТСКОЕ СОПРОВОЖДЕНИЕ
    # -------------------------------------------------------------------------
    h5 = doc.add_heading(level=1)
    r_h5 = h5.add_run("5. Абонентское сопровождение и регламент доработок (MRR)")
    r_h5.font.color.rgb = COLOR_PRIMARY
    r_h5.font.bold = True

    p_mrr = doc.add_paragraph(
        "После завершения гарантийного периода действует договор сервисной поддержки стабильности:\n"
        "• Тариф «Базовый мониторинг» (150 000 ₸/мес): uptime 99.9% 24/7, бэкапы каждые 6 часов, контроль домена, SSL, шлюзов Kaspi Pay и Webkassa.\n"
        "• Тариф «Премиум DevOps» (250 000 ₸/мес): базовый мониторинг + обязательная адаптация мобильных приложений под новые требования iOS (Apple) и Android (Google) при ежегодных обновлениях ОС (гарантия от блокировки и удаления из сторов).\n\n"
        "⚠️ РЕГЛАМЕНТ РАЗРАБОТКИ НОВЫХ ФУНКЦИЙ:\n"
        "Абонентская плата обеспечивает исключительно стабильность, безопасность и совместимость платформы. Доработка любого нового функционала, отчетов или акций выполняется строго по отдельным Дополнительным соглашениям (по ТЗ)."
    )
    p_mrr.paragraph_format.line_spacing = 1.15
    p_mrr.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # 6. ГРАФИК ВНЕДРЕНИЯ (14 ДНЕЙ)
    # -------------------------------------------------------------------------
    h6 = doc.add_heading(level=1)
    r_h6 = h6.add_run("6. График внедрения Тарифа «Премиум» за 14 рабочих дней")
    r_h6.font.color.rgb = COLOR_PRIMARY
    r_h6.font.bold = True

    p_roadmap = doc.add_paragraph(
        "• Дни 1–3 (Организационный запуск): Договор, аванс 50%, регистрация домена .KZ, выпуск Wildcard SSL, аккаунты Apple ($99) и Google ($25), серверы PS.kz в ЦОД Алматы.\n"
        "• Дни 4–7 (Шлюзы и касса): Боевое подключение Kaspi Pay (QR, Red 0-0-3), ОФД Webkassa, подключение СМС Mobizon и WhatsApp Business API.\n"
        "• Дни 8–11 (ИИ и Склады сети): Запуск AI Fashion Studio (виртуальные модели), сквозные остатки 16 филиалов, бесплатное сопряжение сканеров и принтеров сети.\n"
        "• Дни 12–14 (Релиз и обучение): Тестовый платеж 100 ₸ Kaspi QR, инструктаж кассиров 16 точек, релиз в App Store & Google Play, старт продаж."
    )
    p_roadmap.paragraph_format.line_spacing = 1.15
    p_roadmap.paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------------------
    # 7. ГАРАНТИИ И ПОДПИСИ СТОРОН
    # -------------------------------------------------------------------------
    h7 = doc.add_heading(level=1)
    r_h7 = h7.add_run("7. Юридические гарантии и реквизиты сторон")
    r_h7.font.color.rgb = COLOR_PRIMARY
    r_h7.font.bold = True

    p_guar = doc.add_paragraph(
        "1. Гарантия на программный код — 12 месяцев (бесплатное устранение скрытых дефектов).\n"
        "2. 100% исключительных прав на исходный код, дизайн и базу данных передаются Заказчику без роялти."
    )
    p_guar.paragraph_format.space_after = Pt(10)

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
