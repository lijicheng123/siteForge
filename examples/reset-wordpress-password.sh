#!/bin/bash
# ============================================================================
# WordPress 管理员密码重置工具
# ============================================================================
# 功能:
#   1. 查看现有管理员账号
#   2. 重置管理员密码
#   3. 创建新的管理员账号
# 
# 使用示例:
#   ./reset-wordpress-password.sh lijicheng.cn
# ============================================================================

set -e

# ----------------------------------------------------------------------------
# 参数检查
# ----------------------------------------------------------------------------
if [ $# -lt 1 ]; then
    echo "用法: $0 <域名> [SSH密码]"
    echo ""
    echo "示例:"
    echo "  $0 lijicheng.cn"
    echo "  $0 lijicheng.cn YourSSHPassword"
    echo ""
    exit 1
fi

DOMAIN=$1
SSH_PASSWORD=${2:-"1QAZ2wsx"}
SERVER_IP="120.77.170.69"
SSH_USER="root"
WP_PATH="/var/www/$DOMAIN"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ----------------------------------------------------------------------------
# 辅助函数
# ----------------------------------------------------------------------------

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 执行 SSH 命令
ssh_exec() {
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        ${SSH_USER}@${SERVER_IP} "$1" 2>&1
}

# ----------------------------------------------------------------------------
# 前置检查
# ----------------------------------------------------------------------------

echo "============================================================================"
echo "WordPress 管理员密码重置工具"
echo "============================================================================"
echo ""
echo "目标站点: $DOMAIN"
echo "服务器: $SERVER_IP"
echo ""

# 检查 sshpass
if ! command -v sshpass &> /dev/null; then
    log_error "未找到 sshpass 命令，请先安装："
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo ""
    log_info "或者，您可以手动 SSH 登录服务器执行："
    echo ""
    echo "  ssh root@$SERVER_IP"
    echo "  cd /var/www/$DOMAIN"
    echo "  wp user list --allow-root"
    echo "  wp user update admin --user_pass='NewPassword123!' --allow-root"
    echo ""
    exit 1
fi

# 检查站点是否存在
log_info "检查站点是否存在..."
if ! ssh_exec "test -d $WP_PATH" &>/dev/null; then
    log_error "站点目录不存在: $WP_PATH"
    log_info "可用的站点："
    ssh_exec "ls -d /var/www/*/ 2>/dev/null | xargs -n1 basename" || echo "无"
    exit 1
fi

log_info "✓ 站点存在: $WP_PATH"
echo ""

# ----------------------------------------------------------------------------
# 主菜单
# ----------------------------------------------------------------------------

show_menu() {
    echo "============================================================================"
    echo "请选择操作："
    echo "============================================================================"
    echo "  1) 查看所有管理员账号"
    echo "  2) 重置管理员密码（推荐）"
    echo "  3) 创建新的管理员账号"
    echo "  4) 查看数据库连接信息"
    echo "  0) 退出"
    echo "============================================================================"
    echo ""
}

# ----------------------------------------------------------------------------
# 功能 1：查看管理员账号
# ----------------------------------------------------------------------------

list_admins() {
    log_step "查看管理员账号..."
    echo ""
    
    ADMIN_LIST=$(ssh_exec "cd $WP_PATH && wp user list --role=administrator --allow-root --format=table")
    
    if [ $? -eq 0 ]; then
        echo "$ADMIN_LIST"
        echo ""
        log_info "以上是所有管理员账号"
    else
        log_error "获取管理员列表失败"
        echo "$ADMIN_LIST"
    fi
    
    echo ""
}

# ----------------------------------------------------------------------------
# 功能 2：重置密码
# ----------------------------------------------------------------------------

reset_password() {
    log_step "重置管理员密码..."
    echo ""
    
    # 先列出管理员
    list_admins
    
    read -p "请输入要重置密码的用户名 (默认: admin): " USERNAME
    USERNAME=${USERNAME:-"admin"}
    
    echo ""
    echo "密码生成方式："
    echo "  1) 自动生成安全密码（推荐）"
    echo "  2) 手动输入密码"
    echo ""
    read -p "请选择 (1/2): " CHOICE
    
    if [ "$CHOICE" = "2" ]; then
        read -s -p "请输入新密码: " NEW_PASSWORD
        echo ""
        read -s -p "请再次确认密码: " NEW_PASSWORD_CONFIRM
        echo ""
        
        if [ "$NEW_PASSWORD" != "$NEW_PASSWORD_CONFIRM" ]; then
            log_error "两次输入的密码不一致！"
            return
        fi
    else
        NEW_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-16)
        log_info "已生成随机密码"
    fi
    
    echo ""
    log_info "正在重置密码..."
    
    RESULT=$(ssh_exec "cd $WP_PATH && wp user update '$USERNAME' --user_pass='$NEW_PASSWORD' --allow-root 2>&1")
    
    if echo "$RESULT" | grep -q "Success"; then
        echo ""
        echo "============================================================================"
        log_info "✓ 密码重置成功！"
        echo "============================================================================"
        echo ""
        echo "登录信息："
        echo "  - 后台地址: https://$DOMAIN/wp-admin"
        echo "  - 用户名: $USERNAME"
        echo "  - 新密码: $NEW_PASSWORD"
        echo ""
        log_warn "⚠️  请妥善保管此密码！"
        echo "============================================================================"
        echo ""
        
        # 保存到文件
        SAVE_FILE="password_${DOMAIN}_${USERNAME}_$(date +%Y%m%d_%H%M%S).txt"
        cat > "$SAVE_FILE" << EOF
WordPress 登录信息
==================

站点: $DOMAIN
后台地址: https://$DOMAIN/wp-admin
用户名: $USERNAME
密码: $NEW_PASSWORD
重置时间: $(date)

请妥善保管此文件！
EOF
        log_info "登录信息已保存到: $SAVE_FILE"
        echo ""
    else
        log_error "密码重置失败！"
        echo "$RESULT"
    fi
}

