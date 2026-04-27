#!/bin/bash
# Bump version for firebase-auth-lib
# Usage: ./bump-version.sh [major|minor|patch] ["optional message"]

set -e

TYPE=${1:-patch}
MESSAGE=${2:-""}

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Iniciando proceso de bump de versión ($TYPE)...${NC}"

# Validar tipo
if [[ ! "$TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}❌ Tipo inválido: $TYPE. Usa: major, minor, o patch${NC}"
    exit 1
fi

# Verificar que estamos en la rama main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Debes estar en la rama 'main' para hacer bump de versión${NC}"
    exit 1
fi

# Verificar que no hay cambios sin commitear
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Tienes cambios sin commitear:${NC}"
    git status --short
    read -p "¿Deseas continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado por el usuario"
        exit 0
    fi
fi

# Leer versión actual del package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${CYAN}📦 Versión actual: $CURRENT_VERSION${NC}"

# Parsear versión
if [[ ! "$CURRENT_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo -e "${RED}❌ Formato de versión inválido en package.json: $CURRENT_VERSION${NC}"
    exit 1
fi

MAJOR=${BASH_REMATCH[1]}
MINOR=${BASH_REMATCH[2]}
PATCH=${BASH_REMATCH[3]}

# Calcular nueva versión
case $TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo -e "${GREEN}✨ Nueva versión: $NEW_VERSION${NC}"

# Actualizar package.json
echo -e "${CYAN}📝 Actualizando package.json...${NC}"
if command -v node &> /dev/null; then
    node -e "const fs=require('fs'); const pkg=require('./package.json'); pkg.version='$NEW_VERSION'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');"
else
    # Fallback usando sed
    sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
    rm package.json.bak
fi

# Actualizar workflow YAML
echo -e "${CYAN}📝 Actualizando .github/workflows/publish.yml...${NC}"
WORKFLOW_PATH=".github/workflows/publish.yml"
sed -i.bak "s/VERSION_MAJOR: [0-9]*/VERSION_MAJOR: $MAJOR/" "$WORKFLOW_PATH"
sed -i.bak "s/VERSION_MINOR: [0-9]*/VERSION_MINOR: $MINOR/" "$WORKFLOW_PATH"
sed -i.bak "s/VERSION_PATCH: [0-9]*/VERSION_PATCH: $PATCH/" "$WORKFLOW_PATH"
rm "$WORKFLOW_PATH.bak"

# Verificar que TypeScript compila
echo -e "${CYAN}🔍 Verificando TypeScript...${NC}"
if ! npx tsc --noEmit; then
    echo -e "${RED}❌ TypeScript tiene errores de compilación${NC}"
    echo -e "${YELLOW}Revirtiendo cambios...${NC}"
    git checkout package.json "$WORKFLOW_PATH"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript OK${NC}"

# Preparar mensaje de commit
COMMIT_MESSAGE="chore: bump version to $NEW_VERSION"
if [ -n "$MESSAGE" ]; then
    COMMIT_MESSAGE="$COMMIT_MESSAGE - $MESSAGE"
fi

# Git add, commit, tag
echo -e "${CYAN}📤 Haciendo commit y tag...${NC}"
git add package.json "$WORKFLOW_PATH"
git commit -m "$COMMIT_MESSAGE"

TAG_NAME="v$NEW_VERSION"
git tag "$TAG_NAME"

echo -e "${GREEN}✅ Commit y tag creados${NC}"

# Preguntar antes de push
echo ""
echo -e "${YELLOW}Se creará el tag: $TAG_NAME${NC}"
echo -e "${YELLOW}Se subirán los cambios a origin/main${NC}"
read -p "¿Deseas hacer push ahora? (Y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${CYAN}⏸️  Push cancelado. Para subir manualmente:${NC}"
    echo "  git push"
    echo "  git push --tags"
    exit 0
fi

# Push
echo -e "${CYAN}📤 Subiendo a git...${NC}"
git push
git push --tags

echo ""
echo -e "${GREEN}🎉 ¡Versión $NEW_VERSION publicada exitosamente!${NC}"
echo -e "${GREEN}   Tag: $TAG_NAME${NC}"
echo -e "${GREEN}   El workflow de GitHub Actions se ejecutará automáticamente${NC}"
