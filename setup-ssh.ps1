# SSH-Key Setup für Hetzner Server
$publicKey = Get-Content ~\.ssh\bereifung24_hetzner.pub

Write-Host "Öffentlicher SSH-Key:" -ForegroundColor Green
Write-Host $publicKey
Write-Host ""
Write-Host "Kopiere diesen Key und führe auf dem Server aus:" -ForegroundColor Yellow
Write-Host ""
Write-Host "ssh root@167.235.24.110" -ForegroundColor Cyan
Write-Host "mkdir -p ~/.ssh" -ForegroundColor Cyan
Write-Host "chmod 700 ~/.ssh" -ForegroundColor Cyan
Write-Host "echo '$publicKey' >> ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host "chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Cyan
Write-Host "exit" -ForegroundColor Cyan
Write-Host ""
Write-Host "Danach teste die Verbindung mit:" -ForegroundColor Yellow
Write-Host "ssh -i ~\.ssh\bereifung24_hetzner root@167.235.24.110" -ForegroundColor Cyan
