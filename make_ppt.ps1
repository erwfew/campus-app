# 校园综合服务产品演示 PPT 生成脚本 (PowerShell)
# 无需第三方库，仅使用 .NET 类生成 .pptx 文件

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $scriptDir "校园综合服务-产品演示.pptx"

# 加载 System.IO.Compression
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# 幻灯片内容
$slides = @(
    @{Title="校园综合服务"; Lines=@("一个 App，搞定你的校园日常"); TitleSize=52; BodySize=28; Centered=$true},
    @{Title="产品概述"; Lines=@("为什么需要校园综合服务？","","痛点：课表、导航、跑步、商城分散多个 App","方案：一站式校园生活服务平台","目标用户：全体在校大学生","核心价值：便捷、统一、智能化"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="功能架构"; Lines=@("六大核心模块","","首页仪表盘  |  校园导航  |  课程中心","校园跑步    |  文创商城  |  个人中心"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="首页仪表盘"; Lines=@("虚拟伙伴小喵 — 你的校园 AI 助手","今日课程实时状态卡片","校园公告推送 + 快捷入口","天气、时间、待办事项一目了然"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="校园导航"; Lines=@("GPS 精准定位，覆盖全校建筑","智能路线规划，支持驾车/步行/骑行","3D 实时导航，转弯提示语音播报","校园 POI 搜索，一键导航到目的地"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="课程中心"; Lines=@("三种课表视图：周视图 / 列表 / 时间线","灵活配置：周数、上课时间、教室自定义","作业通知 + 出勤统计","支持从教务系统一键导入课表"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="校园跑步"; Lines=@("GPS 实时轨迹绘制，运动路线可视化","实时数据面板：距离、配速、卡路里","智能历史记录，支持目标设定","优雅降级：室内也能记录运动数据"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="文创商城"; Lines=@("校园文创商品在线选购","分类筛选 + 搜索 + 购物车","热门校园活动在线报名","校园社区互动分享"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="个人中心"; Lines=@("每日签到系统 + 积分奖励","多维排行榜：跑步、签到、消费","成就徽章系统，记录校园成长","学信网实名认证 + 校园卡绑定"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="技术架构"; Lines=@("前端：uni-app (Vue 2) — 一套代码，多端运行","地图：腾讯地图 SDK — 定位 + 导航 + 搜索","后端：Express.js + MongoDB — RESTful API","数据：localStorage 本地持久化 + 云端同步"); TitleSize=44; BodySize=24; Centered=$false},
    @{Title="谢谢"; Lines=@("校园综合服务","你的校园生活，一个 App 搞定"); TitleSize=52; BodySize=28; Centered=$true}
)

function Escape-Xml($s) {
    return $s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;'
}

$n = $slides.Count
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "pptx_$([System.Guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # [Content_Types].xml
    $ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + "`n"
    $ct += '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' + "`n"
    $ct += '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' + "`n"
    $ct += '<Default Extension="xml" ContentType="application/xml"/>' + "`n"
    $ct += '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>' + "`n"
    $ct += '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>' + "`n"
    $ct += '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>' + "`n"
    for ($i = 1; $i -le $n; $i++) {
        $ct += "<Override PartName=""/ppt/slides/slide$i.xml"" ContentType=""application/vnd.openxmlformats-officedocument.presentationml.slide+xml""/>" + "`n"
    }
    $ct += '</Types>'
    $ct | Out-File -FilePath (Join-Path $tempDir "[Content_Types].xml") -Encoding UTF8

    # _rels/.rels
    New-Item -ItemType Directory -Path (Join-Path $tempDir "_rels") -Force | Out-Null
    @('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>',
      '</Relationships>') -join "`n" | Out-File -FilePath (Join-Path $tempDir "_rels\.rels") -Encoding UTF8

    # ppt/presentation.xml
    New-Item -ItemType Directory -Path (Join-Path $tempDir "ppt") -Force | Out-Null
    $pres = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + "`n"
    $pres += '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' + "`n"
    $pres += '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>' + "`n"
    $pres += '<p:sldIdLst>' + "`n"
    for ($i = 0; $i -lt $n; $i++) {
        $pres += "<p:sldId id=""$(256 + $i)"" r:id=""rId$($i + 2)""/>" + "`n"
    }
    $pres += '</p:sldIdLst>' + "`n"
    $pres += '<p:sldSz cx="12192000" cy="6858000"/>' + "`n"
    $pres += '</p:presentation>'
    $pres | Out-File -FilePath (Join-Path $tempDir "ppt\presentation.xml") -Encoding UTF8

    # ppt/_rels/presentation.xml.rels
    New-Item -ItemType Directory -Path (Join-Path $tempDir "ppt\_rels") -Force | Out-Null
    $presRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + "`n"
    $presRels += '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + "`n"
    $presRels += '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>' + "`n"
    for ($i = 0; $i -lt $n; $i++) {
        $presRels += "<Relationship Id=""rId$($i + 2)"" Type=""http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide"" Target=""slides/slide$($i + 1).xml""/>" + "`n"
    }
    $presRels += '</Relationships>'
    $presRels | Out-File -FilePath (Join-Path $tempDir "ppt\_rels\presentation.xml.rels") -Encoding UTF8

    # ppt/slideMasters/slideMaster1.xml
    New-Item -ItemType Directory -Path (Join-Path $tempDir "ppt\slideMasters") -Force | Out-Null
    @('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">',
      '<p:cSld><p:spTree>',
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvSpPr/><p:nvPr/></p:nvGrpSpPr>',
      '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>',
      '</p:spTree></p:cSld>',
      '<p:clrMap bg1="dk1" bg2="dk2" tx1="lt1" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hyperlink="hyperlink" followedHyperlink="followedHyperlink"/>',
      '</p:sldMaster>') -join "`n" | Out-File -FilePath (Join-Path $tempDir "ppt\slideMasters\slideMaster1.xml") -Encoding UTF8

    # ppt/slideMasters/_rels/slideMaster1.xml.rels
    New-Item -ItemType Directory -Path (Join-Path $tempDir "ppt\slideMasters\_rels") -Force | Out-Null
    @('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
      '</Relationships>') -join "`n" | Out-File -FilePath (Join-Path $tempDir "ppt\slideMasters\_rels\slideMaster1.xml.rels") -Encoding UTF8

    # ppt/slideLayouts/slideLayout1.xml
    New-Item -ItemType Directory -Path (Join-Path $tempDir "ppt\slideLayouts") -Force | Out-Null
    @('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" type="title" preserve="1">',
      '<p:cSld><p:spTree>',
      '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvSpPr/><p:nvPr/></p:nvGrpSpPr>',
      '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>',
      '</p:spTree></p:cSld>',
      '</p:sldLayout>') -join "`n" | Out-File -FilePath (Join-Path $tempDir "ppt\slideLayouts\slideLayout1.xml") -Encoding UTF8

    # Slides
    New-Item -ItemType Directory -Path (Join-Path $tempDir "ppt\slides") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $tempDir "ppt\slides\_rels") -Force | Out-Null

    for ($i = 0; $i -lt $n; $i++) {
        $slide = $slides[$i]
        $idx = $i + 1
        $isCentered = $slide.Centered

        if ($isCentered) {
            $titleY = 2200000
            $bodyStartY = 3600000
        } else {
            $titleY = 914400
            $bodyStartY = 2400000
        }

        $slideXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + "`n"
        $slideXml += '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">' + "`n"
        $slideXml += '<p:cSld>' + "`n"
        $slideXml += '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="0A0A1A"/></a:solidFill><a:alpha val="100000"/></p:bgPr></p:bg>' + "`n"
        $slideXml += '<p:spTree>' + "`n"
        $slideXml += '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvSpPr/><p:nvPr/></p:nvGrpSpPr>' + "`n"
        $slideXml += '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm></p:grpSpPr>' + "`n"

        # Title
        $slideXml += '<p:sp>' + "`n"
        $slideXml += '<p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>' + "`n"
        $slideXml += "<p:spPr><a:xfrm><a:off x=""1143000"" y=""$titleY""/><a:ext cx=""9906000"" cy=""1200000""/></a:xfrm></p:spPr>" + "`n"
        $slideXml += '<p:txBody>' + "`n"
        $slideXml += '<a:bodyPr anchor="ctr" ifInsLine="nil" rtlCol="0"/>' + "`n"
        $slideXml += '<a:lstStyle/>' + "`n"
        $slideXml += "<a:p><a:pPr algn=""ctr""/><a:r><a:rPr sz=""$($slide.TitleSize * 100)"" b=""1"" lang=""zh-CN""/><a:solidFill><a:srgbClr val=""FFFFFF""/></a:solidFill><a:t>$(Escape-Xml $slide.Title)</a:t></a:r></a:p>" + "`n"
        $slideXml += '</p:txBody>' + "`n"
        $slideXml += '</p:sp>' + "`n"

        # Body lines
        $j = 0
        foreach ($line in $slide.Lines) {
            if ([string]::IsNullOrWhiteSpace($line)) { $j++; continue }
            $y = $bodyStartY + $j * 750000
            $algn = if ($isCentered) { "ctr" } else { "l" }
            $color = if ($isCentered) { "E0E0E0" } else { "CCCCCC" }
            $shapeId = 20 + $j

            $slideXml += '<p:sp>' + "`n"
            $slideXml += "<p:nvSpPr><p:cNvPr id=""$shapeId"" name=""Body$j""/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>" + "`n"
            $slideXml += "<p:spPr><a:xfrm><a:off x=""1143000"" y=""$y""/><a:ext cx=""9906000"" cy=""650000""/></a:xfrm></p:spPr>" + "`n"
            $slideXml += '<p:txBody>' + "`n"
            $slideXml += '<a:bodyPr/>' + "`n"
            $slideXml += '<a:lstStyle/>' + "`n"
            $slideXml += "<a:p><a:pPr algn=""$algn""/><a:r><a:rPr sz=""$($slide.BodySize * 100)"" lang=""zh-CN""/><a:solidFill><a:srgbClr val=""$color""/></a:solidFill><a:t>$(Escape-Xml $line)</a:t></a:r></a:p>" + "`n"
            $slideXml += '</p:txBody>' + "`n"
            $slideXml += '</p:sp>' + "`n"
            $j++
        }

        $slideXml += '</p:spTree>' + "`n"
        $slideXml += '</p:cSld>' + "`n"
        $slideXml += '<p:transition><p:fade/></p:transition>' + "`n"
        $slideXml += '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>' + "`n"
        $slideXml += '</p:sld>'

        $slideXml | Out-File -FilePath (Join-Path $tempDir "ppt\slides\slide$idx.xml") -Encoding UTF8

        # Slide rels
        @('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
          '</Relationships>') -join "`n" | Out-File -FilePath (Join-Path $tempDir "ppt\slides\_rels\slide$idx.xml.rels") -Encoding UTF8
    }

    # Create ZIP (PPTX)
    if (Test-Path $outputPath) { Remove-Item $outputPath -Force }
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $outputPath)

    Write-Host "PPT 生成成功！共 $n 页幻灯片"
    Write-Host "文件位置: $outputPath"
}
finally {
    # Cleanup temp directory
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
}
