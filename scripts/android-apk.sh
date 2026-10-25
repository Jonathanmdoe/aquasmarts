#!/bin/sh
set -eu

AQUASMART_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
AQUASMART_TOOLCHAIN="$AQUASMART_ROOT/.toolchain"
export JAVA_HOME="$AQUASMART_TOOLCHAIN/jdk/Contents/Home"
export ANDROID_HOME="$AQUASMART_TOOLCHAIN/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export GRADLE_USER_HOME="$AQUASMART_TOOLCHAIN/gradle-home"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$AQUASMART_TOOLCHAIN/node/bin:$PATH"

cd "$AQUASMART_ROOT"
"$AQUASMART_TOOLCHAIN/node/bin/npm" run android:sync
cd "$AQUASMART_ROOT/android"
# `release` builds the signed APK for sharing; anything else builds the debug APK.
if [ "${1:-debug}" = "release" ]; then
  ./gradlew :app:assembleRelease --console=plain
else
  ./gradlew :app:assembleDebug --console=plain
fi
