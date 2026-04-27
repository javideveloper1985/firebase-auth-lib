#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Bump version for firebase-auth-lib
.DESCRIPTION
    Actualiza la versión en package.json y en el workflow de GitHub Actions,
    hace commit, crea tag y sube todo a git.
.PARAMETER Type
    Tipo de bump: major, minor, o patch (por defecto)
.PARAMETER Message
    Mensaje adicional para el commit (opcional)
.EXAMPLE
    .\bump-version.ps1 patch
    .\bump-version.ps1 minor "Add new feature"
    .\bump-version.ps1 major
#>

param(
    [ValidateSet('major', 'minor', 'patch')]
    [string]$Type = 'patch',
    [string]$Message = ''
)

$ErrorActionPreference = 'Stop'

# Colores para output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

Write-Info "🚀 Iniciando proceso de bump de versión ($Type)..."

# Verificar que estamos en la rama main
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -ne 'main') {
    Write-Error "❌ Debes estar en la rama 'main' para hacer bump de versión"
    exit 1
}

# Verificar que no hay cambios sin commitear
$status = git status --porcelain
if ($status) {
    Write-Warning "⚠️  Tienes cambios sin commitear:"
    Write-Host $status
    $response = Read-Host "¿Deseas continuar de todos modos? (y/N)"
    if ($response -notmatch '^[yY]') {
        Write-Info "Cancelado por el usuario"
        exit 0
    }
}

# Leer versión actual del package.json
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Info "📦 Versión actual: $currentVersion"

# Parsear versión
if ($currentVersion -notmatch '^(\d+)\.(\d+)\.(\d+)$') {
    Write-Error "❌ Formato de versión inválido en package.json: $currentVersion"
    exit 1
}

$major = [int]$Matches[1]
$minor = [int]$Matches[2]
$patch = [int]$Matches[3]

# Calcular nueva versión
switch ($Type) {
    'major' {
        $major++
        $minor = 0
        $patch = 0
    }
    'minor' {
        $minor++
        $patch = 0
    }
    'patch' {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
Write-Success "✨ Nueva versión: $newVersion"

# Actualizar package.json
Write-Info "📝 Actualizando package.json..."
$packageContent = Get-Content -Path "package.json" -Raw
$packageContent = $packageContent -replace "`"version`":\s*`"$currentVersion`"", "`"version`": `"$newVersion`""
Set-Content -Path "package.json" -Value $packageContent -NoNewline

# Actualizar workflow YAML
Write-Info "📝 Actualizando .github/workflows/publish.yml..."
$workflowPath = ".github/workflows/publish.yml"
$workflowContent = Get-Content -Path $workflowPath -Raw
$workflowContent = $workflowContent -replace "VERSION_MAJOR:\s*\d+", "VERSION_MAJOR: $major"
$workflowContent = $workflowContent -replace "VERSION_MINOR:\s*\d+", "VERSION_MINOR: $minor"
$workflowContent = $workflowContent -replace "VERSION_PATCH:\s*\d+", "VERSION_PATCH: $patch"
Set-Content -Path $workflowPath -Value $workflowContent -NoNewline

# Verificar que TypeScript compila
Write-Info "🔍 Verificando TypeScript..."
$tscResult = & tsc 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ TypeScript tiene errores de compilación:"
    Write-Host $tscResult
    Write-Warning "Revirtiendo cambios..."
    git checkout package.json $workflowPath
    exit 1
}
Write-Success "✅ TypeScript OK"

# Preparar mensaje de commit
$commitMessage = "chore: bump version to $newVersion"
if ($Message) {
    $commitMessage += " - $Message"
}

# Git add, commit, tag
Write-Info "📤 Haciendo commit y tag..."
git add package.json $workflowPath
git commit -m $commitMessage

$tagName = "v$newVersion"
git tag $tagName

Write-Success "✅ Commit y tag creados"

# Preguntar antes de push
Write-Warning ""
Write-Warning "Se creará el tag: $tagName"
Write-Warning "Se subirán los cambios a origin/main"
$response = Read-Host "¿Deseas hacer push ahora? (Y/n)"

if ($response -match '^[nN]') {
    Write-Info "⏸️  Push cancelado. Para subir manualmente:"
    Write-Host "  git push"
    Write-Host "  git push --tags"
    exit 0
}

# Push
Write-Info "📤 Subiendo a git..."
git push
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error al hacer push"
    exit 1
}

git push --tags
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error al hacer push de tags"
    exit 1
}

Write-Success ""
Write-Success "🎉 ¡Versión $newVersion publicada exitosamente!"
Write-Success "   Tag: $tagName"
Write-Success "   El workflow de GitHub Actions se ejecutará automáticamente"
