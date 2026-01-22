# Script to add CEO authorization to all admin routes
# Reads list of files and updates authorization checks

$filelist = Get-Content "admin_routes_to_update.txt"
$updatedCount = 0
$skippedCount = 0
$errors = @()

Write-Host "🔍 Processing $($filelist.Count) files..." -ForegroundColor Cyan

foreach ($file in $filelist) {
    if (-not (Test-Path $file)) {
        Write-Host "⚠️  File not found: $file" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    try {
        $content = Get-Content $file -Raw
        
        # Skip if already has isAdminOrCEO
        if ($content -match 'isAdminOrCEO') {
            Write-Host "⏭️  Already updated: $file" -ForegroundColor Gray
            $skippedCount++
            continue
        }
        
        # Check if needs update (has ADMIN-only check)
        if ($content -match "session\.user\.role !== 'ADMIN'" -or 
            $content -match "session\.user\.role === 'ADMIN'") {
            
            # Pattern 1: Add import if not exists
            if ($content -notmatch "from '@/lib/auth/permissions'") {
                # Find authOptions import and add after it
                $content = $content -replace "(from '@/lib/auth')", "`$1`nimport { isAdminOrCEO } from '@/lib/auth/permissions'"
            }
            
            # Pattern 2: Replace simple !== 'ADMIN' check
            $content = $content -replace `
                "if \(!session \|\| session\.user\.role !== 'ADMIN'\)", `
                "const hasAccess = await isAdminOrCEO(session)`n    if (!hasAccess)"
                
            # Pattern 3: Replace with optional user check
            $content = $content -replace `
                "if \(!session\?\.user\?\.role \|\| session\.user\.role !== 'ADMIN'\)", `
                "const hasAccess = await isAdminOrCEO(session)`n    if (!hasAccess)"
            
            # Pattern 4: Replace session.user.role !== 'ADMIN' (standalone)
            $content = $content -replace `
                "session\.user\.role !== 'ADMIN'", `
                "!(await isAdminOrCEO(session))"
            
            # Save updated content
            $content | Out-File -FilePath $file -Encoding UTF8 -NoNewline
            
            Write-Host "✅ Updated: $file" -ForegroundColor Green
            $updatedCount++
        }
        else {
            Write-Host "⏭️  No ADMIN check found: $file" -ForegroundColor Gray
            $skippedCount++
        }
    }
    catch {
        $errorMsg = "Error processing $file : $_"
        Write-Host "❌ $errorMsg" -ForegroundColor Red
        $errors += $errorMsg
        $skippedCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Updated: $updatedCount files" -ForegroundColor Green
Write-Host "   ⏭️  Skipped: $skippedCount files" -ForegroundColor Yellow
Write-Host "   ❌ Errors: $($errors.Count)" -ForegroundColor Red

if ($errors.Count -gt 0) {
    Write-Host "`n⚠️  Errors:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
}

Write-Host "`n✨ Done! Review changes before committing." -ForegroundColor Cyan
