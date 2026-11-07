@echo off
chcp 65001 >nul
title 译境 TransVerse API Server
cd /d "%~dp0"
if not exist node_modules (
  echo 首次运行，正在安装依赖...
  call npm install
)
echo ========================================
echo   译境 TransVerse - 后端(含翻译API)
echo   http://localhost:8137/
echo   密钥配置: 根目录 .env 文件
echo   按 Ctrl+C 停止
echo ========================================
start "" http://localhost:8137/
node server.js
