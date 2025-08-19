# Script para generar reporte de estructura de archivos y carpetas
# Ejecutar en: C:\xampp\htdocs\sala-ensayos

param(
    [string]$OutputType = "both" # Puede ser: json, txt, both
)

function Get-FileStructure {
    param(
        [string]$Path,
        [int]$Depth = 0
    )
    
    $structure = @{}
    $item = Get-Item $Path
    
    if ($item.PSIsContainer) {
        $structure.Name = $item.Name
        $structure.Type = "Directory"
        $structure.FullPath = $item.FullName
        $structure.LastWriteTime = $item.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        $structure.Children = @()
        
        # Obtener archivos y carpetas (excluir node_modules y otras carpetas grandes)
        $items = Get-ChildItem $Path -Force | Where-Object {
            $_.Name -notin @('node_modules', '.git', '.vscode', '.idea', 'build', 'dist') -and
            $_.Name -notlike '.*'
        }
        
        foreach ($child in $items) {
            $childStructure = Get-FileStructure -Path $child.FullName -Depth ($Depth + 1)
            $structure.Children += $childStructure
        }
    } else {
        $structure.Name = $item.Name
        $structure.Type = "File"
        $structure.FullPath = $item.FullName
        $structure.Size = $item.Length
        $structure.LastWriteTime = $item.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        $structure.Extension = $item.Extension
    }
    
    return $structure
}

function Export-StructureToJson {
    param(
        [object]$Structure,
        [string]$FilePath
    )
    
    $json = $Structure | ConvertTo-Json -Depth 10
    $json | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Host "JSON generado: $FilePath" -ForegroundColor Green
}

function Export-StructureToTxt {
    param(
        [object]$Structure,
        [string]$FilePath
    )
    
    $output = "REPORTE DE ESTRUCTURA - SALA DE ENSAYOS`n"
    $output += "Generado: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
    $output += "Directorio base: $($Structure.FullPath)`n"
    $output += "=" * 60 + "`n`n"
    
    function Format-Tree {
        param(
            [object]$Item,
            [string]$Indent = "",
            [bool]$IsLast = $true
        )
        
        # Usar caracteres ASCII simples en lugar de caracteres de dibujo
        $prefix = if ($IsLast) { "+-- " } else { "|-- " }
        $newIndent = if ($IsLast) { "    " } else { "|   " }
        
        if ($Item.Type -eq "Directory") {
            $output += "$Indent$prefix[DIR] $($Item.Name)/`n"
            for ($i = 0; $i -lt $Item.Children.Count; $i++) {
                $childIsLast = $i -eq ($Item.Children.Count - 1)
                $output += Format-Tree -Item $Item.Children[$i] -Indent ($Indent + $newIndent) -IsLast $childIsLast
            }
        } else {
            $sizeKB = [math]::Round($Item.Size / 1KB, 2)
            $output += "$Indent$prefix[FILE] $($Item.Name) ($sizeKB KB)`n"
        }
        
        return $output
    }
    
    $output = Format-Tree -Item $Structure
    $output | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Host "TXT generado: $FilePath" -ForegroundColor Green
}

# Main execution
Write-Host "Generando reporte de estructura..." -ForegroundColor Yellow
Write-Host "Directorio actual: $(Get-Location)`n" -ForegroundColor Cyan

# Verificar que estamos en el directorio correcto
$currentDir = Get-Location
if ($currentDir.Path -notlike "*sala-ensayos*") {
    Write-Host "ERROR: Debe ejecutar este script en C:\xampp\htdocs\sala-ensayos" -ForegroundColor Red
    exit 1
}

# Crear directorio de reportes si no existe
$reportDir = Join-Path $currentDir.Path "reportes-estructura"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

# Generar timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$jsonFile = Join-Path $reportDir "estructura-$timestamp.json"
$txtFile = Join-Path $reportDir "estructura-$timestamp.txt"

# Obtener estructura
Write-Host "Escaneando estructura de archivos..." -ForegroundColor Yellow
$structure = Get-FileStructure -Path $currentDir.Path

# Exportar en los formatos solicitados
switch ($OutputType.ToLower()) {
    "json" {
        Export-StructureToJson -Structure $structure -FilePath $jsonFile
    }
    "txt" {
        Export-StructureToTxt -Structure $structure -FilePath $txtFile
    }
    "both" {
        Export-StructureToJson -Structure $structure -FilePath $jsonFile
        Export-StructureToTxt -Structure $structure -FilePath $txtFile
    }
    default {
        Write-Host "ERROR: Tipo de output no valido. Use: json, txt o both" -ForegroundColor Red
        exit 1
    }
}

# Mostrar resumen
Write-Host "`n" + "="*50 -ForegroundColor Magenta
Write-Host "REPORTE GENERADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "Ubicacion reportes: $reportDir" -ForegroundColor White
Write-Host "Archivos creados:" -ForegroundColor White

if (Test-Path $jsonFile) {
    $jsonSize = (Get-Item $jsonFile).Length / 1KB
    Write-Host "- JSON: $(Split-Path $jsonFile -Leaf) ($([math]::Round($jsonSize, 2)) KB)" -ForegroundColor Cyan
}

if (Test-Path $txtFile) {
    $txtSize = (Get-Item $txtFile).Length / 1KB
    Write-Host "- TXT: $(Split-Path $txtFile -Leaf) ($([math]::Round($txtSize, 2)) KB)" -ForegroundColor Cyan
}

Write-Host "`nPara ver el contenido del reporte JSON:" -ForegroundColor Yellow
Write-Host "Get-Content `"$jsonFile`" | ConvertFrom-Json" -ForegroundColor Gray

Write-Host "`nPara ver el reporte en texto:" -ForegroundColor Yellow
Write-Host "Get-Content `"$txtFile`" -Encoding UTF8" -ForegroundColor Gray