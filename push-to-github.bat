@echo off
echo ====================================================
echo Syncing with origin/main and pushing to GitHub
echo ====================================================

echo.
echo [1/2] Syncing history with origin/main to prevent PR conflicts...
git merge origin/main --allow-unrelated-histories -m "chore: sync with main"

echo.
echo [2/2] Pushing your code to Venuja_Ranasinghe branch...
git push -u origin Venuja_Ranasinghe --force

echo.
echo ====================================================
echo PUSH COMPLETE!
echo.
echo Direct link to create your Pull Request to main:
echo https://github.com/IT24101739/AgriNova_AI/pull/new/Venuja_Ranasinghe
echo ====================================================
pause
