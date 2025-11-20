# Deployment Script für Bereifung24
# Führen Sie dieses Skript aus, um auf den Server zu deployen

Write-Host "🚀 Starte Deployment..." -ForegroundColor Green

$sshKey = "$env:USERPROFILE\.ssh\bereifung24_hetzner"
$server = "root@167.235.24.110"

# Deployment-Befehle als Array (mit NVM laden)
$commands = @(
    "export NVM_DIR=`"`$HOME/.nvm`"",
    "[ -s `"`$NVM_DIR/nvm.sh`" ] && . `"`$NVM_DIR/nvm.sh`"",
    "cd /var/www/bereifung24",
    "git pull",
    "npx prisma migrate deploy",
    "npx prisma generate",
    "npm run build",
    "pm2 restart bereifung24"
)

# Mit ; verbunden ausführen
$commandString = $commands -join "; "
ssh -i $sshKey $server $commandString

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment erfolgreich abgeschlossen!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Deployment fehlgeschlagen!" -ForegroundColor Red
}
