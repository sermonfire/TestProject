@echo off
chcp 65001
:: 设置UTF-8编码

echo 正在清理 Git 缓存...
git rm -r --cached .

echo 重新添加所有文件...
git add .

echo 提交更改...
git commit -m "重置 Git 缓存并更新.gitignore"

echo 完成！