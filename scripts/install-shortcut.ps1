$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$icon = Join-Path $root 'zamzam.ico'
$photo = Join-Path $root 'zamzam car wash.png'
$launcher = Join-Path $root 'start.bat'

Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 64, 64
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.Clear([System.Drawing.Color]::FromArgb(255, 8, 40, 51))
if (Test-Path -LiteralPath $photo) {
  $image = [System.Drawing.Image]::FromFile($photo)
  $graphics.DrawImage($image, 0, 0, 64, 64)
  $image.Dispose()
}
$graphics.Dispose()

$pngStream = New-Object System.IO.MemoryStream
$bmp.Save($pngStream, [System.Drawing.Imaging.ImageFormat]::Png)
$png = $pngStream.ToArray()
$pngStream.Dispose()
$bmp.Dispose()

$file = [System.IO.File]::Create($icon)
$writer = New-Object System.IO.BinaryWriter($file)
$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]1)
$writer.Write([byte]64)
$writer.Write([byte]64)
$writer.Write([byte]0)
$writer.Write([byte]0)
$writer.Write([uint16]1)
$writer.Write([uint16]32)
$writer.Write([uint32]$png.Length)
$writer.Write([uint32]22)
$writer.Write($png)
$writer.Flush()
$writer.Dispose()
$file.Dispose()

$shell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'ZAMZAM Carwash.lnk'
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $launcher
$shortcut.WorkingDirectory = $root
$shortcut.WindowStyle = 1
$shortcut.Description = 'ZAMZAM Carwash'
$shortcut.IconLocation = $icon
$shortcut.Save()

Write-Output $shortcutPath
