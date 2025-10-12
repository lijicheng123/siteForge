#!/bin/bash
# ============================================================================
# 在现有服务器上添加新的 WordPress 站点
# ============================================================================
# 前提条件:
#   - 服务器已通过 bare-metal-deployment-example.sh 完成初始化（LEMP环境已就绪）
#   - 新域名已正确解析到服务器 IP
# 
# 使用示例:
#   ./add-new-site.sh haoyu.ai admin@haoyu.ai
# ============================================================================

set -e  # 遇到错误立即退出

# ----------------------------------------------------------------------------
# 参数检查
# ----------------------------------------------------------------------------
if [ $# -lt 2 ]; then
    echo "用法: $0 <新域名> <管理员邮箱> [API地址]"
    echo ""
    echo "示例:"
    echo "  $0 haoyu.ai admin@haoyu.ai"
    echo "  $0 haoyu.ai admin@haoyu.ai http://localhost:3000/api"
    echo ""
    exit 1
fi

NEW_DOMAIN=$1
ADMIN_EMAIL=$2
API_BASE_URL=${3:-"http://localhost:3000/api"}

# ----------------------------------------------------------------------------
# 配置变量（需要与第一个站点保持一致）
# ----------------------------------------------------------------------------
SERVER_IP="120.77.170.69"
SSH_USER="root"
SSH_PASSWORD="1QAZ2wsx"

# 临时文件
RESPONSE_FILE="/tmp/siteforge_add_site_$$.json"
CONTEXT_FILE="/tmp/new_site_context_$$.json"

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

check_response() {
    local response_file=$1
    local success=$(jq -r '.success' "$response_file" 2>/dev/null || echo "false")
    
    if [ "$success" != "true" ]; then
        log_error "API 调用失败！"
        log_error "错误信息: $(jq -r '.message' "$response_file" 2>/dev/null || echo '无法解析响应')"
        if command -v jq &> /dev/null; then
            cat "$response_file" | jq '.' 2>/dev/null || cat "$response_file"
        else
            cat "$response_file"
        fi
        return 1
    fi
    
    return 0
}

cleanup() {
    log_info "清理临时文件..."
    rm -f "$RESPONSE_FILE" "$CONTEXT_FILE"
}

trap cleanup EXIT

# ----------------------------------------------------------------------------
# 前置检查
# ----------------------------------------------------------------------------

echo "============================================================================"
echo "siteForge - 添加新 WordPress 站点"
echo "============================================================================"
echo ""
echo "目标服务器: $SERVER_IP"
echo "新站点域名: $NEW_DOMAIN"
echo "管理员邮箱: $ADMIN_EMAIL"
echo "API 地址: $API_BASE_URL"
echo ""

# 检查 jq 命令
if ! command -v jq &> /dev/null; then
    log_error "未找到 jq 命令，请先安装："
    echo "  macOS: brew install jq"
    echo "  Ubuntu/Debian: sudo apt-get install jq"
    echo "  CentOS/RHEL: sudo yum install jq"
    exit 1
fi

# 检查 curl 命令
if ! command -v curl &> /dev/null; then
    log_error "未找到 curl 命令，请先安装"
    exit 1
fi

log_warn "⚠️  重要提示："
log_warn "  1. 请确保域名 $NEW_DOMAIN 已正确解析到 $SERVER_IP"
log_warn "  2. 这将创建一个新的 WordPress 站点，不影响现有站点"
log_warn "  3. 新站点将使用独立的数据库和配置"
echo ""
read -p "确认继续？(y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "操作已取消"
    exit 0
fi

# ----------------------------------------------------------------------------
# 主流程
# ----------------------------------------------------------------------------

# ============================================================================
# Step 1: 部署 WordPress（跳过服务器准备）
# ============================================================================

echo ""
echo "============================================================================"
log_step "第 1 步: 部署 WordPress 到新站点"
echo "============================================================================"
echo ""
log_info "预计耗时: 3-5 分钟"
log_info "将创建:"
log_info "  - 新的 WordPress 目录: /var/www/$NEW_DOMAIN"
log_info "  - 新的数据库: 自动生成"
log_info "  - 新的 Nginx 虚拟主机配置"
echo ""

# 构建部署请求（API 会自动生成 deploymentContext）
curl -s -X POST "$API_BASE_URL/provisioning/bare-metal/deploy-wordpress-only" \
  -H "Content-Type: application/json" \
  -d "{
    \"ip\": \"$SERVER_IP\",
    \"sshUser\": \"$SSH_USER\",
    \"sshPassword\": \"$SSH_PASSWORD\",
    \"domain\": \"$NEW_DOMAIN\"
  }" \
  -o "$RESPONSE_FILE"

# 如果上面的 API 不存在，则尝试完整流程（传入特殊参数跳过 Step 1）
if ! check_response "$RESPONSE_FILE" 2>/dev/null; then
    log_warn "未找到专用 API，尝试使用标准部署流程..."
    
    # 先调用 prepare-server 生成 deploymentContext（但不实际执行 Step 1）
    curl -s -X POST "$API_BASE_URL/provisioning/bare-metal/prepare-server" \
      -H "Content-Type: application/json" \
      -d "{
        \"ip\": \"$SERVER_IP\",
        \"sshUser\": \"$SSH_USER\",
        \"sshPassword\": \"$SSH_PASSWORD\",
        \"domain\": \"$NEW_DOMAIN\",
        \"skipExecution\": true
      }" \
      -o "$RESPONSE_FILE"
    
    if ! check_response "$RESPONSE_FILE"; then
        log_error "生成部署配置失败"
        exit 1
    fi
    
    # 提取 deploymentContext
    jq -r '.data.deploymentContext' "$RESPONSE_FILE" > "$CONTEXT_FILE"
    
    # 调用 Step 2
    REQUEST_BODY=$(jq -n \
      --argjson context "$(cat "$CONTEXT_FILE")" \
      --arg sshPassword "$SSH_PASSWORD" \
      '{deploymentContext: $context, sshPassword: $sshPassword}')
    
    curl -s -X POST "$API_BASE_URL/provisioning/bare-metal/deploy-wordpress" \
      -H "Content-Type: application/json" \
      -d "$REQUEST_BODY" \
      -o "$RESPONSE_FILE"
