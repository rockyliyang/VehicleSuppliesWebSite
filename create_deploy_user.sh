#!/bin/bash
# 创建隔离的 Web 用户并初始化网站目录
# 用法：sudo ./create_web_user.sh <用户名> [网站根目录路径]

# 校验参数
if [ $# -lt 1 ]; then
    echo "错误：必须指定用户名！"
    echo "用法：sudo $0 <用户名> [网站根目录路径]"
    exit 1
fi

USERNAME="$1"
WEB_ROOT="/home/$USERNAME/frontend"  # 前端默认目录：~/frontend
BACKEND_ROOT="/home/$USERNAME/backend"  # 后端默认目录：~/backend

# 检查用户是否存在
if id "$USERNAME" &>/dev/null; then
    echo "错误：用户 $USERNAME 已存在！"
    exit 1
fi

# 创建系统用户（禁止登录+自动建家目录）
sudo useradd -m -s /bin/bash "$USERNAME"  # [3,8](@ref)
echo "✅ 用户 $USERNAME 创建完成（已禁用登录）"

# 创建网站根目录
sudo mkdir -p "$WEB_ROOT"
echo "📁 网站目录初始化：$WEB_ROOT"
# 创建后端根目录
sudo mkdir -p "$BACKEND_ROOT"
echo "📁 后端目录初始化：$BACKEND_ROOT"

# 设置目录所有权
sudo chown -R "$USERNAME:$USERNAME" "/home/$USERNAME"

# 设置安全权限（用户读写执行，组只读，其他无权限）
sudo chmod -R 750 "$WEB_ROOT"  # [6,7](@ref)
sudo chmod -R 750 "$BACKEND_ROOT"  # [6,7](@ref)

sudo chmod 750 "/home/$USERNAME"

# 复制环境模板（可选）
#sudo cp -r /etc/skel/. "/home/$USERNAME/" 2>/dev/null  # [4,8](@ref)

echo "🔒 权限设置完成："
ls -ld "/home/$USERNAME" "$WEB_ROOT" "$BACKEND_ROOT" 

# 将nginx用户添加到部署用户组
sudo usermod -aG $USERNAME nginx
# 输出摘要
cat <<EOF
--------------------------------------------------
✨ 用户 $USERNAME 部署完成！
- 网站目录：$WEB_ROOT
- 文件所有权：$USERNAME:$USERNAME
- 安全权限：750（用户可读写执行，组可读执行）
- 登录限制：已启用 Shell 访问 (`/bin/bash`)
--------------------------------------------------
EOF