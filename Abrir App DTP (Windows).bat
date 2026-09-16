@echo off
REM ───────────────────────────────────────────
REM  Lanzador de la App DTP — Windows
REM  Haz doble clic para abrir la aplicación
REM ───────────────────────────────────────────

title 🎲 App DTP — Servidor Activo

REM Ir a la carpeta donde está este script
cd /d "%~dp0"

REM Comprobar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo Python no encontrado.
    echo.
    echo Instala Python 3 desde https://www.python.org
    echo Asegurate de marcar "Add Python to PATH" durante la instalacion.
    echo.
    pause
    exit /b
)

REM Buscar puerto libre empezando por 8090
set PORT=8090
:find_port
netstat -an | find ":%PORT% " >nul 2>&1
if not errorlevel 1 (
    set /a PORT=%PORT%+1
    goto find_port
)

REM Arrancar servidor en segundo plano
echo.
echo  ===========================================
echo   Iniciando servidor DTP en puerto %PORT%...
echo  ===========================================
echo.
start /b python -m http.server %PORT%

REM Esperar un momento
timeout /t 2 /nobreak >nul

REM Abrir el navegador
start "" "http://localhost:%PORT%/index.html"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║   🎲  App DTP — Servidor Activo           ║
echo  ║   http://localhost:%PORT%/index.html      ║
echo  ║                                          ║
echo  ║   NO cierres esta ventana mientras       ║
echo  ║   uses la app. Ciérrala cuando termines. ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
