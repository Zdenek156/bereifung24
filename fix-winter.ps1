$file = "app/dashboard/customer/vehicles/page.tsx"
$content = Get-Content $file -Raw

# Count matches for Winter section start
$pattern = [regex]::Escape("{/* Winter Tires */}`n            <div className=`"border-t pt-6`">`n              <div className=`"flex items-center mb-4`">`n                <input")
$matches = [regex]::Matches($content, $pattern)
Write-Host "Found $($matches.Count) matches for Winter section start"

# Replace only the first occurrence (Edit Modal)
$search1 = @"
            {/* Winter Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
"@

$replace1 = @"
            {/* Winter Tires (not used for motorcycles) */}
            {formData.vehicleType !== 'MOTORCYCLE' && (
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
"@

# Find first occurrence position
$pos1 = $content.IndexOf($search1)
if ($pos1 -ge 0) {
    $before = $content.Substring(0, $pos1)
    $after = $content.Substring($pos1 + $search1.Length)
    $content = $before + $replace1 + $after
    Write-Host "✓ Replaced first Winter section (Edit Modal)"
} else {
    Write-Host "✗ Could not find first Winter section"
}

# Now find and replace second occurrence (Add Modal)
$pos2 = $content.IndexOf($search1)
if ($pos2 -ge 0) {
    $before = $content.Substring(0, $pos2)
    $after = $content.Substring($pos2 + $search1.Length)
    $content = $before + $replace1 + $after
    Write-Host "✓ Replaced second Winter section (Add Modal)"
} else {
    Write-Host "✗ Could not find second Winter section"
}

# Save
$content | Set-Content $file -NoNewline
Write-Host ""
Write-Host "File saved"
