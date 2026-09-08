@echo off
echo ========================================
echo Building SUNMI Printer App
echo ========================================

echo.
echo Step 1: Clean all builds...
cd sunmi-printer\android
call gradlew.bat clean
cd ..\..

cd android
call gradlew.bat clean
cd ..

echo.
echo Step 2: Remove build folders...
rmdir /s /q sunmi-printer\android\build 2>nul
rmdir /s /q sunmi-printer\android\.gradle 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul
rmdir /s /q android\.gradle 2>nul

echo.
echo Step 3: Build plugin...
cd sunmi-printer
call npm run build
cd ..

echo.
echo Step 4: Build React app...
call npm run build

echo.
echo Step 5: Sync Capacitor...
call npx cap sync android

echo.
echo Step 6: Build Android with dependencies refresh...
cd android
call gradlew.bat build --refresh-dependencies --no-daemon
cd ..

echo.
echo Step 7: Open in Android Studio...
call npx cap open android

echo.
echo ========================================
echo Build complete!
echo ========================================
pause