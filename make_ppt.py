#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""校园综合服务产品演示 PPT 生成脚本
无需第三方库，仅使用标准库(zipfile)生成 .pptx 文件
支持：卡片式布局、渐变色背景、居中封面/结尾

用法: python make_ppt.py
"""
import zipfile
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "校园综合服务-产品演示.pptx")

# ==================== 幻灯片内容 ====================
slides = [
    {
        "title": "校园综合服务",
        "lines": ["一个 App，搞定你的校园日常"],
        "title_size": 52, "body_size": 28,
        "centered": True,
    },
    {
        "title": "产品概述",
        "lines": [
            "为什么需要校园综合服务？",
            "",
            "痛点：课表、导航、跑步、商城分散多个 App",
            "方案：一站式校园生活服务平台",
            "目标用户：全体在校大学生",
            "核心价值：便捷、统一、智能化",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "功能架构",
        "lines": [
            "六大核心模块",
            "",
            "首页仪表盘  |  校园导航  |  课程中心",
            "校园跑步    |  文创商城  |  个人中心",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "首页仪表盘",
        "lines": [
            "虚拟伙伴小喵 — 你的校园 AI 助手",
            "今日课程实时状态卡片",
            "校园公告推送 + 快捷入口",
            "天气、时间、待办事项一目了然",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "校园导航",
        "lines": [
            "GPS 精准定位，覆盖全校建筑",
            "智能路线规划，支持驾车/步行/骑行",
            "3D 实时导航，转弯提示语音播报",
            "校园 POI 搜索，一键导航到目的地",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "课程中心",
        "lines": [
            "三种课表视图：周视图 / 列表 / 时间线",
            "灵活配置：周数、上课时间、教室自定义",
            "作业通知 + 出勤统计",
            "支持从教务系统一键导入课表",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "校园跑步",
        "lines": [
            "GPS 实时轨迹绘制，运动路线可视化",
            "实时数据面板：距离、配速、卡路里",
            "智能历史记录，支持目标设定",
            "优雅降级：室内也能记录运动数据",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "文创商城",
        "lines": [
            "校园文创商品在线选购",
            "分类筛选 + 搜索 + 购物车",
            "热门校园活动在线报名",
            "校园社区互动分享",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "个人中心",
        "lines": [
            "每日签到系统 + 积分奖励",
            "多维排行榜：跑步、签到、消费",
            "成就徽章系统，记录校园成长",
            "学信网实名认证 + 校园卡绑定",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "技术架构",
        "lines": [
            "前端：uni-app (Vue 3) — 一套代码，多端运行",
            "地图：高德/腾讯地图 SDK — 定位 + 导航 + 搜索",
            "后端：Express.js + MongoDB — RESTful API",
            "数据：localStorage 本地持久化 + 云端同步",
        ],
        "title_size": 44, "body_size": 24,
    },
    {
        "title": "谢谢",
        "lines": ["校园综合服务", "你的校园生活，一个 App 搞定"],
        "title_size": 52, "body_size": 28,
        "centered": True,
    },
]

# ==================== 卡片布局配置 ====================
# 每张幻灯片的卡片定义（仅功能页使用）
slide_cards = {
    # 第2页：产品概述
    1: [
        {"x": 0.8, "y": 3.0, "w": 3.5, "h": 2.5, "r": 59, "g": 130, "b": 246,
         "title": "目标用户", "desc": "高校在校师生\n覆盖学习、生活、运动、消费全场景"},
        {"x": 4.8, "y": 3.0, "w": 3.5, "h": 2.5, "r": 16, "g": 185, "b": 129,
         "title": "核心价值", "desc": "一站式服务体验\n减少App切换，提升校园生活效率"},
        {"x": 8.8, "y": 3.0, "w": 3.5, "h": 2.5, "r": 245, "g": 158, "b": 11,
         "title": "技术平台", "desc": "uni-app跨平台\n一套代码，多端运行"},
    ],
    # 第3页：功能架构
    2: [
        {"x": 0.8, "y": 1.5, "w": 3.5, "h": 2.0, "r": 59, "g": 130, "b": 246,
         "title": "首页仪表盘", "desc": "课程表预览\n校园公告\n快捷入口"},
        {"x": 4.8, "y": 1.5, "w": 3.5, "h": 2.0, "r": 16, "g": 185, "b": 129,
         "title": "课程中心", "desc": "课表查询\n作业管理\n成绩查询"},
        {"x": 8.8, "y": 1.5, "w": 3.5, "h": 2.0, "r": 245, "g": 158, "b": 11,
         "title": "校园导航", "desc": "地图导航\n建筑搜索\n路线规划"},
        {"x": 0.8, "y": 4.0, "w": 3.5, "h": 2.0, "r": 139, "g": 92, "b": 246,
         "title": "校园跑步", "desc": "GPS记录\n里程统计\n排行榜"},
        {"x": 4.8, "y": 4.0, "w": 3.5, "h": 2.0, "r": 236, "g": 72, "b": 153,
         "title": "文创商城", "desc": "校园周边\n积分兑换\n订单管理"},
        {"x": 8.8, "y": 4.0, "w": 3.5, "h": 2.0, "r": 14, "g": 165, "b": 233,
         "title": "活动中心", "desc": "活动发布\n在线报名\n签到管理"},
    ],
    # 第4页：首页仪表盘
    3: [
        {"x": 0.8, "y": 2.5, "w": 5.5, "h": 2.2, "r": 30, "g": 40, "b": 60,
         "title": "今日课程", "desc": "显示当天课程安排，包含时间、地点、教师信息"},
        {"x": 6.8, "y": 2.5, "w": 5.5, "h": 2.2, "r": 30, "g": 40, "b": 60,
         "title": "校园公告", "desc": "滚动展示最新校园通知\n支持分类筛选和详情查看"},
        {"x": 0.8, "y": 5.2, "w": 3.5, "h": 1.8, "r": 59, "g": 130, "b": 246,
         "title": "快捷入口", "desc": "课程表 | 导航\n跑步 | 商城"},
        {"x": 4.8, "y": 5.2, "w": 3.5, "h": 1.8, "r": 16, "g": 185, "b": 129,
         "title": "个人数据", "desc": "今日步数\n跑步里程"},
        {"x": 8.8, "y": 5.2, "w": 3.5, "h": 1.8, "r": 245, "g": 158, "b": 11,
         "title": "消息提醒", "desc": "作业截止\n活动通知"},
    ],
    # 第5页：校园导航
    4: [
        {"x": 0.8, "y": 2.5, "w": 3.8, "h": 3.5, "r": 59, "g": 130, "b": 246,
         "title": "地图展示", "desc": "校园全景地图\n建筑标注与分类\n缩放与拖拽交互"},
        {"x": 5.0, "y": 2.5, "w": 3.8, "h": 3.5, "r": 16, "g": 185, "b": 129,
         "title": "搜索定位", "desc": "建筑名称搜索\n分类筛选\n一键定位"},
        {"x": 9.2, "y": 2.5, "w": 3.8, "h": 3.5, "r": 245, "g": 158, "b": 11,
         "title": "路线导航", "desc": "起点到终点路线\n步行导航指引\n预计到达时间"},
    ],
    # 第6页：课程中心
    5: [
        {"x": 0.8, "y": 1.5, "w": 5.5, "h": 3.0, "r": 30, "g": 40, "b": 60,
         "title": "课表查询", "desc": "周视图展示完整课程安排\n不同课程颜色区分\n点击查看详情"},
        {"x": 6.8, "y": 1.5, "w": 5.5, "h": 3.0, "r": 30, "g": 40, "b": 60,
         "title": "作业管理", "desc": "教师发布作业，学生查看并标记完成\n支持作业描述、截止日期、附件"},
        {"x": 0.8, "y": 4.8, "w": 5.5, "h": 2.0, "r": 59, "g": 130, "b": 246,
         "title": "成绩查询", "desc": "各学期成绩一览\nGPA统计与分析"},
        {"x": 6.8, "y": 4.8, "w": 5.5, "h": 2.0, "r": 16, "g": 185, "b": 129,
         "title": "选课助手", "desc": "课程推荐\n学分统计"},
    ],
    # 第7页：校园跑步
    6: [
        {"x": 0.8, "y": 2.5, "w": 3.8, "h": 3.5, "r": 139, "g": 92, "b": 246,
         "title": "跑步记录", "desc": "GPS实时轨迹绘制\n配速/时长/里程统计\n跑步历史记录"},
        {"x": 5.0, "y": 2.5, "w": 3.8, "h": 3.5, "r": 59, "g": 130, "b": 246,
         "title": "数据统计", "desc": "日/周/月跑步报告\n里程目标追踪\n运动热量消耗"},
        {"x": 9.2, "y": 2.5, "w": 3.8, "h": 3.5, "r": 245, "g": 158, "b": 11,
         "title": "排行榜", "desc": "校园跑步排行\n好友PK\n成就徽章"},
    ],
    # 第8页：文创商城与活动
    7: [
        {"x": 0.8, "y": 1.5, "w": 5.5, "h": 3.0, "r": 236, "g": 72, "b": 153,
         "title": "文创商城", "desc": "校园特色文创商品\n积分兑换与购买\n订单跟踪与管理"},
        {"x": 6.8, "y": 1.5, "w": 5.5, "h": 3.0, "r": 14, "g": 165, "b": 233,
         "title": "活动中心", "desc": "校园活动发布与展示\n在线报名与签到\n活动评价与分享"},
        {"x": 0.8, "y": 4.8, "w": 5.5, "h": 2.0, "r": 30, "g": 40, "b": 60,
         "title": "商品分类", "desc": "文具 | 周边\n服饰 | 数码"},
        {"x": 6.8, "y": 4.8, "w": 5.5, "h": 2.0, "r": 30, "g": 40, "b": 60,
         "title": "活动类型", "desc": "讲座 | 比赛\n社团 | 志愿"},
    ],
    # 第9页：个人中心
    8: [
        {"x": 0.8, "y": 1.5, "w": 3.8, "h": 3.5, "r": 59, "g": 130, "b": 246,
         "title": "个人信息", "desc": "头像与昵称\n学号/学院/专业\n个人信息编辑"},
        {"x": 5.0, "y": 1.5, "w": 3.8, "h": 3.5, "r": 16, "g": 185, "b": 129,
         "title": "数据统计", "desc": "跑步总里程\n消费记录\n活动参与次数"},
        {"x": 9.2, "y": 1.5, "w": 3.8, "h": 3.5, "r": 245, "g": 158, "b": 11,
         "title": "设置", "desc": "通知设置\n隐私设置\n主题切换"},
        {"x": 0.8, "y": 5.5, "w": 11.5, "h": 1.5, "r": 30, "g": 40, "b": 60,
         "title": "更多功能", "desc": "我的收藏 | 我的订单 | 帮助与反馈 | 关于我们"},
    ],
    # 第10页：技术架构
    9: [
        {"x": 0.8, "y": 1.5, "w": 3.5, "h": 4.5, "r": 59, "g": 130, "b": 246,
         "title": "前端技术", "desc": "uni-app (Vue 3)\n跨平台：iOS / Android / H5\n组件化开发\nPinia 状态管理"},
        {"x": 4.8, "y": 1.5, "w": 3.5, "h": 4.5, "r": 16, "g": 185, "b": 129,
         "title": "后端技术", "desc": "Express.js + MongoDB\nRESTful API\nJWT 认证\nWebSocket 实时推送"},
        {"x": 8.8, "y": 1.5, "w": 3.5, "h": 4.5, "r": 245, "g": 158, "b": 11,
         "title": "核心特性", "desc": "响应式设计\n离线缓存\n消息推送\n数据加密"},
    ],
}

# ==================== XML 模板 ====================

def content_types_xml(n):
    items = [
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
        '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
    ]
    for i in range(1, n + 1):
        items.append(
            f'<Override PartName="/ppt/slides/slide{i}.xml" '
            f'ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        )
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' \
           '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' \
           + '\n'.join(items) + '\n</Types>'


RELS_ROOT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>'''


def presentation_xml(n):
    ids = '\n'.join(
        f'<p:sldId id="{256 + i}" r:id="rId{i + 2}"/>'
        for i in range(n)
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<p:sldMasterIdLst>
<p:sldMasterId id="2147483648" r:id="rId1"/>
</p:sldMasterIdLst>
<p:sldIdLst>
{ids}
</p:sldIdLst>
<p:sldSz cx="12192000" cy="6858000"/>
</p:presentation>'''


def pres_rels_xml(n):
    rels = '\n'.join(
        f'<Relationship Id="rId{i + 2}" '
        f'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" '
        f'Target="slides/slide{i + 1}.xml"/>'
        for i in range(n)
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
{rels}
</Relationships>'''


SLIDE_MASTER = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<p:cSld>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>
</p:spTree>
</p:cSld>
<p:clrMap bg1="dk1" bg2="dk2" tx1="lt1" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hyperlink="hyperlink" followedHyperlink="followedHyperlink"/>
</p:sldMaster>'''

SLIDE_MASTER_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>'''

SLIDE_LAYOUT = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" type="title" preserve="1">
<p:cSld>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>
</p:spTree>
</p:cSld>
</p:sldLayout>'''

SLIDE_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>'''


def _esc(s):
    """转义 XML 特殊字符"""
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def make_card_shape(card, card_id):
    """生成一个卡片形状的 XML"""
    x = int(card["x"] * 914400)  # 英寸转 EMU
    y = int(card["y"] * 914400)
    w = int(card["w"] * 914400)
    h = int(card["h"] * 914400)
    r, g, b = card["r"], card["g"], card["b"]
    color = f"{r:02X}{g:02X}{b:02X}"
    title = _esc(card.get("title", ""))
    desc = _esc(card.get("desc", ""))

    shapes = f'''
<p:sp>
<p:nvSpPr><p:cNvPr id="{card_id}" name="Card{card_id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr>
  <a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>
  <a:prstGeom prst="roundRect"><a:avLst>
    <a:gd name="adj" fmla="val 5000"/>
  </a:avLst></a:prstGeom>
  <a:solidFill><a:srgbClr val="{color}"/></a:solidFill>
  <a:ln w="12700"><a:noFill/></a:ln>
</p:spPr>
<p:txBody>
  <a:bodyPr anchor="t" rtlCol="0"/>
  <a:lstStyle/>
  <a:p><a:pPr algn="l"/><a:r><a:rPr sz="2000" b="1" lang="zh-CN"/><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:t>{title}</a:t></a:r></a:p>'''
    if desc:
        desc_lines = desc.split('\n')
        for line in desc_lines:
            shapes += f'''
  <a:p><a:pPr algn="l"/><a:r><a:rPr sz="1400" lang="zh-CN"/><a:solidFill><a:srgbClr val="DCDCDC"/></a:solidFill><a:t>{line}</a:t></a:r></a:p>'''
    shapes += '''
</p:txBody>
</p:sp>'''
    return shapes


def make_slide_xml(slide, idx):
    title = slide["title"]
    lines = slide["lines"]
    ts = slide["title_size"]
    bs = slide["body_size"]
    is_centered = slide.get("centered", False)

    if is_centered:
        title_x = 1143000
        title_y = 2200000
        title_w = 9906000
        title_h = 1200000
        body_start_y = 3600000
    else:
        title_x = 1143000
        title_y = 914400
        title_w = 9906000
        title_h = 1200000
        body_start_y = 2400000

    shapes = f'''
<p:sp>
<p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="{title_x}" y="{title_y}"/><a:ext cx="{title_w}" cy="{title_h}"/></a:xfrm></p:spPr>
<p:txBody>
<a:bodyPr anchor="ctr" ifInsLine="nil" rtlCol="0"/>
<a:lstStyle/>
<a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="{ts * 100}" b="1" lang="zh-CN"/><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill><a:t>{_esc(title)}</a:t></a:r></a:p>
</p:txBody>
</p:sp>'''

    # 正文行
    for j, line in enumerate(lines):
        if not line:
            continue
        y = body_start_y + j * 750000
        algn = "ctr" if is_centered else "l"
        color = "E0E0E0" if is_centered else "CCCCCC"
        shapes += f'''
<p:sp>
<p:nvSpPr><p:cNvPr id="{20 + j}" name="Body{j}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="{title_x}" y="{y}"/><a:ext cx="{title_w}" cy="650000"/></a:xfrm></p:spPr>
<p:txBody>
<a:bodyPr/>
<a:lstStyle/>
<a:p><a:pPr algn="{algn}"/><a:r><a:rPr sz="{bs * 100}" lang="zh-CN"/><a:solidFill><a:srgbClr val="{color}"/></a:solidFill><a:t>{_esc(line)}</a:t></a:r></a:p>
</p:txBody>
</p:sp>'''

    # 添加卡片（如果有定义）
    if idx in slide_cards:
        for ci, card in enumerate(slide_cards[idx]):
            shapes += make_card_shape(card, 100 + ci)

    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
<p:cSld>
<p:bg><p:bgPr><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill><a:alpha val="100000"/></p:bgPr></p:bg>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>
{shapes}
</p:spTree>
</p:cSld>
<p:transition><p:fade/></p:transition>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>'''


# ==================== 生成 PPTX ====================

def main():
    n = len(slides)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types_xml(n))
        zf.writestr("_rels/.rels", RELS_ROOT)
        zf.writestr("ppt/presentation.xml", presentation_xml(n))
        zf.writestr("ppt/_rels/presentation.xml.rels", pres_rels_xml(n))
        zf.writestr("ppt/slideMasters/slideMaster1.xml", SLIDE_MASTER)
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", SLIDE_MASTER_RELS)
        zf.writestr("ppt/slideLayouts/slideLayout1.xml", SLIDE_LAYOUT)
        for i, slide in enumerate(slides):
            zf.writestr(f"ppt/slides/slide{i + 1}.xml", make_slide_xml(slide, i))
            zf.writestr(f"ppt/slides/_rels/slide{i + 1}.xml.rels", SLIDE_RELS)

    print(f"PPT 生成成功！共 {n} 页幻灯片")
    print(f"文件位置: {OUT}")


if __name__ == "__main__":
    main()
