#!/bin/bash
# PostgreSQL Database Backup Script
# Automatisches Backup mit Rotation (hält die letzten 7 Tage + monatliche Backups)

# Konfiguration
DB_NAME="bereifung24"
DB_USER="bereifung24user"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bereifung24_$DATE.sql.gz"
LOG_FILE="/var/log/db-backup.log"

# Backup-Verzeichnis erstellen
mkdir -p "$BACKUP_DIR"

# Backup durchführen
echo "[$(date)] Starting backup..." >> "$LOG_FILE"
PGPASSWORD='Bereif24Secure2025' pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] Backup erfolgreich: $BACKUP_FILE ($SIZE)" >> "$LOG_FILE"
    
    # Alte Backups löschen (älter als 7 Tage, außer monatliche)
    # Behalte alle Backups vom 1. des Monats
    find "$BACKUP_DIR" -name "bereifung24_*.sql.gz" -type f -mtime +7 ! -name "*_01_*" -delete
    
    # Statistik
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/bereifung24_*.sql.gz | wc -l)
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    echo "[$(date)] Anzahl Backups: $BACKUP_COUNT, Gesamtgröße: $TOTAL_SIZE" >> "$LOG_FILE"
else
    echo "[$(date)] FEHLER: Backup fehlgeschlagen!" >> "$LOG_FILE"
    exit 1
fi

# Optional: Upload zu Cloud Storage (z.B. Hetzner Storage Box)
# rsync -avz "$BACKUP_FILE" user@your-storagebox.de:backups/

echo "[$(date)] Backup abgeschlossen" >> "$LOG_FILE"
