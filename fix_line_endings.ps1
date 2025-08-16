# PowerShell script to fix line endings in update_database.sh
# This script converts Windows line endings (CRLF) to Unix line endings (LF)

param(
    [string]$FilePath = "./release/update_database.sh"
)

if (Test-Path $FilePath) {
    Write-Host "[FIX] Converting line endings in $FilePath from CRLF to LF..."
    
    # Read the file content
    $content = Get-Content -Path $FilePath -Raw
    
    # Convert CRLF to LF
    $content = $content -replace "`r`n", "`n"
    
    # Write back with UTF-8 encoding without BOM
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
    
    Write-Host "[FIX] Line endings converted successfully!"
} else {
    Write-Host "[ERROR] File not found: $FilePath"
    exit 1
}