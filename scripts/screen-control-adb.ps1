<#
.SYNOPSIS
    Xiaomi Pad 5 ワイヤレスADB画面ON/OFF＆自動起動PowerShellスクリプト
.DESCRIPTION
    引数 -Action on または -Action off を受け取り、
    ワイヤレスADB (WiFi経由) を使って画面を点灯/消灯させます。
    Action on の場合は、画面点灯に加えてロック解除および Fully Kiosk Browser の最前面起動まで自動で行います。
    Fully Kiosk Browser の有料ライセンス（Remote Admin）は一切不要（完全無料・透かしなし）です。
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\screen-control-adb.ps1 -Action on
    powershell -ExecutionPolicy Bypass -File .\screen-control-adb.ps1 -Action off
#>

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("on", "off")]
    [string]$Action,

    [string]$TabletIp = ""
)

# 1. 引数が空の場合は .env.local から自動読み込みを試みる
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$EnvFile = Join-Path $ScriptDir "..\.env.local"

if ((Test-Path $EnvFile) -and (-not $TabletIp)) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -notmatch "^#" -and $line -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim().Trim('"').Trim("'")
            if (($key -eq "FULLY_KIOSK_IP" -or $key -eq "FULLY_KIOSK_HOST" -or $key -eq "TABLET_IP") -and -not $TabletIp) { 
                $TabletIp = $val 
            }
        }
    }
}

# 2. パラメータ検証
if (-not $TabletIp -or $TabletIp -like "*xxx*") {
    Write-Host "[ERROR] タブレットのIPアドレスが設定されていません。" -ForegroundColor Red
    Write-Host ".env.local (FULLY_KIOSK_IP) または引数 -TabletIp で指定してください。"
    exit 1
}

# 3. adb コマンドの存在確認 (PATH、または scripts\platform-tools)
$adbCmd = "adb"
if (-not (Get-Command "adb" -ErrorAction SilentlyContinue)) {
    $localAdb = Join-Path $ScriptDir "platform-tools\adb.exe"
    if (Test-Path $localAdb) {
        $adbCmd = $localAdb
    } else {
        Write-Host "[ERROR] adb コマンドが見つかりません。" -ForegroundColor Red
        Write-Host "Google公式の platform-tools をダウンロードして PATH を通すか、scripts\platform-tools フォルダに配置してください。"
        exit 1
    }
}

# 4. タブレットへワイヤレス接続
& $adbCmd connect "${TabletIp}:5555" | Out-Null

if ($Action -eq "on") {
    Write-Host "[INFO] 画面ON & Fully Kiosk Browser 起動中..." -ForegroundColor Cyan
    # 画面点灯 (スリープ解除)
    & $adbCmd -s "${TabletIp}:5555" shell input keyevent KEYCODE_WAKEUP
    # ロック画面（キーガード）解除
    & $adbCmd -s "${TabletIp}:5555" shell wm dismiss-keyguard
    # Fully Kiosk Browser を起動 & 最前面化 (パッケージ名: de.ozerov.fully)
    & $adbCmd -s "${TabletIp}:5555" shell am start -n de.ozerov.fully/.MainActivity | Out-Null
    Write-Host "[SUCCESS] 画面点灯 & Fully Kiosk Browser 表示完了!" -ForegroundColor Green
} else {
    Write-Host "[INFO] 画面OFF (スリープ移行中)..." -ForegroundColor Cyan
    # 画面消灯 (スリープ)
    & $adbCmd -s "${TabletIp}:5555" shell input keyevent KEYCODE_SLEEP
    Write-Host "[SUCCESS] 画面消灯完了!" -ForegroundColor Green
}
