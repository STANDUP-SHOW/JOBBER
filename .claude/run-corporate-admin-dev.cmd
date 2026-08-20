@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0..\corporate-admin"
call npm run dev -- -p 3002
