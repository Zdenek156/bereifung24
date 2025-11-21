# SSH-Key Installation auf Hetzner Server
$publicKey = Get-Content ~\.ssh\bereifung24_hetzner.pub

Write-Host "Installiere SSH-Key auf dem Server..." -ForegroundColor Green
Write-Host "Bitte gib das Root-Passwort ein wenn gefragt." -ForegroundColor Yellow
Write-Host ""

# Installiere den Key auf dem Server
ssh root@167.235.24.110 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$publicKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo 'Key installiert!'"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Teste SSH ohne Passwort..." -ForegroundColor Yellow
    
    ssh -i ~\.ssh\bereifung24_hetzner root@167.235.24.110 "echo 'SSH funktioniert!'"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Perfekt! Konfiguriere jetzt E-Mail..." -ForegroundColor Green
        Write-Host ""
        
        ssh -i ~\.ssh\bereifung24_hetzner root@167.235.24.110 "cd /var/www/bereifung24 && sed -i '/^EMAIL_/d' .env && echo 'EMAIL_HOST=mail.your-server.de' >> .env && echo 'EMAIL_PORT=587' >> .env && echo 'EMAIL_SECURE=false' >> .env && echo 'EMAIL_USER=info@bereifung24.de' >> .env && echo 'EMAIL_PASSWORD=Zdenek83!' >> .env && echo 'EMAIL_FROM=info@bereifung24.de' >> .env && echo '' && echo '=== E-Mail Konfiguration ===' && grep '^EMAIL_' .env && echo '' && pm2 restart bereifung24"
        
        Write-Host ""
        Write-Host "Alles fertig!" -ForegroundColor Green
    }
}
