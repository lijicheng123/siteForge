#!/bin/bash
# ============================================================================
# 测试脚本：只重新运行 Step 3（SSL 配置）
# ============================================================================

set -e  # 遇到错误立即退出

# ============================================================================
# 配置参数
# ============================================================================
TARGET_HOST="120.77.170.69"
SITE_DOMAIN="haoyuai.cn"
SSH_USER="root"
SSH_PASSWORD="1QAZ2wsx"
ADMIN_EMAIL="lijicheng@lijicheng.cn"
API_BASE_URL="http://localhost:3000/api"

# 从上次部署获取的 deploymentContext（你需要填写这些值）
# 这些值在 Step 2 成功时返回，如果你没有保存，可以从服务器读取
DB_NAME="wp_haoyuaicn_b0353d"  # 从服务器 wp-config.php 获取
DB_USER="wpuser_haoyuaicn_2533"  # 从服务器 wp-config.php 获取
DB_PASSWORD="你需要从服务器获取"  # 从服务器 wp-config.php 获取
WP_ADMIN_USER="admin"  # WordPress 管理员用户名
WP_ADMIN_PASSWORD="你需要从服务器获取"  # WordPress 管理员密码
WP_ADMIN_EMAIL="lijicheng@lijicheng.cn"

echo "============================================================================"
echo "siteForge 裸金属 WordPress - 只重新运行 Step 3（SSL 配置）"
echo "============================================================================"
echo ""
echo "目标服务器: $TARGET_HOST"
echo "域名: $SITE_DOMAIN"
echo ""

# ============================================================================
# Step 3: 配置 HTTPS
# ============================================================================
echo "============================================================================"
echo "[INFO] Step 3: 配置 HTTPS（重新运行）"
echo "============================================================================"
echo ""
echo "[INFO] 证书通知邮箱: $ADMIN_EMAIL"
echo ""

STEP3_RESPONSE=$(curl -s -X POST "$API_BASE_URL/provisioning/bare-metal/secure-ssl" \
  -H "Content-Type: application/json" \
  -d '{
    "deploymentContext": {
      "targetHost": "'"$TARGET_HOST"'",
      "siteDomain": "'"$SITE_DOMAIN"'",
      "sshUser": "'"$SSH_USER"'",
      "sshPassword": "'"$SSH_PASSWORD"'",
      "dbName": "'"$DB_NAME"'",
      "dbUser": "'"$DB_USER"'",
      "dbPassword": "'"$DB_PASSWORD"'",
      "wpAdminUser": "'"$WP_ADMIN_USER"'",
      "wpAdminPassword": "'"$WP_ADMIN_PASSWORD"'",
      "wpAdminEmail": "'"$WP_ADMIN_EMAIL"'",
      "wpSaltKeys": {}
    },
    "adminEmail": "'"$ADMIN_EMAIL"'"
  }')

# 检查结果
if echo "$STEP3_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo ""
    echo "============================================================================"
    echo "✅ Step 3 成功！HTTPS 已配置"
    echo "============================================================================"
    echo "$STEP3_RESPONSE" | jq -r '.secureSiteUrl // "https://'"$SITE_DOMAIN"'"'
    echo ""
    
    echo "============================================================================"
    echo "🎉 部署完成！"
    echo "============================================================================"
    echo ""
    echo "📌 网站地址:"
    echo "   前台: https://$SITE_DOMAIN"
    echo "   后台: https://$SITE_DOMAIN/wp-admin"
    echo ""
    
    # 测试访问
    echo "[INFO] 测试 HTTPS 访问..."
    sleep 3
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$SITE_DOMAIN" || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ HTTPS 访问正常 (HTTP $HTTP_CODE)"
    else
        echo "⚠️  HTTPS 访问异常 (HTTP $HTTP_CODE)"
        echo "   请手动访问: https://$SITE_DOMAIN"
    fi
else
    echo ""
    echo "============================================================================"
    echo "❌ Step 3 失败！"
    echo "============================================================================"
    echo "$STEP3_RESPONSE" | jq '.'
    exit 1
fi

echo ""
echo "============================================================================"
echo "测试完成"
echo "============================================================================"

