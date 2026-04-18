import os

# Try reportlab first, fall back to fpdf2
try:
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.pdfgen import canvas
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    USE_REPORTLAB = True
except ImportError:
    USE_REPORTLAB = False

slides = [
    ("校园综合服务", ["一个 App，搞定你的校园日常"]),
    ("产品概述", ["为什么需要校园综合服务？", "痛点分析 · 解决方案 · 目标用户 · 核心价值"]),
    ("功能架构", ["六大核心模块", "首页仪表盘 · 校园导航 · 课程中心", "校园跑步 · 文创商城 · 个人中心"]),
    ("首页仪表盘", ["虚拟伙伴小喵", "今日课程实时状态", "校园公告推送", "快捷入口"]),
    ("校园导航", ["GPS精准定位", "智能路线规划", "语音导航", "3D实时导航"]),
    ("课程中心", ["三种课表视图", "灵活配置", "作业通知", "出勤统计"]),
    ("校园跑步", ["实时轨迹绘制", "实时数据面板", "智能历史记录", "优雅降级"]),
    ("文创商城", ["校园文创商品", "分类筛选", "热门活动报名", "社区互动"]),
    ("个人中心", ["每日签到", "多维排行榜", "成就徽章", "学信网认证"]),
    ("技术架构", ["uni-app 跨平台框架", "腾讯地图 SDK", "Express.js 后端", "localStorage 持久化"]),
    ("谢谢", ["校园综合服务", "你的校园生活，一个 App 搞定"]),
]

OUT = r'C:\Users\吕嘉成\AppData\Roaming\CherryStudio\Data\Agents\d8xgjfrd2\campus-app\校园综合服务-产品演示.pdf'

def find_chinese_font():
    """Find a Chinese font on Windows"""
    candidates = [
        r'C:\Windows\Fonts\msyh.ttc',
        r'C:\Windows\Fonts\msyh.ttf',
        r'C:\Windows\Fonts\simhei.ttf',
        r'C:\Windows\Fonts\simsun.ttc',
        r'C:\Windows\Fonts\simfang.ttf',
        r'C:\Windows\Fonts\msyhbd.ttc',
    ]
    for f in candidates:
        if os.path.exists(f):
            return f
    return None

def generate_with_reportlab():
    font_path = find_chinese_font()
    if font_path:
        pdfmetrics.registerFont(TTFont('Chinese', font_path))
        font_name = 'Chinese'
    else:
        font_name = 'Helvetica'

    c = canvas.Canvas(OUT, pagesize=landscape(A4))
    w, h = landscape(A4)

    for i, (title, lines) in enumerate(slides):
        # Background
        c.setFillColorRGB(0.04, 0.04, 0.1)
        c.rect(0, 0, w, h, fill=1, stroke=0)

        # Accent line
        c.setStrokeColorRGB(0.3, 0.5, 1)
        c.setLineWidth(3)
        c.line(100, h - 80, w - 100, h - 80)

        # Page number
        c.setFillColorRGB(0.5, 0.5, 0.6)
        c.setFont(font_name, 12)
        c.drawRightString(w - 80, 40, f'{i+1} / {len(slides)}')

        # Title
        c.setFillColorRGB(1, 1, 1)
        c.setFont(font_name, 36)
        c.drawString(100, h - 150, title)

        # Body
        c.setFont(font_name, 20)
        for j, line in enumerate(lines):
            c.setFillColorRGB(0.85, 0.85, 0.95)
            y = h - 250 - j * 50
            c.drawString(130, y, line)

        c.showPage()

    c.save()
    print(f'PDF generated: {OUT}')

def generate_with_fpdf2():
    from fpdf import FPDF
    font_path = find_chinese_font()

    pdf = FPDF(orientation='L', format='A4')
    pdf.set_auto_page_break(False)

    if font_path:
        pdf.add_font('Chinese', '', font_path, uni=True)
        font_name = 'Chinese'
    else:
        font_name = 'Helvetica'

    for i, (title, lines) in enumerate(slides):
        pdf.add_page()
        # Background
        pdf.set_fill_color(10, 10, 26)
        pdf.rect(0, 0, 297, 210, 'F')

        # Accent line
        pdf.set_draw_color(77, 128, 255)
        pdf.set_line_width(0.8)
        pdf.line(15, 18, 282, 18)

        # Page number
        pdf.set_text_color(128, 128, 153)
        pdf.set_font(font_name, '', 10)
        pdf.set_xy(240, 195)
        pdf.cell(45, 8, f'{i+1} / {len(slides)}', align='R')

        # Title
        pdf.set_text_color(255, 255, 255)
        pdf.set_font(font_name, '', 30)
        pdf.set_xy(15, 30)
        pdf.cell(267, 15, title)

        # Body
        pdf.set_font(font_name, '', 16)
        pdf.set_text_color(217, 217, 242)
        for j, line in enumerate(lines):
            pdf.set_xy(20, 60 + j * 15)
            pdf.cell(257, 12, line)

    pdf.output(OUT)
    print(f'PDF generated: {OUT}')

if USE_REPORTLAB:
    generate_with_reportlab()
else:
    try:
        generate_with_fpdf2()
    except ImportError:
        print('ERROR: Need reportlab or fpdf2. Install with: pip install reportlab')
