@echo off
chcp 65001 > nul
echo ========================================================
echo  Xiaomi Pad 5 ワイヤレスADB PC連動タスク登録スクリプト
echo  (完全無料・透かしなし・ブラウザ自動起動対応)
echo ========================================================
echo.

set SCRIPT_PATH=%~dp0screen-control-adb.ps1

echo 1. PCログオン時に画面点灯＆ブラウザ起動タスクを登録中...
schtasks /create /tn "DeskDashboard_ADB_ScreenOn_Logon" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%SCRIPT_PATH%\" -Action on" /sc onlogon /f

echo.
echo 2. PCロック解除時に画面点灯＆ブラウザ起動タスクを登録中 (イベントID: 4801)...
schtasks /create /tn "DeskDashboard_ADB_ScreenOn_Unlock" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%SCRIPT_PATH%\" -Action on" /sc onevent /mo "*[System[Provider[@Name='Microsoft-Windows-Security-Auditing'] and EventID=4801]]" /ec Security /f

echo.
echo 3. PCロック時に画面消灯タスクを登録中 (イベントID: 4800)...
schtasks /create /tn "DeskDashboard_ADB_ScreenOff_Lock" /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%SCRIPT_PATH%\" -Action off" /sc onevent /mo "*[System[Provider[@Name='Microsoft-Windows-Security-Auditing'] and EventID=4800]]" /ec Security /f

echo.
echo ========================================================
echo  登録が完了しました！
echo  ※タスクを削除したい場合は以下のコマンドを実行してください:
echo  schtasks /delete /tn "DeskDashboard_ADB_ScreenOn_Logon" /f
echo  schtasks /delete /tn "DeskDashboard_ADB_ScreenOn_Unlock" /f
echo  schtasks /delete /tn "DeskDashboard_ADB_ScreenOff_Lock" /f
echo ========================================================
pause
