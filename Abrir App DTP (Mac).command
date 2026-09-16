#!/bin/bash
# ───────────────────────────────────────────
#  Lanzador de la App DTP — Mac
#  Haz doble clic para abrir la aplicación
# ───────────────────────────────────────────

# Ir a la carpeta donde está este script
cd "$(dirname "$0")"

# Comprobar si Python 3 está instalado
if ! command -v python3 &> /dev/null; then
    osascript -e 'display alert "Python 3 no encontrado" message "Instala Python 3 desde https://www.python.org y vuelve a intentarlo." as critical'
    exit 1
fi

# Buscar un puerto libre (8090, 8091, 8092...)
PORT=8090
while lsof -i:$PORT &>/dev/null; do
    PORT=$((PORT+1))
done

# Arrancar el servidor en segundo plano
python3 -m http.server $PORT &>/dev/null &
SERVER_PID=$!

# Esperar un momento a que arranque
sleep 1

# Abrir el navegador
open "http://localhost:$PORT/index.html"

# Mostrar notificación
osascript -e "display notification \"App DTP abierta en http://localhost:$PORT\" with title \"🎲 DTP Calculadora\" sound name \"Glass\""

# Esperar a que el usuario cierre (el servidor se para al cerrar el terminal)
echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   🎲 App DTP — Servidor Activo        ║"
echo "  ║   http://localhost:$PORT/index.html   ║"
echo "  ║                                      ║"
echo "  ║   Cierra esta ventana para parar.    ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Mantener el servidor vivo hasta que el usuario cierre la ventana
wait $SERVER_PID
