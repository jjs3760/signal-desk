$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$python = (Resolve-Path (Join-Path $root '.venv/Scripts/pythonw.exe')).Path
$action = New-ScheduledTaskAction -Execute $python -Argument '"backend/pipeline.py" --morning --request-deployment' -WorkingDirectory $root
$trigger = New-ScheduledTaskTrigger -Daily -At '08:00'
# An explicit UTC offset keeps the trigger aligned with Seoul across time zones.
$trigger.StartBoundary = [DateTimeOffset]::Now.ToOffset([TimeSpan]::FromHours(9)).ToString('yyyy-MM-dd') + 'T08:00:00+09:00'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 5)
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName 'SignalDesk-MorningBrief' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
