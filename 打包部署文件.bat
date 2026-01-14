@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo   BIM项目管理系统 - 打包部署文件
echo ========================================
echo.

REM 检查当前目录
if not exist "backend" (
    echo [错误] backend目录不存在
    pause
    exit /b 1
)

echo [1/4] 清理旧的打包文件...
if exist "BIMPMS-deploy.zip" del "BIMPMS-deploy.zip"
echo ✓ 清理完成
echo.

echo [2/4] 临时清理不需要的文件...
REM 删除临时文件和文件夹
if exist "backend\node_modules" (
    echo 跳过 node_modules (将在服务器上安装)
)
if exist "frontend\node_modules" (
    echo 跳过 node_modules (将在服务器上安装)
)
if exist "frontend\dist" (
    echo 跳过 dist (将在服务器上构建)
)
if exist ".git" (
    echo 跳过 .git 目录
)
echo ✓ 检查完成
echo.

echo [3/4] 使用PowerShell压缩文件...
REM 创建临时目录结构
mkdir deploy_temp
xcopy /E /I /Q backend deploy_temp\backend\
xcopy /E /I /Q database deploy_temp\database\
xcopy /E /I /Q docs deploy_temp\docs\
copy deploy-frontend.bat deploy_temp\
copy deploy.sh deploy_temp\
copy "宝塔面板从零部署指南.MD" deploy_temp\
copy "快速部署指南.MD" deploy_temp\

REM 删除不需要的文件夹
if exist "deploy_temp\backend\node_modules" rmdir /s /q "deploy_temp\backend\node_modules"
if exist "deploy_temp\backend\dist" rmdir /s /q "deploy_temp\backend\dist"
if exist "deploy_temp\backend\tmpclaude-*" rmdir /s /q "deploy_temp\backend\tmpclaude-*"
if exist "deploy_temp\.git" rmdir /s /q "deploy_temp\.git"

REM 压缩
powershell -Command "Compress-Archive -Path deploy_temp\* -DestinationPath BIMPMS-deploy.zip -Force"

REM 清理临时目录
rmdir /s /q deploy_temp

echo ✓ 压缩完成
echo.

echo [4/4] 验证打包文件...
if exist "BIMPMS-deploy.zip" (
    echo ✓ 打包成功: BIMPMS-deploy.zip

    REM 显示文件大小
    for %%A in ("BIMPMS-deploy.zip") do (
        set size=%%~zA
        set /a sizeMB=!size!/1048576
        echo   文件大小: !sizeMB! MB
    )
) else (
    echo [错误] 打包失败
    pause
    exit /b 1
)
echo.

echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 打包文件: BIMPMS-deploy.zip
echo.
echo 下一步操作:
echo   1. 登录宝塔面板
echo   2. 进入文件管理 → /www/wwwroot/BIMPMS/
echo   3. 上传 BIMPMS-deploy.zip
echo   4. 解压文件
echo   5. 继续按照部署指南操作
echo.

REM 询问是否打开文件夹
set /p openfolder="是否打开文件夹查看打包文件？(y/n): "
if /i "%openfolder%"=="y" (
    explorer .
)

echo.
pause
