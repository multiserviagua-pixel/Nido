#!/bin/bash
# Espera a que el equipo tenga al menos $1 MB de RAM libre (4000 por defecto).
# Se usa antes de la suite completa, el build o Playwright, junto con el candado
# de suite (regla A). Sale con 0 cuando hay memoria; con 1 si tras 2 horas no la hay.
minimo=${1:-4000}
fin=$(( $(date +%s) + 7200 ))
while true; do
  libre=$(powershell -NoProfile -Command '[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)' | tr -d '\r')
  if [ -n "$libre" ] && [ "$libre" -ge "$minimo" ]; then
    echo "memoria libre: $libre MB"
    exit 0
  fi
  if [ "$(date +%s)" -ge "$fin" ]; then
    echo "sin memoria suficiente tras 2 horas: $libre MB libres"
    exit 1
  fi
  sleep 60
done
