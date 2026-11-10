#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Falta instalar Node.js (gratis). Se abre la pagina de descarga: baja la version LTS, instalala y volve a abrir este archivo."
  open https://nodejs.org; read -n 1 -s -r -p "Presiona una tecla..."; exit 1
fi
echo "Iniciando Fragance MP... NO cierres esta ventana mientras quieras que el sistema trabaje."
( sleep 3; open http://localhost:3000 ) &
node src/server.js
