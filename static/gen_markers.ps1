# PowerShell 脚本：生成校园地图标记图标
# 使用方法：在 static 目录下运行 .\gen_markers.ps1

Add-Type -AssemblyName System.Drawing

function New-MarkerPNG {
    param(
        [string]$FileName,
        [int]$R, [int]$G, [int]$B,
        [int]$Size = 64
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $cx = [int]($Size / 2)
    $cyTop = [int]($Size / 3)
    $radius = [int]($Size / 3)

    for ($y = 0; $y -lt $Size; $y++) {
        for ($x = 0; $x -lt $Size; $x++) {
            $dx = $x - $cx
            $dy = $y - $cyTop
            $dist = [Math]::Sqrt($dx*$dx + $dy*$dy)

            # 尾部（水滴形状）
            $inTail = $false
            if ($y -gt ($cyTop + [int]($radius/2))) {
                $tailWidth = [Math]::Max(0, [int]($radius * 0.6 - ($y - $cyTop - $radius/2) * 0.8))
                if ([Math]::Abs($dx) -le $tailWidth) { $inTail = $true }
            }

            if ($dist -le $radius -or $inTail) {
                $innerR = $radius * 0.35
                if ($dist -gt ($radius - 2) -and $dist -le $radius -and -not $inTail) {
                    # 白色边框
                    $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
                } elseif ($inTail -and $dist -gt ($radius - 2)) {
                    $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
                } elseif ([Math]::Sqrt($dx*$dx + $dy*$dy) -le $innerR) {
                    # 白色中心
                    $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
                } else {
                    # 彩色填充
                    $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $R, $G, $B))
                }
            } else {
                # 透明
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }

    $bmp.Save($FileName, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated $FileName"
}

# 生成各类标记图标
New-MarkerPNG "marker-teach.png" 66 165 245
New-MarkerPNG "marker-library.png" 126 87 194
New-MarkerPNG "marker-food.png" 239 83 80
New-MarkerPNG "marker-dorm.png" 255 152 0
New-MarkerPNG "marker-playground.png" 102 187 106
New-MarkerPNG "marker-gym.png" 171 71 188
New-MarkerPNG "marker-lab.png" 38 166 154
New-MarkerPNG "marker-admin.png" 92 107 192
New-MarkerPNG "marker-activity.png" 255 112 154

# 生成"我的位置"蓝色标记
$bmp = New-Object System.Drawing.Bitmap(64, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt 64; $y++) {
    for ($x = 0; $x -lt 64; $x++) {
        $dx = $x - 32
        $dy = $y - 32
        $dist = [Math]::Sqrt($dx*$dx + $dy*$dy)
        if ($dist -le 8) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        } elseif ($dist -le 10) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 67, 97, 238))
        } elseif ($dist -le 18) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(200, 67, 97, 238))
        } elseif ($dist -le 20) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(150, 123, 140, 255))
        } else {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}
$bmp.Save("marker-mylocation.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Generated marker-mylocation.png"
Write-Host "Done! All marker icons generated."
