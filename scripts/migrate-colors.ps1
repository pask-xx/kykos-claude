#!/usr/bin/env pwsh
# Bulk migrate raw Tailwind colors to semantic tokens in KYKOS app files
# Color mappings:
#   red    -> error
#   green  -> success
#   amber  -> warning
#   blue   -> info
#   purple -> secondary

$colorMap = @{
    'red'    = 'error'
    'green'  = 'success'
    'amber'  = 'warning'
    'blue'   = 'info'
    'purple' = 'secondary'
}

# Find all .tsx files in src/app
$files = Get-ChildItem -Path 'D:\PROGETTI\KYKOS\KYKOS-WITH-CLAUDE\src\app' -Recurse -Filter '*.tsx' |
    Where-Object { $_.FullName -notmatch '\\operator\\' -and $_.FullName -notmatch 'recipients\\\[id\]' }

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content

    foreach ($color in $colorMap.Keys) {
        $token = $colorMap[$color]
        # Match each Tailwind property that can have a color, with capture for the number
        $properties = @('bg-', 'text-', 'border-', 'ring-', 'from-', 'to-', 'via-', 'placeholder-', 'caret-', 'accent-', 'fill-', 'stroke-', 'outline-', 'decoration-', 'shadow-', 'divide-')

        foreach ($prop in $properties) {
            $pattern = [regex]::Escape($prop) + [regex]::Escape($color) + '-(\d+)'
            $content = [regex]::Replace($content, $pattern, $prop + $token + '-$1')
        }
    }

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Migrated: $($file.FullName)"
    }
}

Write-Host "Done."
