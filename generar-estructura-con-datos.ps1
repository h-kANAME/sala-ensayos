# Script para generar reporte completo con estructura y contenido de archivos
# Ejecutar en: C:\xampp\htdocs\sala-ensayos

param(
    [string]$OutputType = "both", # Puede ser: json, txt, both
    [switch]$IncludeContent = $false, # Incluir contenido de archivos
    [int]$MaxFileSize = 1MB, # Tamaño máximo de archivo a leer (en bytes)
    [string[]]$ExcludeExtensions = @('.exe', '.dll', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar', '.7z', '.mp4', '.mp3', '.avi', '.mov') # Extensiones a excluir del contenido
)

function Get-FileStructure {
    param(
        [string]$Path,
        [int]$Depth = 0,
        [bool]$IncludeContent = $false
    )
    
    $structure = @{}
    $item = Get-Item $Path
    
    if ($item.PSIsContainer) {
        $structure.Name = $item.Name
        $structure.Type = "Directory"
        $structure.FullPath = $item.FullName
        $structure.RelativePath = $item.FullName.Replace($script:BaseDirectory, "").TrimStart('\')
        $structure.LastWriteTime = $item.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        $structure.Children = @()
        
        # Obtener archivos y carpetas (excluir carpetas problemáticas)
        $items = Get-ChildItem $Path -Force -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -notin @('node_modules', '.git', '.vscode', '.idea', 'build', 'dist', '.next', 'vendor', 'cache') -and
            $_.Name -notlike '.*' -and
            $_.Name -notlike 'reportes-*'
        }
        
        foreach ($child in $items) {
            try {
                $childStructure = Get-FileStructure -Path $child.FullName -Depth ($Depth + 1) -IncludeContent $IncludeContent
                $structure.Children += $childStructure
            }
            catch {
                Write-Warning "No se pudo procesar: $($child.FullName)"
            }
        }
    } else {
        $structure.Name = $item.Name
        $structure.Type = "File"
        $structure.FullPath = $item.FullName
        $structure.RelativePath = $item.FullName.Replace($script:BaseDirectory, "").TrimStart('\')
        $structure.Size = $item.Length
        $structure.SizeKB = [math]::Round($item.Length / 1KB, 2)
        $structure.LastWriteTime = $item.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
        $structure.Extension = $item.Extension
        
        # Incluir contenido si se solicita
        if ($IncludeContent) {
            $contentResult = Get-FileContentSafe -FilePath $item.FullName -MaxSize $MaxFileSize
            $structure.Content = $contentResult.Content
            $structure.ContentIncluded = $contentResult.Included
            if (-not $contentResult.Included) {
                $structure.ContentExclusionReason = $contentResult.Reason
            }
        }
    }
    
    return $structure
}

function Get-FileContentSafe {
    param(
        [string]$FilePath,
        [long]$MaxSize
    )
    
    $result = @{
        Content = $null
        Included = $false
        Reason = ""
    }
    
    $item = Get-Item $FilePath
    
    # Verificar tamaño
    if ($item.Length -gt $MaxSize) {
        $result.Reason = "Archivo demasiado grande ($([math]::Round($item.Length / 1MB, 2)) MB > $([math]::Round($MaxSize / 1MB, 2)) MB)"
        return $result
    }
    
    # Verificar extensión
    if ($item.Extension -in $ExcludeExtensions) {
        $result.Reason = "Extension excluida ($($item.Extension))"
        return $result
    }
    
    # Verificar si es archivo binario
    if (Test-BinaryFile -FilePath $FilePath) {
        $result.Reason = "Archivo binario detectado"
        return $result
    }
    
    try {
        # Intentar leer como UTF-8
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8 -ErrorAction Stop
        $result.Content = $content
        $result.Included = $true
        return $result
    }
    catch {
        try {
            # Si falla UTF-8, intentar con encoding por defecto
            $content = Get-Content -Path $FilePath -Raw -ErrorAction Stop
            $result.Content = $content
            $result.Included = $true
            return $result
        }
        catch {
            $result.Reason = "Error de lectura: $($_.Exception.Message)"
            return $result
        }
    }
}

function Test-BinaryFile {
    param([string]$FilePath)
    
    try {
        # Leer los primeros 1024 bytes
        $bytes = Get-Content -Path $FilePath -TotalCount 1024 -Encoding Byte -ErrorAction Stop
        
        # Si contiene muchos bytes nulos, probablemente es binario
        $nullCount = ($bytes | Where-Object { $_ -eq 0 }).Count
        if ($bytes.Count -eq 0) { return $false }
        
        $nullPercentage = $nullCount / $bytes.Count
        return $nullPercentage -gt 0.3
    }
    catch {
        return $true # Si no se puede leer, asumir que es binario
    }
}

function Export-ProjectToJson {
    param(
        [object]$Structure,
        [string]$FilePath
    )
    
    $projectData = @{
        ProjectName = "Sala de Ensayos"
        GeneratedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        BaseDirectory = $script:BaseDirectory
        IncludesContent = $IncludeContent.IsPresent
        Configuration = @{
            MaxFileSize = $MaxFileSize
            ExcludedExtensions = $ExcludeExtensions
            ExcludedDirectories = @('node_modules', '.git', '.vscode', '.idea', 'build', 'dist', '.next', 'vendor', 'cache')
        }
        Structure = $Structure
        Statistics = Get-ProjectStatistics -Structure $Structure
    }
    
    $json = $projectData | ConvertTo-Json -Depth 15
    $json | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Host "JSON completo generado: $FilePath" -ForegroundColor Green
}

function Export-ProjectToTxt {
    param(
        [object]$Structure,
        [string]$FilePath
    )
    
    $output = "REPORTE COMPLETO DEL PROYECTO - SALA DE ENSAYOS`n"
    $output += "=" * 70 + "`n"
    $output += "Generado: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
    $output += "Directorio base: $($Structure.FullPath)`n"
    $output += "Incluye contenido: $(if($IncludeContent.IsPresent) {'SI'} else {'NO'})`n"
    if ($IncludeContent.IsPresent) {
        $output += "Tamaño maximo archivo: $([math]::Round($MaxFileSize / 1MB, 2)) MB`n"
        $output += "Extensiones excluidas: $($ExcludeExtensions -join ', ')`n"
    }
    $output += "=" * 70 + "`n`n"
    
    # Estadísticas del proyecto
    $stats = Get-ProjectStatistics -Structure $Structure
    $output += "ESTADISTICAS DEL PROYECTO:`n"
    $output += "-" * 30 + "`n"
    $output += "Total archivos: $($stats.TotalFiles)`n"
    $output += "Total directorios: $($stats.TotalDirectories)`n"
    $output += "Tamaño total: $($stats.TotalSizeMB) MB`n"
    if ($IncludeContent.IsPresent) {
        $output += "Archivos con contenido: $($stats.FilesWithContent)`n"
        $output += "Archivos excluidos: $($stats.FilesExcluded)`n"
    }
    $output += "`n" + "=" * 70 + "`n`n"
    
    # Estructura en árbol
    $output += "ESTRUCTURA DE ARCHIVOS:`n"
    $output += "-" * 30 + "`n"
    $output += Format-TreeText -Item $Structure
    
    # Contenido de archivos si se solicita
    if ($IncludeContent.IsPresent) {
        $output += "`n" + "=" * 70 + "`n"
        $output += "CONTENIDO DE ARCHIVOS:`n"
        $output += "=" * 70 + "`n`n"
        $output += Format-FileContents -Item $Structure
    }
    
    $output | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Host "TXT completo generado: $FilePath" -ForegroundColor Green
}

function Get-ProjectStatistics {
    param([object]$Structure)
    
    $stats = @{
        TotalFiles = 0
        TotalDirectories = 0
        TotalSize = 0
        FilesWithContent = 0
        FilesExcluded = 0
    }
    
    function Count-Items {
        param([object]$Item)
        
        if ($Item.Type -eq "Directory") {
            $stats.TotalDirectories++
            foreach ($child in $Item.Children) {
                Count-Items -Item $child
            }
        } else {
            $stats.TotalFiles++
            $stats.TotalSize += $Item.Size
            if ($IncludeContent.IsPresent) {
                if ($Item.ContentIncluded) {
                    $stats.FilesWithContent++
                } else {
                    $stats.FilesExcluded++
                }
            }
        }
    }
    
    Count-Items -Item $Structure
    $stats.TotalSizeMB = [math]::Round($stats.TotalSize / 1MB, 2)
    
    return $stats
}

function Format-TreeText {
    param(
        [object]$Item,
        [string]$Indent = "",
        [bool]$IsLast = $true
    )
    
    $output = ""
    $prefix = if ($IsLast) { "+-- " } else { "|-- " }
    $newIndent = if ($IsLast) { "    " } else { "|   " }
    
    if ($Item.Type -eq "Directory") {
        $output += "$Indent$prefix[DIR] $($Item.Name)/`n"
        for ($i = 0; $i -lt $Item.Children.Count; $i++) {
            $childIsLast = $i -eq ($Item.Children.Count - 1)
            $output += Format-TreeText -Item $Item.Children[$i] -Indent ($Indent + $newIndent) -IsLast $childIsLast
        }
    } else {
        $contentInfo = ""
        if ($IncludeContent.IsPresent) {
            $contentInfo = if ($Item.ContentIncluded) { " [CONTENT]" } else { " [EXCLUDED]" }
        }
        $output += "$Indent$prefix[FILE] $($Item.Name) ($($Item.SizeKB) KB)$contentInfo`n"
    }
    
    return $output
}

function Format-FileContents {
    param([object]$Item)
    
    $output = ""
    
    function Process-Item {
        param([object]$CurrentItem)
        
        if ($CurrentItem.Type -eq "Directory") {
            foreach ($child in $CurrentItem.Children) {
                Process-Item -CurrentItem $child
            }
        } else {
            if ($CurrentItem.ContentIncluded -and $CurrentItem.Content) {
                $script:output += "`n" + "="*70 + "`n"
                $script:output += "ARCHIVO: $($CurrentItem.RelativePath)`n"
                $script:output += "Tamaño: $($CurrentItem.SizeKB) KB`n"
                $script:output += "Ultima modificacion: $($CurrentItem.LastWriteTime)`n"
                $script:output += "-"*70 + "`n"
                $script:output += $CurrentItem.Content
                $script:output += "`n" + "-"*70 + "`n"
            }
        }
    }
    
    $script:output = $output
    Process-Item -CurrentItem $Item
    return $script:output
}

# Main execution
Write-Host ("=" * 70) -ForegroundColor Magenta
Write-Host "GENERADOR DE REPORTE COMPLETO DEL PROYECTO" -ForegroundColor Yellow
Write-Host ("=" * 70) -ForegroundColor Magenta
Write-Host "Directorio actual: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$currentDir = Get-Location
$script:BaseDirectory = $currentDir.Path

if ($currentDir.Path -notlike "*sala-ensayos*") {
    Write-Host "ADVERTENCIA: No parece estar en el directorio sala-ensayos" -ForegroundColor Yellow
    Write-Host "Continuando de todas formas..." -ForegroundColor Yellow
    Write-Host ""
}

# Mostrar configuración
Write-Host "CONFIGURACION:" -ForegroundColor Cyan
Write-Host "- Incluir contenido: $(if($IncludeContent.IsPresent) {'SI'} else {'NO'})" -ForegroundColor White
if ($IncludeContent.IsPresent) {
    Write-Host "- Tamaño maximo archivo: $([math]::Round($MaxFileSize / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "- Extensiones excluidas: $($ExcludeExtensions -join ', ')" -ForegroundColor White
}
Write-Host "- Tipo de salida: $OutputType" -ForegroundColor White
Write-Host ""

# Crear directorio de reportes si no existe
$reportDir = Join-Path $currentDir.Path "reportes-completos"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    Write-Host "Directorio creado: $reportDir" -ForegroundColor Green
    Write-Host ""
}

# Generar timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$suffix = if ($IncludeContent.IsPresent) { "completo" } else { "estructura" }
$jsonFile = Join-Path $reportDir "$suffix-$timestamp.json"
$txtFile = Join-Path $reportDir "$suffix-$timestamp.txt"

# Obtener estructura
Write-Host "Escaneando proyecto..." -ForegroundColor Yellow
if ($IncludeContent.IsPresent) {
    Write-Host "NOTA: Incluyendo contenido de archivos - esto puede tomar tiempo" -ForegroundColor Yellow
}

$structure = Get-FileStructure -Path $currentDir.Path -IncludeContent $IncludeContent.IsPresent

# Exportar en los formatos solicitados
switch ($OutputType.ToLower()) {
    "json" {
        Export-ProjectToJson -Structure $structure -FilePath $jsonFile
    }
    "txt" {
        Export-ProjectToTxt -Structure $structure -FilePath $txtFile
    }
    "both" {
        Export-ProjectToJson -Structure $structure -FilePath $jsonFile
        Export-ProjectToTxt -Structure $structure -FilePath $txtFile
    }
    default {
        Write-Host "ERROR: Tipo de output no valido. Use: json, txt o both" -ForegroundColor Red
        exit 1
    }
}

# Mostrar resumen final
$stats = Get-ProjectStatistics -Structure $structure

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Magenta
Write-Host "REPORTE GENERADO EXITOSAMENTE" -ForegroundColor Green
Write-Host ("=" * 70) -ForegroundColor Magenta

Write-Host ""
Write-Host "ESTADISTICAS:" -ForegroundColor Cyan
Write-Host "- Archivos procesados: $($stats.TotalFiles)" -ForegroundColor White
Write-Host "- Directorios: $($stats.TotalDirectories)" -ForegroundColor White
Write-Host "- Tamaño total: $($stats.TotalSizeMB) MB" -ForegroundColor White

if ($IncludeContent.IsPresent) {
    Write-Host "- Archivos con contenido: $($stats.FilesWithContent)" -ForegroundColor Green
    Write-Host "- Archivos excluidos: $($stats.FilesExcluded)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "UBICACION REPORTES:" -ForegroundColor Cyan
Write-Host "$reportDir" -ForegroundColor White
Write-Host ""

Write-Host "ARCHIVOS CREADOS:" -ForegroundColor Cyan
if (Test-Path $jsonFile) {
    $jsonSize = (Get-Item $jsonFile).Length / 1KB
    Write-Host "- JSON: $(Split-Path $jsonFile -Leaf) ($([math]::Round($jsonSize, 2)) KB)" -ForegroundColor Green
}

if (Test-Path $txtFile) {
    $txtSize = (Get-Item $txtFile).Length / 1KB
    Write-Host "- TXT: $(Split-Path $txtFile -Leaf) ($([math]::Round($txtSize, 2)) KB)" -ForegroundColor Green
}

Write-Host ""
Write-Host "COMANDOS DE USO:" -ForegroundColor Yellow
Write-Host "# Generar solo estructura (como tu script original):" -ForegroundColor Gray
Write-Host ".\generar-estructura-con-datos.ps1" -ForegroundColor White

Write-Host ""
Write-Host "# Generar con contenido completo:" -ForegroundColor Gray
Write-Host ".\generar-estructura-con-datos.ps1 -IncludeContent" -ForegroundColor White

Write-Host ""
Write-Host "# Solo JSON con contenido:" -ForegroundColor Gray
Write-Host ".\generar-estructura-con-datos.ps1 -IncludeContent -OutputType json" -ForegroundColor White

Write-Host ""
Write-Host "# Cambiar tamaño maximo de archivo (2MB):" -ForegroundColor Gray
Write-Host ".\generar-estructura-con-datos.ps1 -IncludeContent -MaxFileSize 2MB" -ForegroundColor White

Write-Host ""
Write-Host "PARA VER RESULTADOS:" -ForegroundColor Yellow
Write-Host "# Ver JSON:" -ForegroundColor Gray
Write-Host "Get-Content `"$jsonFile`" | ConvertFrom-Json | ConvertTo-Json -Depth 3" -ForegroundColor White

Write-Host ""
Write-Host "# Ver TXT:" -ForegroundColor Gray
Write-Host "Get-Content `"$txtFile`" -Encoding UTF8 | More" -ForegroundColor White