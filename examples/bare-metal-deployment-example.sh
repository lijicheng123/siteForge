#!/bin/bash
# ============================================================================
# 裸金属 WordPress 部署示例脚本
# ============================================================================
# 此脚本演示如何使用 siteForge API 完成三步部署流程
# 
# 使用前请修改以下变量:
#   - API_BASE_URL: siteForge API 地址
#   - SERVER_IP: 目标服务器 IP
#   - SSH_USER: SSH 用户名
#   - SSH_PASSWORD: SSH 密码
#   - DOMAIN: 网站域名
#   - ADMIN_EMAIL: SSL 证书通知邮箱
# ============================================================================

set -e  # 遇到错误立即退出

# ----------------------------------------------------------------------------
# 配置变量（请根据实际情况修改）
# ----------------------------------------------------------------------------
API_BASE_URL="http://localhost:3000/api"
SERVER_IP="120.77.170.69"
SSH_USER="root"
SSH_PASSWORD="1QAZ2wsx"
DOMAIN="haoyuai.cn"
ADMIN_EMAIL="lijicheng@lijicheng.cn"

# 临时文件用于存储响应
RESPONSE_FILE="/tmp/siteforge_response_$$.json"
CONTEXT_FILE="/tmp/deployment_context_$$.json"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

check_response() {
    local response_file=$1
    local success=$(jq -r '.success' "$response_file")
    
    if [ "$success" != "true" ]; then
        log_error "API 调用失败！"
        log_error "错误信息: $(jq -r '.message' "$response_file")"
        cat "$response_file" | jq '.'
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
# 主流程
# ----------------------------------------------------------------------------

echo "============================================================================"
echo "siteForge 裸金属 WordPress 自动化部署"
echo "============================================================================"
echo ""
echo "目标服务器: $SERVER_IP"
echo "域名: $DOMAIN"
echo "API 地址: $API_BASE_URL"
echo ""
log_warn "⚠️  请确保域名 $DOMAIN 已正确解析到 $SERVER_IP"
echo ""
read -p "按 Enter 键继续部署..."

# ============================================================================
# Step 1: 准备服务器环境
# ============================================================================

echo ""
echo "============================================================================"
log_info "Step 1: 准备服务器环境（安装 LEMP 栈）"
echo "============================================================================"
echo ""
log_info "预计耗时: 5-10 分钟（取决于服务器配置和网络速度）"
echo ""

curl -s -X POST "$API_BASE_URL/provisioning/bare-metal/prepare-server" \
  -H "Content-Type: application/json" \
  -d "{
    \"ip\": \"$SERVER_IP\",
    \"sshUser\": \"$SSH_USER\",
    \"sshPassword\": \"$SSH_PASSWORD\",
    \"domain\": \"$DOMAIN\"
  }" \
  -o "$RESPONSE_FILE"

if ! check_response "$RESPONSE_FILE"; then
    log_error "Step 1 失败，部署终止。"
    exit 1
fi

log_info "✓ Step 1 完成！"
log_info "LEMP 栈已安装: Nginx + PHP 8.3 + MariaDB"
log_info "防火墙和安全配置已完成"
echo ""

# 提取 deploymentContext
jq -r '.data.deploymentContext' "$RESPONSE_FILE" > "$CONTEXT_FILE"

log_info "部署信息:"
log_info "  - 数据库名: $(jq -r '.dbName' "$CONTEXT_FILE")"
log_info "  - 数据库用户: $(jq -r '.dbUser' "$CONTEXT_FILE")"
log_info "  - WordPress 管理员: $(jq -r '.wpAdminUser' "$CONTEXT_FILE")"
echo ""
log_warn "⚠️  请妥善保管返回的 deploymentContext，其中包含所有密码！"
echo ""

# ============================================================================
# Step 2: 部署 WordPress
# ============================================================================

