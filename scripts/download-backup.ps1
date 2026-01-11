# PowerShell Script: Backup von Server herunterladen
# Verwendung: .\download-backup.ps1 [backup-datei]

param(
    [string]$BackupFile = ""
)

$SERVER = "root@bereifung24.de"
$SSH_KEY = "$env:USERPROFILE\.ssh\bereifung24_hetzner"
$BACKUP_DIR = "/var/backups/postgresql"
$LOCAL_BACKUP_DIR = ".\backups"

# Lokales Backup-Verzeichnis erstellen
if (!(Test-Path $LOCAL_BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $LOCAL_BACKUP_DIR | Out-Null
}

# Wenn kein Backup angegeben, zeige Liste
if ($BackupFile -eq "") {
    Write-Host "Verfügbare Backups auf dem Server:" -ForegroundColor Cyan
    Write-Host "-----------------------------------" -ForegroundColor Cyan
    ssh -i $SSH_KEY $SERVER "ls -lh $BACKUP_DIR/bereifung24_*.sql.gz"
    Write-Host ""
    $BackupFile = Read-Host "Backup-Dateiname eingeben"
}

# Vollständigen Pfad erstellen, falls nur Dateiname angegeben
if (!($BackupFile.StartsWith("/"))) {
    $BackupFile = "$BACKUP_DIR/$BackupFile"
}

Write-Host ""
Write-Host "Lade Backup herunter..." -ForegroundColor Yellow
Write-Host "Server: $BackupFile" -ForegroundColor Gray
Write-Host "Lokal: $LOCAL_BACKUP_DIR\$(Split-Path $BackupFile -Leaf)" -ForegroundColor Gray

scp -i $SSH_KEY "${SERVER}:${BackupFile}" "$LOCAL_BACKUP_DIR\"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Backup erfolgreich heruntergeladen!" -ForegroundColor Green
    Write-Host "Speicherort: $LOCAL_BACKUP_DIR\$(Split-Path $BackupFile -Leaf)" -ForegroundColor Green
    
    # Größe anzeigen
    $LocalFile = Get-Item "$LOCAL_BACKUP_DIR\$(Split-Path $BackupFile -Leaf)"
    $Size = "{0:N2} MB" -f ($LocalFile.Length / 1MB)
    Write-Host "Größe: $Size" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Fehler beim Herunterladen!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Tipp: Zum Wiederherstellen auf dem Server:" -ForegroundColor Cyan
Write-Host "  ssh $SERVER '/var/www/bereifung24/scripts/restore-database.sh $BackupFile'" -ForegroundColor Gray
