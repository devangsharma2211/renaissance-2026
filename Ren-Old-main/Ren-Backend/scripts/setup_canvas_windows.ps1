# Helper script to prepare Windows for node-canvas font loading
# Run this PowerShell as Administrator.

function Check-Admin {
  $current = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
  return $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Check-Admin)) {
  Write-Host "This script should be run as Administrator. Right-click PowerShell -> Run as Administrator." -ForegroundColor Yellow
  exit 1
}

$src = Join-Path $PSScriptRoot "..\fonts\Bebas Neue\BebasNeue-Regular.ttf" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $src) {
  Write-Host "Could not find BebasNeue-Regular.ttf in Ren-Backend/fonts/Bebas Neue. Please add the TTF file first." -ForegroundColor Red
  exit 1
}
$src = $src.Path
$dst = "C:\\Windows\\Fonts\\BebasNeue-Regular.ttf"

try {
  Copy-Item -Path $src -Destination $dst -Force
  Write-Host "Copied BebasNeue-Regular.ttf to C:\Windows\Fonts" -ForegroundColor Green
} catch {
  Write-Host "Failed to copy font to system fonts: $($_.Exception.Message)" -ForegroundColor Red
}

# Recommend MSYS2 + pacman install instructions
Write-Host "\nNext steps (recommended to eliminate canvas font warnings):" -ForegroundColor Cyan
Write-Host "1) Install MSYS2 from https://www.msys2.org/ (follow the site instructions)." -ForegroundColor White
Write-Host "2) Open MSYS2 MSYS terminal and run these commands to install native deps:" -ForegroundColor White
Write-Host "   pacman -Syu" -ForegroundColor Gray
Write-Host "   pacman -S --needed mingw-w64-x86_64-toolchain mingw-w64-x86_64-cairo mingw-w64-x86_64-pango mingw-w64-x86_64-fontconfig mingw-w64-x86_64-freetype" -ForegroundColor Gray
Write-Host "3) Ensure your PATH includes MSYS2\mingw64\bin (or use MSYS2 shell to run your Node app)." -ForegroundColor White
Write-Host "4) Restart backend (npm run dev) and re-generate a sample ticket to see if font warnings disappear." -ForegroundColor White

Write-Host "If you'd like, run 'node scripts/test_generate_outsider_ticket.js' after following above steps, then paste the output here and I'll verify." -ForegroundColor Cyan
