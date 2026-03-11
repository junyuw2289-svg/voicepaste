#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

IDENTITY="${APPLE_SIGN_IDENTITY:-Developer ID Application: Junyu Wang (ULSTAGR4F5)}"
PACKAGE_DIR="out/release"
STAGE_DIR="$PACKAGE_DIR/dmg-stage"
APP_DIR="$PACKAGE_DIR/VoicePaste-darwin-arm64"
APP_PATH="$APP_DIR/VoicePaste.app"
APP_ZIP_PATH="$PACKAGE_DIR/VoicePaste.app.zip"
DMG_PATH="$PACKAGE_DIR/VoicePaste.dmg"

echo "[release:mac] Cleaning previous build artifacts"
rm -rf .vite/build .vite/renderer out
find . -maxdepth 1 -type d -name 'tmp-pack*' -prune -exec rm -rf {} +

echo "[release:mac] Running lint"
npm run lint

echo "[release:mac] Building Vite bundles"
node ./scripts/build-vite-bundles.cjs

echo "[release:mac] Packaging app bundle"
npx --yes electron-packager@17.1.2 . VoicePaste \
  --platform=darwin \
  --arch=arm64 \
  --out="$PACKAGE_DIR" \
  --overwrite \
  --asar \
  --icon=assets/icon.icns \
  --app-bundle-id=com.junyuwang.voicepaste \
  --app-category-type=public.app-category.productivity \
  --extra-resource=assets \
  --prune=true \
  --ignore='^/(website|out|tmp-pack|\.git|\.next|playground)$' \
  --extend-info=build/extend-info.plist

if [[ ! -d "$APP_PATH" ]]; then
  echo "[release:mac] Packaged app not found at $APP_PATH"
  exit 1
fi

echo "[release:mac] Verifying packaged app contents"
grep -Fq 'Automation Permission Required' < <(strings "$APP_PATH/Contents/Resources/app.asar")
grep -Fq 'Turn on VoicePaste in Accessibility' < <(strings "$APP_PATH/Contents/Resources/app.asar")

if [[ "${SKIP_APPLE_SIGN:-0}" != "1" ]]; then
  echo "[release:mac] Signing packaged app"
  ELECTRON_FRAMEWORK="$APP_PATH/Contents/Frameworks/Electron Framework.framework"

  for binary in \
    "$ELECTRON_FRAMEWORK/Versions/A/Libraries/libEGL.dylib" \
    "$ELECTRON_FRAMEWORK/Versions/A/Libraries/libGLESv2.dylib" \
    "$ELECTRON_FRAMEWORK/Versions/A/Libraries/libffmpeg.dylib" \
    "$ELECTRON_FRAMEWORK/Versions/A/Libraries/libvk_swiftshader.dylib" \
    "$ELECTRON_FRAMEWORK/Versions/A/Helpers/chrome_crashpad_handler" \
    "$APP_PATH/Contents/Frameworks/Squirrel.framework/Versions/A/Resources/ShipIt"; do
    codesign --force --options runtime --timestamp --sign "$IDENTITY" "$binary"
  done

  for framework in \
    "$APP_PATH/Contents/Frameworks/Mantle.framework" \
    "$APP_PATH/Contents/Frameworks/ReactiveObjC.framework" \
    "$APP_PATH/Contents/Frameworks/Squirrel.framework" \
    "$APP_PATH/Contents/Frameworks/Electron Framework.framework"; do
    codesign --force --options runtime --timestamp --sign "$IDENTITY" --entitlements entitlements.inherit.plist "$framework"
  done

  for helper in \
    "$APP_PATH/Contents/Frameworks/VoicePaste Helper.app" \
    "$APP_PATH/Contents/Frameworks/VoicePaste Helper (GPU).app" \
    "$APP_PATH/Contents/Frameworks/VoicePaste Helper (Renderer).app" \
    "$APP_PATH/Contents/Frameworks/VoicePaste Helper (Plugin).app"; do
    codesign --force --options runtime --timestamp --sign "$IDENTITY" --entitlements entitlements.inherit.plist "$helper"
  done

  codesign --force --options runtime --timestamp --sign "$IDENTITY" --entitlements entitlements.plist "$APP_PATH"
fi

echo "[release:mac] Building DMG"
mkdir -p "$STAGE_DIR"
ditto "$APP_PATH" "$STAGE_DIR/VoicePaste.app"
ln -s /Applications "$STAGE_DIR/Applications"
hdiutil create -volname "VoicePaste" -srcfolder "$STAGE_DIR" -ov -format ULFO "$DMG_PATH"

if [[ "${SKIP_APPLE_SIGN:-0}" != "1" ]]; then
  codesign --force --timestamp --sign "$IDENTITY" "$DMG_PATH"
fi

if [[ -n "${APPLE_ID:-}" && -n "${APPLE_ID_PASSWORD:-}" && -n "${APPLE_TEAM_ID:-}" && "${SKIP_APPLE_NOTARIZE:-0}" != "1" ]]; then
  echo "[release:mac] Notarizing app bundle"
  ditto -c -k --keepParent "$APP_PATH" "$APP_ZIP_PATH"
  xcrun notarytool submit "$APP_ZIP_PATH" \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_ID_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    --wait
  xcrun stapler staple "$APP_PATH"

  echo "[release:mac] Notarizing DMG"
  xcrun notarytool submit "$DMG_PATH" \
    --apple-id "$APPLE_ID" \
    --password "$APPLE_ID_PASSWORD" \
    --team-id "$APPLE_TEAM_ID" \
    --wait
  xcrun stapler staple "$DMG_PATH"
fi

echo "[release:mac] Verifying codesign"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

if [[ "${SKIP_APPLE_SIGN:-0}" != "1" ]]; then
  grep -Fq "$IDENTITY" < <(codesign -dv --verbose=4 "$APP_PATH" 2>&1)
  spctl -a -vv "$APP_PATH"
fi

echo "[release:mac] App: $APP_PATH"
echo "[release:mac] DMG: $DMG_PATH"
