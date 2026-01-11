#!/bin/bash
# PostgreSQL Database Restore Script
# Stellt Backup wieder her

BACKUP_DIR="/var/backups/postgresql"
DB_NAME="bereifung24"
DB_USER="bereifung24user"

# Zeige verfügbare Backups
echo "Verfügbare Backups:"
echo "-------------------"
ls -lh "$BACKUP_DIR"/bereifung24_*.sql.gz | awk '{print NR": "$9" ("$5")"}'
echo ""

# Wenn Parameter übergeben wurde, verwende diesen
if [ -n "$1" ]; then
    BACKUP_FILE="$1"
else
    # Sonst frage nach
    read -p "Backup-Nummer (oder vollständiger Pfad): " SELECTION
    
    if [[ "$SELECTION" =~ ^[0-9]+$ ]]; then
        # Nummer ausgewählt
        BACKUP_FILE=$(ls -1 "$BACKUP_DIR"/bereifung24_*.sql.gz | sed -n "${SELECTION}p")
    else
        # Pfad angegeben
        BACKUP_FILE="$SELECTION"
    fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "FEHLER: Backup-Datei nicht gefunden: $BACKUP_FILE"
    exit 1
fi

echo ""
echo "WARNUNG: Dies wird die aktuelle Datenbank überschreiben!"
echo "Backup: $BACKUP_FILE"
read -p "Fortfahren? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Abgebrochen."
    exit 0
fi

# Backup der aktuellen Datenbank (Sicherheitsnetz)
echo "Erstelle Sicherheitsbackup der aktuellen DB..."
SAFETY_BACKUP="$BACKUP_DIR/bereifung24_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
PGPASSWORD='Bereif24Secure2025' pg_dump -U "$DB_USER" -h localhost "$DB_NAME" | gzip > "$SAFETY_BACKUP"
echo "Sicherheitsbackup: $SAFETY_BACKUP"

# Restore durchführen
echo "Restore wird durchgeführt..."
gunzip -c "$BACKUP_FILE" | PGPASSWORD='Bereif24Secure2025' psql -U "$DB_USER" -h localhost "$DB_NAME" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Restore erfolgreich!"
    echo "Prisma Client wird neu generiert..."
    cd /var/www/bereifung24 && npx prisma generate
    echo "PM2 wird neu gestartet..."
    pm2 restart bereifung24
    echo "Fertig!"
else
    echo "❌ FEHLER beim Restore!"
    echo "Die Original-Datenbank ist noch im Sicherheitsbackup: $SAFETY_BACKUP"
    exit 1
fi
