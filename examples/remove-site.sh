#!/bin/bash
# ============================================================================
# 从服务器上卸载 WordPress 站点
# ============================================================================
# 功能:
#   - 删除 WordPress 文件目录
#   - 删除数据库和数据库用户
#   - 删除 Nginx 虚拟主机配置
#   - 撤销 SSL 证书
# 
# 使用示例:
#   ./remove-site.sh haoyu.ai
# ============================================================================

set -e  # 遇到错误立即退出

# ----------------------------------------------------------------------------
# 参数检查
# ----------------------------------------------------------------------------
if [ $# -lt 1 ]; then
    echo "用法: $0 <要删除的域名> [SSH密码]"
    echo ""
    echo "示例:"
    echo "  $0 haoyu.ai"
    echo "  $0 haoyu.ai YourSSHPassword"
    echo ""
    echo "⚠️  警告: 此操作将永久删除站点的所有数据，无法恢复！"
    echo ""
    exit 1
fi

DOMAIN_TO_REMOVE=$1
SSH_PASSWORD=${2:-"1QAZ2wsx"}

# ----------------------------------------------------------------------------
# 配置变量
# ----------------------------------------------------------------------------
SERVER_IP="120.77.170.69"
SSH_USER="root"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
echo "siteForge - 卸载 WordPress 站点"
echo "============================================================================"
echo ""
echo "目标服务器: $SERVER_IP"
echo "要删除的站点: $DOMAIN_TO_REMOVE"
echo ""

# 检查 sshpass 命令
if ! command -v sshpass &> /dev/null; then
    log_error "未找到 sshpass 命令，请先安装："
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  CentOS/RHEL: sudo yum install sshpass"
    echo ""
    log_info "或者，您可以手动在服务器上执行以下命令："
    echo ""
    echo "  # 删除 WordPress 文件"
    echo "  sudo rm -rf /var/www/$DOMAIN_TO_REMOVE"
    echo ""
    echo "  # 删除 Nginx 配置"
    echo "  sudo rm -f /etc/nginx/conf.d/${DOMAIN_TO_REMOVE}.conf"
    echo "  sudo nginx -t && sudo systemctl reload nginx"
    echo ""
    echo "  # 删除 SSL 证书"
    echo "  sudo certbot delete --cert-name $DOMAIN_TO_REMOVE"
    echo ""
    echo "  # 删除数据库（需要知道数据库名）"
    echo "  mysql -u root -p -e \"DROP DATABASE IF EXISTS <数据库名>;\""
    echo "  mysql -u root -p -e \"DROP USER IF EXISTS '<数据库用户>'@'localhost';\""
    echo ""
    exit 1
fi

log_warn "⚠️  危险操作警告！"
log_warn "  即将删除以下内容："
log_warn "    - WordPress 文件: /var/www/$DOMAIN_TO_REMOVE"
log_warn "    - Nginx 配置: /etc/nginx/conf.d/${DOMAIN_TO_REMOVE}.conf"
log_warn "    - SSL 证书: /etc/letsencrypt/live/$DOMAIN_TO_REMOVE"
log_warn "    - 数据库及用户（如果找到）"
echo ""
log_error "此操作不可逆！所有数据将被永久删除！"
echo ""
read -p "确认删除站点 $DOMAIN_TO_REMOVE？(输入 YES 确认) " -r
echo ""
if [[ ! $REPLY == "YES" ]]; then
    log_info "操作已取消"
    exit 0
fi

# 再次确认
echo ""
log_warn "最后确认：您真的要删除 $DOMAIN_TO_REMOVE 吗？"
read -p "输入域名 '$DOMAIN_TO_REMOVE' 确认: " -r
echo ""
if [[ ! $REPLY == "$DOMAIN_TO_REMOVE" ]]; then
    log_info "域名不匹配，操作已取消"
    exit 0
fi

# ----------------------------------------------------------------------------
# 执行卸载
# ----------------------------------------------------------------------------

echo ""
echo "============================================================================"
log_step "开始卸载站点: $DOMAIN_TO_REMOVE"
echo "============================================================================"
echo ""

# ============================================================================
# Step 1: 检查站点是否存在
# ============================================================================

log_step "1/5 检查站点是否存在..."

if ! ssh_exec "test -d /var/www/$DOMAIN_TO_REMOVE" &>/dev/null; then
    log_warn "站点目录不存在: /var/www/$DOMAIN_TO_REMOVE"
    read -p "是否继续清理其他配置？(y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    log_info "✓ 找到站点目录"
fi

# ============================================================================
# Step 2: 备份数据库（可选）
# ============================================================================

echo ""
log_step "2/5 备份数据库（推荐）..."

read -p "是否备份数据库？(Y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    # 尝试从 wp-config.php 读取数据库信息
    log_info "正在从 wp-config.php 读取数据库配置..."
    
    DB_NAME=$(ssh_exec "grep \"define( 'DB_NAME'\" /var/www/$DOMAIN_TO_REMOVE/wp-config.php 2>/dev/null | awk -F \"'\" '{print \$4}'")
    DB_USER=$(ssh_exec "grep \"define( 'DB_USER'\" /var/www/$DOMAIN_TO_REMOVE/wp-config.php 2>/dev/null | awk -F \"'\" '{print \$4}'")
    DB_PASS=$(ssh_exec "grep \"define( 'DB_PASSWORD'\" /var/www/$DOMAIN_TO_REMOVE/wp-config.php 2>/dev/null | awk -F \"'\" '{print \$4}'")
    
    if [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
        log_info "数据库名: $DB_NAME"
        log_info "数据库用户: $DB_USER"
        
        BACKUP_FILE="backup_${DOMAIN_TO_REMOVE}_$(date +%Y%m%d_%H%M%S).sql"
        
        log_info "正在备份数据库..."
        if ssh_exec "mysqldump -u '$DB_USER' -p'$DB_PASS' '$DB_NAME' > /tmp/$BACKUP_FILE 2>/dev/null"; then
            # 下载备份文件
            sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
                ${SSH_USER}@${SERVER_IP}:/tmp/$BACKUP_FILE ./ 2>&1
            
            if [ -f "$BACKUP_FILE" ]; then
                log_info "✓ 数据库已备份到: $BACKUP_FILE"
                ssh_exec "rm -f /tmp/$BACKUP_FILE"
            else
                log_warn "备份文件下载失败"
            fi
        else
            log_warn "数据库备份失败（可能权限不足）"
        fi
    else
        log_warn "无法读取数据库配置，跳过备份"
    fi
else
    log_warn "跳过数据库备份"
    # 仍然需要读取数据库信息用于后续删除
    DB_NAME=$(ssh_exec "grep \"define( 'DB_NAME'\" /var/www/$DOMAIN_TO_REMOVE/wp-config.php 2>/dev/null | awk -F \"'\" '{print \$4}'")
    DB_USER=$(ssh_exec "grep \"define( 'DB_USER'\" /var/www/$DOMAIN_TO_REMOVE/wp-config.php 2>/dev/null | awk -F \"'\" '{print \$4}'")
fi

# ============================================================================
# Step 3: 删除 WordPress 文件
# ============================================================================

echo ""
log_step "3/5 删除 WordPress 文件..."

if ssh_exec "test -d /var/www/$DOMAIN_TO_REMOVE"; then
    log_info "正在删除: /var/www/$DOMAIN_TO_REMOVE"
    ssh_exec "rm -rf /var/www/$DOMAIN_TO_REMOVE"
    log_info "✓ WordPress 文件已删除"
else
    log_warn "目录不存在，跳过"
fi

# ============================================================================
# Step 4: 删除 Nginx 配置
# ============================================================================

echo ""
log_step "4/5 删除 Nginx 配置..."

if ssh_exec "test -f /etc/nginx/conf.d/${DOMAIN_TO_REMOVE}.conf"; then
    log_info "正在删除 Nginx 配置..."
    ssh_exec "rm -f /etc/nginx/conf.d/${DOMAIN_TO_REMOVE}.conf"
    
    # 验证 Nginx 配置
    if ssh_exec "nginx -t" &>/dev/null; then
        ssh_exec "systemctl reload nginx"
        log_info "✓ Nginx 配置已删除并重新加载"
    else
        log_error "Nginx 配置验证失败，请手动检查"
    fi
else
    log_warn "Nginx 配置不存在，跳过"
fi

# ============================================================================
# Step 5: 撤销 SSL 证书
# ============================================================================

echo ""
log_step "5/5 撤销 SSL 证书..."

if ssh_exec "test -d /etc/letsencrypt/live/$DOMAIN_TO_REMOVE"; then
    log_info "正在撤销 SSL 证书..."
    
    # 撤销并删除证书
    if ssh_exec "certbot delete --cert-name $DOMAIN_TO_REMOVE --non-interactive" &>/dev/null; then
        log_info "✓ SSL 证书已撤销"
    else
        log_warn "SSL 证书撤销失败，可能需要手动删除"
        log_info "手动删除命令: sudo certbot delete --cert-name $DOMAIN_TO_REMOVE"
    fi
else
    log_warn "SSL 证书不存在，跳过"
fi

# ============================================================================
# Step 6: 删除数据库
# ============================================================================

echo ""
log_step "6/6 删除数据库..."

if [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
    log_info "正在删除数据库: $DB_NAME"
    log_info "正在删除数据库用户: $DB_USER"
    
    read -p "确认删除数据库？(Y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        # 需要 MySQL root 密码
        read -s -p "请输入 MySQL root 密码: " MYSQL_ROOT_PASSWORD
        echo ""
        
        if ssh_exec "mysql -u root -p'$MYSQL_ROOT_PASSWORD' -e \"DROP DATABASE IF EXISTS \\\`$DB_NAME\\\`;\"" &>/dev/null; then
            log_info "✓ 数据库 $DB_NAME 已删除"
        else
            log_warn "数据库删除失败（可能密码错误或数据库不存在）"
        fi
        
        if ssh_exec "mysql -u root -p'$MYSQL_ROOT_PASSWORD' -e \"DROP USER IF EXISTS '$DB_USER'@'localhost';\"" &>/dev/null; then
            log_info "✓ 数据库用户 $DB_USER 已删除"
        else
            log_warn "数据库用户删除失败"
        fi
        
        ssh_exec "mysql -u root -p'$MYSQL_ROOT_PASSWORD' -e \"FLUSH PRIVILEGES;\"" &>/dev/null
    else
        log_warn "跳过数据库删除"
    fi
else
    log_warn "未找到数据库信息，跳过"
fi

# ============================================================================
# 完成总结
# ============================================================================

echo ""
echo "============================================================================"
echo -e "${GREEN}✓ 站点卸载完成${NC}"
echo "============================================================================"
echo ""
echo "已删除的内容:"
echo "  ✓ WordPress 文件: /var/www/$DOMAIN_TO_REMOVE"
echo "  ✓ Nginx 配置: /etc/nginx/conf.d/${DOMAIN_TO_REMOVE}.conf"
echo "  ✓ SSL 证书: $DOMAIN_TO_REMOVE"
if [ -n "$DB_NAME" ]; then
    echo "  ✓ 数据库: $DB_NAME"
    echo "  ✓ 数据库用户: $DB_USER"
fi
echo ""

if [ -f "backup_${DOMAIN_TO_REMOVE}"*.sql ]; then
    echo "数据库备份文件:"
    ls -lh backup_${DOMAIN_TO_REMOVE}*.sql
    echo ""
fi

log_info "其他站点不受影响，继续正常运行"
echo ""

exit 0

