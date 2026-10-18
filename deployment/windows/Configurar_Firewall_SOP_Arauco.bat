@echo off
net session >nul 2>&1
if not %errorlevel%==0 (
  echo Ejecute este archivo como administrador.
  pause
  exit /b 1
)
netsh advfirewall firewall add rule name="SOP Arauco - Red corporativa" dir=in action=allow protocol=TCP localport=8090 profile=domain,private
echo Regla de firewall creada para TCP 8090 en perfiles Dominio y Privado.
pause
