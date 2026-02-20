# Script to remove the 4 service cards from pricing page
$file = "c:\Bereifung24\Bereifung24 Workspace\app\dashboard\workshop\pricing\page.tsx"
$content = Get-Content $file -Raw

# Use regex to find and remove everything between the bad comment and the real tire pricing section  
# Start: after info box closing, find the misplaced comment
# End: before the real "Tire Pricing by Rim Size" with purple icon

$pattern = '(?s)(\s+\{/\* Tire Pricing by Rim Size \*/\}\s+<div className="bg-white.*?PKW-Reifen \(Auto\).*?</div>\s+</div>\s+</div>\s+\{/\* Motorrad Reifen \*/\}.*?</div>\s+</div>\s+</div>\s+\{/\* Batterie \*/\}.*?</div>\s+</div>\s+</div>\s+\{/\* Bremsen \*/\}.*?</div>\s+</div>\s+</div>)(\s+\{/\* Tire Pricing by Rim Size \*/\}\s+<div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">\s+<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">\s+<h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">\s+<svg className="w-6 h-6 mr-2 text-purple-600")'

if ($content -match $pattern) {
    $newContent = $content -replace $pattern, '$2'
    Set-Content -Path $file -Value $newContent -NoNewline
    Write-Host "✅ Service cards removed successfully!"
} else {
    Write-Host "❌ Pattern not found - manual intervention needed"
    Write-Host " Looking for purple icon marker..."
}

