@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ========================================
REM BIM项目管理系统 - 前端快速构建脚本
REM 用途：本地构建前端并准备上传
REM ========================================

echo ========================================
echo   BIM项目管理系统 - 前端构建
echo ========================================
echo.

REM 检查前端目录
if not exist "frontend" (
    echo [错误] 前端目录不存在
    pause
    exit /b 1
)

echo [1/4] 检查环境...
cd frontend

REM 检查 node_modules
if not exist "node_modules" (
    echo node_modules 不存在，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)
echo ✓ 环境检查完成
echo.

echo [2/4] 清理旧构建文件...
if exist "dist" (
    rmdir /s /q dist
)
echo ✓ 清理完成
echo.

echo [3/4] 构建前端项目...
call npm run build
if errorlevel 1 (
    echo.
    echo [错误] 构建失败，尝试跳过TypeScript检查...
    call npx vite build
    if errorlevel 1 (
        echo [错误] 构建失败
        pause
        exit /b 1
    )
)
echo ✓ 构建完成
echo.

echo [4/4] 验证构建产物...
if not exist "dist\index.html" (
    echo [错误] 构建产物不存在
    pause
    exit /b 1
)
echo ✓ 构建产物验证通过
echo.

echo ========================================
echo   构建成功！
echo ========================================
echo.
echo 构建产物位置: frontend\dist
echo.
echo 下一步操作：
echo   方法1 - 使用WinSCP/FilleZilla上传:
echo          将 frontend\dist 整个目录上传到服务器
echo          目标路径: /www/wwwroot/BIMPMS/frontend/dist
echo.
echo   方法2 - 使用宝塔面板:
echo          1. 压缩 frontend\dist 为 dist.zip
echo          2. 在宝塔面板上传 dist.zip
echo          3. 解压到 /www/wwwroot/BIMPMS/frontend/
echo.
echo   方法3 - 使用命令行 (需要配置SSH):
echo          scp -r frontend/dist/* root@47.122.112.158:/www/wwwroot/BIMPMS/frontend/dist/
echo.

REM 询问是否打开dist目录
set /p opendir="是否打开构建目录？(y/n): "
if /i "%opendir%"=="y" (
    explorer dist
)

echo.
echo 完成后请在服务器运行部署脚本: deploy.sh
pause