# ----------------------------------------------------------------------------
# 功能 3：创建新管理员
# ----------------------------------------------------------------------------

create_admin() {
    log_step "创建新管理员账号..."
    echo ""
    
    read -p "新用户名 (默认: newadmin): " NEW_USER
    NEW_USER=${NEW_USER:-"newadmin"}
    
    read -p "邮箱地址: " EMAIL
    if [ -z "$EMAIL" ]; then
        log_error "邮箱地址不能为空"
        return
    fi
    
    echo ""
    echo "密码生成方式："
    echo "  1) 自动生成安全密码（推荐）"
    echo "  2) 手动输入密码"
    echo ""
    read -p "请选择 (1/2): " CHOICE
    
    if [ "$CHOICE" = "2" ]; then
        read -s -p "请输入密码: " NEW_PASSWORD
        echo ""
    else
        NEW_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-16)
    fi
    
    echo ""
    log_info "正在创建管理员账号..."
    
    RESULT=$(ssh_exec "cd $WP_PATH && wp user create '$NEW_USER' '$EMAIL' --role=administrator --user_pass='$NEW_PASSWORD' --allow-root 2>&1")
    
    if echo "$RESULT" | grep -q "Success"; then
        echo ""
        echo "============================================================================"
        log_info "✓ 管理员账号创建成功！"
        echo "============================================================================"
        echo ""
        echo "登录信息："
        echo "  - 后台地址: https://$DOMAIN/wp-admin"
        echo "  - 用户名: $NEW_USER"
        echo "  - 邮箱: $EMAIL"
        echo "  - 密码: $NEW_PASSWORD"
        echo ""
        log_warn "⚠️  请妥善保管此密码！"
        echo "============================================================================"
        echo ""
        
        # 保存到文件
        SAVE_FILE="password_${DOMAIN}_${NEW_USER}_$(date +%Y%m%d_%H%M%S).txt"
        cat > "$SAVE_FILE" << EOF
WordPress 登录信息
==================

站点: $DOMAIN
后台地址: https://$DOMAIN/wp-admin
用户名: $NEW_USER
邮箱: $EMAIL
密码: $NEW_PASSWORD
创建时间: $(date)

请妥善保管此文件！
EOF
        log_info "登录信息已保存到: $SAVE_FILE"
        echo ""
    else
        log_error "创建管理员失败！"
        echo "$RESULT"
    fi
}

# ----------------------------------------------------------------------------
# 功能 4：查看数据库信息
# ----------------------------------------------------------------------------

show_db_info() {
    log_step "查看数据库连接信息..."
    echo ""
    
    DB_INFO=$(ssh_exec "cd $WP_PATH && grep 'DB_' wp-config.php | grep define")
    
    if [ $? -eq 0 ]; then
        echo "数据库配置 (来自 wp-config.php):"
        echo "-------------------------------------------"
        echo "$DB_INFO" | grep -v "<?php"
        echo "-------------------------------------------"
        echo ""
        
        # 提取具体值
        DB_NAME=$(echo "$DB_INFO" | grep DB_NAME | awk -F "'" '{print $4}')
        DB_USER=$(echo "$DB_INFO" | grep DB_USER | awk -F "'" '{print $4}')
        DB_PASS=$(echo "$DB_INFO" | grep DB_PASSWORD | awk -F "'" '{print $4}')
        DB_HOST=$(echo "$DB_INFO" | grep DB_HOST | awk -F "'" '{print $4}')
        
        log_info "数据库连接信息："
        echo "  - 数据库名: $DB_NAME"
        echo "  - 数据库用户: $DB_USER"
        echo "  - 数据库密码: $DB_PASS"
        echo "  - 数据库主机: $DB_HOST"
        echo ""
        
        log_info "连接命令："
        echo "  mysql -u '$DB_USER' -p'$DB_PASS' '$DB_NAME'"
        echo ""
    else
        log_error "获取数据库信息失败"
    fi
}

# ----------------------------------------------------------------------------
# 主循环
# ----------------------------------------------------------------------------

while true; do
    show_menu
    read -p "请输入选项 (0-4): " OPTION
    echo ""
    
    case $OPTION in
        1)
            list_admins
            read -p "按 Enter 继续..."
            echo ""
            ;;
        2)
            reset_password
            read -p "按 Enter 继续..."
            echo ""
            ;;
        3)
            create_admin
            read -p "按 Enter 继续..."
            echo ""
            ;;
        4)
            show_db_info
            read -p "按 Enter 继续..."
            echo ""
            ;;
        0)
            log_info "退出程序"
            exit 0
            ;;
        *)
            log_error "无效的选项"
            ;;
    esac
done

