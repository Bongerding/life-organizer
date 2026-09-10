# Resize the approved mascot render into the app's install and maskable icons.
Add-Type -AssemblyName System.Drawing
$source = [System.Drawing.Image]::FromFile((Join-Path $PSScriptRoot '../assets/icons/lumen-fractal.png'))
try {
  foreach ($spec in @(@('lumen-ball-192.png',192,1.0), @('lumen-ball-512.png',512,1.0), @('lumen-ball-apple.png',180,1.0), @('lumen-ball-maskable-192.png',192,0.78), @('lumen-ball-maskable-512.png',512,0.78))) {
    $size = [int]$spec[1]
    $bitmap = New-Object System.Drawing.Bitmap($size,$size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.Color]::FromArgb(12,12,14))
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $drawSize = [int]($size * $spec[2])
      $offset = [int](($size - $drawSize) / 2)
      $graphics.DrawImage($source,$offset,$offset,$drawSize,$drawSize)
      $bitmap.Save((Join-Path $PSScriptRoot ('../assets/icons/' + $spec[0])),[System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
  }
} finally { $source.Dispose() }
