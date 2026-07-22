@echo off
cd /d "%~dp0"
echo Descargando cambios desde GitHub a tu disco duro...
git pull
echo.
echo ========================================
echo ¡Archivos actualizados correctamente en tu PC!
echo ========================================
pause
