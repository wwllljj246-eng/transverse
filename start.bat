@echo off
chcp 65001 >nul
title 译境 TransVerse Dev Server
cd /d "%~dp0"
echo ========================================
echo   译境 TransVerse - 本地开发服务器
echo   http://localhost:8137/
echo   按 Ctrl+C 停止
echo ========================================
start "" http://localhost:8137/
python -m http.server 8137
