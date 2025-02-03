@echo off
chcp 65001
:: 设置UTF-8编码

for /f "tokens=1" %%i in ('git rev-parse --short HEAD^') do (
    set PREVIOUS=%%i
    echo 当前版本: %%i
)

echo.
set /p CONFIRM="确认要清除工作区和暂存区（包括新增文件）吗？(Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo 操作已取消
    pause
    exit /b 1
)

echo.
echo 正在清除工作区和暂存区...
:: 重置已跟踪的文件
git reset --hard %PREVIOUS%
:: 清除未跟踪的文件和目录
git clean -fd

echo.
echo 清除完成！所有更改（包括新增文件）已被清除！