echo ""
echo "============================================================================"
log_info "Step 2: 部署 WordPress"
echo "============================================================================"
echo ""
log_info "预计耗时: 3-5 分钟"
echo ""

# 构建请求体（包含 deploymentContext 和 SSH 密码）
REQUEST_BODY=$(jq -n \
  --argjson context "$(cat "$CONTEXT_FILE")" \
  --arg sshPassword "$SSH_PASSWORD" \
  '{deploymentContext: $context, sshPassword: $sshPassword}')

curl -s -X POST "$API_BASE_URL/provisioning/bare-metal/deploy-wordpress" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY" \
  -o "$RESPONSE_FILE"

if ! check_response "$RESPONSE_FILE"; then
    log_error "Step 2 失败，部署终止。"
    exit 1
fi

log_info "✓ Step 2 完成！"
log_info "WordPress 已安装并配置"
echo ""

SITE_URL=$(jq -r '.data.siteUrl' "$RESPONSE_FILE")
ADMIN_URL=$(jq -r '.data.adminUrl' "$RESPONSE_FILE")

log_info "网站访问地址: $SITE_URL"
log_info "后台访问地址: $ADMIN_URL"
log_info "管理员账号: $(jq -r '.wpAdminUser' "$CONTEXT_FILE")"
log_info "管理员密码: $(jq -r '.wpAdminPassword' "$CONTEXT_FILE")"
echo ""
log_warn "⚠️  当前使用 HTTP 协议，不安全！请继续 Step 3 配置 HTTPS"
echo ""

# ============================================================================
# Step 3: 配置 HTTPS
# ============================================================================

echo ""
echo "============================================================================"
log_info "Step 3: 配置 HTTPS (SSL 证书)"
echo "============================================================================"
echo ""
log_info "预计耗时: 2-3 分钟"
echo ""
log_warn "⚠️  请确保域名 $DOMAIN 已正确解析，否则证书申请将失败！"
echo ""

# 构建请求体
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
    log_error "Step 3 失败！"
    log_error "可能原因："
    log_error "  1. 域名 DNS 未正确解析"
    log_error "  2. 防火墙未开放 80/443 端口"
    log_error "  3. Let's Encrypt 速率限制（单域名每周最多 5 次失败）"
    exit 1
fi

log_info "✓ Step 3 完成！"
echo ""

SECURE_URL=$(jq -r '.data.secureSiteUrl' "$RESPONSE_FILE")
SECURE_ADMIN_URL=$(jq -r '.data.secureAdminUrl' "$RESPONSE_FILE")

# ============================================================================
# 部署完成总结
# ============================================================================

echo ""
echo "============================================================================"
echo -e "${GREEN}🎉 部署完成！WordPress 网站已成功上线！${NC}"
echo "============================================================================"
echo ""
echo "网站信息:"
echo "  - 前台地址: $SECURE_URL"
echo "  - 后台地址: $SECURE_ADMIN_URL"
echo "  - 管理员账号: $(jq -r '.wpAdminUser' "$CONTEXT_FILE")"
echo "  - 管理员密码: $(jq -r '.wpAdminPassword' "$CONTEXT_FILE")"
echo ""
echo "数据库信息:"
echo "  - 数据库名: $(jq -r '.dbName' "$CONTEXT_FILE")"
echo "  - 数据库用户: $(jq -r '.dbUser' "$CONTEXT_FILE")"
echo "  - 数据库密码: $(jq -r '.dbPassword' "$CONTEXT_FILE")"
echo ""
echo "SSL 证书:"
echo "  - 证书路径: $(jq -r '.data.certificatePath' "$RESPONSE_FILE")"
echo "  - 有效期: 90 天（自动续期）"
echo "  - SSL 评级: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
log_warn "⚠️  请保存上述信息，特别是管理员密码和数据库密码！"
echo ""
log_info "您现在可以访问 $SECURE_URL 查看您的网站了！"
echo ""

exit 0

