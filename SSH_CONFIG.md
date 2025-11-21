# SSH Konfiguration für Bereifung24 Server

## Wichtige Information
Der SSH-Key `bereifung24_hetzner` ist bereits auf dem Server installiert und funktioniert!

## Korrekte Verwendung in PowerShell

### ❌ Funktioniert NICHT:
```powershell
ssh -i ~\.ssh\bereifung24_hetzner root@167.235.24.110
```

### ✅ Funktioniert:
```powershell
ssh -i "$env:USERPROFILE\.ssh\bereifung24_hetzner" root@167.235.24.110
```

### ✅ Noch besser - SSH Config Alias verwenden:
```powershell
ssh bereifung24
```

## SSH Config Datei
Speicherort: `C:\Users\zdene\.ssh\config`

```
Host bereifung24
    HostName 167.235.24.110
    User root
    IdentityFile C:\Users\zdene\.ssh\bereifung24_hetzner
```

## SSH-Keys im System
- **bereifung24_hetzner** (ed25519) - ✅ AUF SERVER INSTALLIERT, FUNKTIONIERT
- **bereifung24_hetzner.pub** - Öffentlicher Key
- **id_rsa_bereifung24** - Alternative (RSA), erstellt 20.11.2025
- **id_rsa** - Standard Key, erstellt 21.11.2025

## Deployment
Das `deploy.ps1` Skript verwendet automatisch den SSH Config Alias `bereifung24`, daher funktioniert es ohne Passwortabfrage.

## Bei Problemen
1. Teste die Verbindung: `ssh bereifung24 "echo 'Test'"`
2. Prüfe ob Key existiert: `Test-Path "$env:USERPROFILE\.ssh\bereifung24_hetzner"`
3. Prüfe SSH Config: `Get-Content "$env:USERPROFILE\.ssh\config"`

## Server Details
- Host: 167.235.24.110
- User: root
- Key: bereifung24_hetzner (ed25519)
- Installiert am: 18.11.2025