fi

if ! check_response "$RESPONSE_FILE"; then
    log_error "WordPress 部署失败！"
    exit 1
fi

log_info "✓ WordPress 部署完成！"
echo ""

# 保存部署上下文
jq -r '.data.deploymentContext // .data' "$RESPONSE_FILE" > "$CONTEXT_FILE"

SITE_URL=$(jq -r '.data.siteUrl // "http://'$NEW_DOMAIN'"' "$RESPONSE_FILE")
ADMIN_URL=$(jq -r '.data.adminUrl // "http://'$NEW_DOMAIN'/wp-admin"' "$RESPONSE_FILE")

log_info "站点信息:"
log_info "  - 前台地址: $SITE_URL"
log_info "  - 后台地址: $ADMIN_URL"
log_info "  - 管理员账号: $(jq -r '.wpAdminUser // "admin"' "$CONTEXT_FILE")"
log_info "  - 管理员密码: $(jq -r '.wpAdminPassword // "请查看 API 响应"' "$CONTEXT_FILE")"
echo ""

# ============================================================================
# Step 2: 配置 HTTPS
# ============================================================================

echo ""
echo "============================================================================"
log_step "第 2 步: 配置 HTTPS (SSL 证书)"
echo "============================================================================"
echo ""
log_info "预计耗时: 2-3 分钟"
echo ""
log_warn "⚠️  请确保域名 $NEW_DOMAIN 已正确解析，否则证书申请将失败！"
echo ""

# 等待几秒让用户确认 DNS
read -p "DNS 已解析？按 Enter 继续申请 SSL 证书，或 Ctrl+C 取消..."

# 构建 SSL 请求
REQUEST_BODY=$(jq -n \
  --argjson context "$(cat "$CONTEXT_FILE")" \
  --arg sshPassword "$SSH_PASSWORD" \
  --arg adminEmail "$ADMIN_EMAIL" \
  '{deploymentContext: $context, sshPassword: $sshPassword, adminEmail: $adminEmail}')

curl -s -X POST "$API_BASE_URL/provisioning/bare-metal/secure-ssl" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY" \
  -o "$RESPONSE_FILE"

if ! check_response "$RESPONSE_FILE"; then
    log_error "SSL 证书配置失败！"
    log_error "可能原因："
    log_error "  1. 域名 DNS 未正确解析到 $SERVER_IP"
    log_error "  2. 防火墙未开放 80/443 端口"
    log_error "  3. Let's Encrypt 速率限制（单域名每周最多 5 次失败）"
    echo ""
    log_warn "网站已部署完成，可以先使用 HTTP 访问："
    log_warn "  $SITE_URL"
    echo ""
    log_info "稍后可以手动配置 SSL："
    log_info "  1. 确认 DNS 解析正确"
    log_info "  2. 重新运行此脚本，或"
    log_info "  3. 在服务器上运行: certbot certonly --webroot -w /var/www/$NEW_DOMAIN -d $NEW_DOMAIN"
    exit 1
fi

log_info "✓ SSL 证书配置完成！"
echo ""

SECURE_URL=$(jq -r '.data.secureSiteUrl // "https://'$NEW_DOMAIN'"' "$RESPONSE_FILE")
SECURE_ADMIN_URL=$(jq -r '.data.secureAdminUrl // "https://'$NEW_DOMAIN'/wp-admin"' "$RESPONSE_FILE")

# ============================================================================
# 部署完成总结
# ============================================================================

echo ""
echo "============================================================================"
echo -e "${GREEN}🎉 新站点添加成功！${NC}"
echo "============================================================================"
echo ""
echo "新站点信息:"
echo "  - 域名: $NEW_DOMAIN"
echo "  - 前台地址: $SECURE_URL"
echo "  - 后台地址: $SECURE_ADMIN_URL"
echo "  - 管理员账号: $(jq -r '.wpAdminUser // "admin"' "$CONTEXT_FILE")"
echo "  - 管理员密码: $(jq -r '.wpAdminPassword // "N/A"' "$CONTEXT_FILE")"
echo ""
echo "数据库信息:"
echo "  - 数据库名: $(jq -r '.dbName // "N/A"' "$CONTEXT_FILE")"
echo "  - 数据库用户: $(jq -r '.dbUser // "N/A"' "$CONTEXT_FILE")"
echo "  - 数据库密码: $(jq -r '.dbPassword // "N/A"' "$CONTEXT_FILE")"
echo ""
echo "SSL 证书:"
echo "  - 证书路径: /etc/letsencrypt/live/$NEW_DOMAIN/"
echo "  - 有效期: 90 天（自动续期）"
echo "  - SSL 评级: https://www.ssllabs.com/ssltest/analyze.html?d=$NEW_DOMAIN"
echo ""
log_warn "⚠️  请保存上述信息，特别是管理员密码和数据库密码！"
echo ""
log_info "现有站点不受影响，继续正常运行"
log_info "您现在可以访问 $SECURE_URL 配置新站点了！"
echo ""

# 保存部署信息到文件
SAVE_FILE="deployment_${NEW_DOMAIN}_$(date +%Y%m%d_%H%M%S).json"
cat "$CONTEXT_FILE" > "$SAVE_FILE"
log_info "部署信息已保存到: $SAVE_FILE"
echo ""

exit 0

