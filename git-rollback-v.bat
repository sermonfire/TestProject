@echo off
chcp 65001
:: 设置UTF-8编码

:: 显示当前提交历史
echo 当前提交历史:
git log --oneline -n 2
echo.

:: 获取当前版本和上一版本的哈希值
for /f "tokens=1,2" %%i in ('git log --oneline -n 2') do (
    if not defined CURRENT (
        set CURRENT=%%i
    ) else (
        set PREVIOUS=%%i
    )
)

echo 当前版本: --%CURRENT%--
echo 上一版本: --%PREVIOUS%--

echo.
set /p CONFIRM="确认要回滚到上一版本吗？(Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo 操作已取消
    pause
    exit /b 1
)

echo.
echo 正在回滚到上一版本...
git reset --hard %PREVIOUS%

echo.
echo 回滚完成！当前提交历史:
git log --oneline -n 2