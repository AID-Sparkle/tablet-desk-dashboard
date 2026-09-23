<#
.SYNOPSIS
    Xiaomi Pad 5 (Fully Kiosk Browser) の画面ON/OFF制御PowerShellスクリプト
.DESCRIPTION
    引数 -Action on または -Action off を受け取り、
    Fully Kiosk Browser の REST API (ポート 2323) を叩いて画面を点灯/消灯させます。
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\screen-control.ps1 -Action on
    powershell -ExecutionPolicy Bypass -File .\screen-control.ps1 -Action off
#>

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("on", "off")]
    [string]$Action,

    [string]$TabletIp = "",
    [string]$Password = ""
)

# 1. 引数が空の場合は .env.local から自動読み込みを試みる
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$EnvFile = Join-Path $ScriptDir "..\.env.local"

if ((Test-Path $EnvFile) -and (-not $TabletIp -or -not $Password)) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -notmatch "^#" -and $line -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"').Trim("'")
            if (($key -eq "FULLY_KIOSK_IP" -or $key -eq "FULLY_KIOSK_HOST") -and -not $TabletIp) { $TabletIp = $val }
            if ($key -eq "FULLY_KIOSK_PASSWORD" -and -not $Password) { $Password = $val }
        }
    }
}

# 2. パラメータ検証
if (-not $TabletIp -or $TabletIp -like "*xxx*") {
    Write-Host "[ERROR] タブレットのIPアドレス (FULLY_KIOSK_IP) が設定されていません。" -ForegroundColor Red
    Write-Host ".env.local または引数 -TabletIp で指定してください。"
    exit 1
}

$cmd = if ($Action -eq "on") { "screenOn" } else { "screenOff" }
$url = "http://${TabletIp}:2323/?cmd=${cmd}&password=${Password}"

Write-Host "[INFO] Fully Kiosk API 呼び出し中: Action = $Action ($url)" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 5
    Write-Host "[SUCCESS] 画面 ${Action} 成功!" -ForegroundColor Green
} catch {
    Write-Host "[WARN] 画面 ${Action} の送信に失敗しました: $($_.Exception.Message)" -ForegroundColor Yellow
}
