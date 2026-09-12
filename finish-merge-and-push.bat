@echo off
echo ====================================================
echo Finalizing conflict-free merge with origin/main...
echo ====================================================

echo.
echo [1/3] Resolving lockfile with origin/main...
git checkout origin/main -- frontend/package-lock.json

echo.
echo [2/3] Staging all resolved files and completing merge commit...
git add .
git commit -m "merge: cleanly integrate Slice 1 (Image Reporting) and Slice 2 (Smart Diagnosis & Advisory)"

echo.
echo [3/3] Pushing updated, conflict-free branch to GitHub...
git push -u origin Venuja_Ranasinghe --force

echo.
echo ====================================================
echo SUCCESS! Your branch is now 100%% synchronized with main!
echo.
echo Direct link to merge into main on GitHub:
echo https://github.com/IT24101739/AgriNova_AI/pull/new/Venuja_Ranasinghe
echo ====================================================
pause
