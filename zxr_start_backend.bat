@echo off
REM 姓名：Zouxinru | 学号：24002120217
REM 时间：2026-11-20 | 大模型：GLM-5.3-Flash
REM 说明：启动后端服务（端口 8217）
chcp 65001 >nul
cd /d "%~dp0backend"
echo Starting backend at http://localhost:8217 ...
node server.js
pause
