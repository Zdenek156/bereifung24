# Script to automatically update all remaining admin routes to use requireAdminOrEmployee
$routes = @(
    "app\api\admin\workshops\download\route.ts",
    "app\api\admin\email\send\route.ts",
    "app\api\admin\email\recipients\route.ts",
    "app\api\admin\email-templates\route.ts",
    "app\api\admin\email-templates\[id]\route.ts",
    "app\api\admin\customers\[id]\route.ts",
    "app\api\admin\customers\download\route.ts",
    "app\api\admin\commissions\route.ts",
    "app\api\admin\commissions\stats\route.ts",
    "app\api\admin\billing\monthly\route.ts",
    "app\api\admin\api-settings\route.ts",
    "app\api\admin\notification-settings\route.ts",
    "app\api\admin\server-info\route.ts",
    "app\api\admin\security\status\route.ts",
    "app\api\admin\workshops\[id]\crm\route.ts",
    "app\api\admin\workshops\[id]\crm\notes\route.ts",
    "app\api\admin\workshops\[id]\crm\interactions\route.ts"
)

foreach ($route in $routes) {
    $fullPath = Join-Path "c:\Bereifung24\Bereifung24 Workspace" $route
    
    if (Test-Path $fullPath) {
        Write-Host "Processing $route..." -ForegroundColor Cyan
        $content = Get-Content -Path $fullPath -Raw
        
        # Check if already using requireAdminOrEmployee
        if ($content -notmatch "requireAdminOrEmployee") {
            # Add import if not present
            if ($content -notmatch "import.*requireAdminOrEmployee") {
                $content = $content -replace "(import.*?from '@/lib/auth')", "`$1`nimport { requireAdminOrEmployee } from '@/lib/permissions'"
            }
            
            # Replace hardcoded ADMIN checks
            $content = $content -replace "const session = await getServerSession\(authOptions\)\s*if \(\!session \|\| session\.user\.role !== 'ADMIN'\) \{\s*return NextResponse\.json\(\s*\{ error: '[^']+' \},\s*\{ status: 401 \}\s*\)\s*\}", "const authError = await requireAdminOrEmployee()`nif (authError) return authError"
            
            $content = $content -replace "const session = await getServerSession\(authOptions\)\s*\n\s*if \(\!session \|\| session\.user\.role !== 'ADMIN'\) \{\s*return NextResponse\.json\(\s*\{ error: '[^']+' \},\s*\{ status: 401 \}\s*\)\s*\}", "const authError = await requireAdminOrEmployee()`nif (authError) return authError"
            
            Set-Content -Path $fullPath -Value $content
            Write-Host "  ✓ Updated" -ForegroundColor Green
        } else {
            Write-Host "  - Already updated" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  × Not found" -ForegroundColor Red
    }
}

Write-Host "`nDone!" -ForegroundColor Green
