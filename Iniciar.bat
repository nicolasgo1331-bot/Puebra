@echo off
chcp 65001 >nul
title Fragance MP - Agentes
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto sinnode
echo.
echo  Iniciando Fragance MP... El navegador se abre solo en unos segundos.
echo  NO CIERRES ESTA VENTANA mientras quieras que el sistema trabaje.
echo.
start "" cmd /c "timeout /t 3 >nul & start http://localhost:3000"
node src\server.js
echo.
echo  El sistema se detuvo. Cerra esta ventana o apreta una tecla para salir.
pause >nul
exit /b
:sinnode
echo.
echo  Falta instalar Node.js (es gratis). Se abre la pagina de descarga:
echo  baja el boton verde LTS, instalalo con "Siguiente" y despues
echo  volve a hacer doble clic en este archivo.
echo.
start https://nodejs.org
pause >nul
