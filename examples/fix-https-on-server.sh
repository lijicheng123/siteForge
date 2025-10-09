#!/bin/bash
# ============================================================================
# 服务器上直接修复 HTTPS 配置
# ============================================================================

echo "=========================================="
echo "WordPress HTTPS 配置修复"
echo "=========================================="

# 提取数据库配置
DB_NAME=$(sudo grep "DB_NAME" /var/www/haoyuai.cn/wp-config.php | sed -n "s/.*define.*'DB_NAME'.*'\(.*\)'.*/\1/p")
DB_USER=$(sudo grep "DB_USER" /var/www/haoyuai.cn/wp-config.php | sed -n "s/.*define.*'DB_USER'.*'\(.*\)'.*/\1/p")
DB_PASS=$(sudo grep "DB_PASSWORD" /var/www/haoyuai.cn/wp-config.php | sed -n "s/.*define.*'DB_PASSWORD'.*'\(.*\)'.*/\1/p")

echo "1. 更新数据库中的 URL..."
mysql -u "$DB_USER" -p"$DB_PASS" << EOF
USE $DB_NAME;
UPDATE wp_options SET option_value = 'https://haoyuai.cn' WHERE option_name = 'siteurl';
UPDATE wp_options SET option_value = 'https://haoyuai.cn' WHERE option_name = 'home';
SELECT option_name, option_value FROM wp_options WHERE option_name IN ('siteurl', 'home');
EOF

echo ""
echo "2. 备份 wp-config.php..."
sudo cp /var/www/haoyuai.cn/wp-config.php /var/www/haoyuai.cn/wp-config.php.backup-$(date +%Y%m%d-%H%M%S)

echo ""
echo "3. 在 wp-config.php 中添加 HTTPS 配置..."
sudo bash -c 'cat > /tmp/https-config.txt << "EOF"

// BEGIN ANSIBLE MANAGED BLOCK - HTTPS Configuration
/**
 * 强制使用 HTTPS - 由 SiteForge 自动配置
 */
// 处理反向代理的 HTTPS 头
if (isset($_SERVER["HTTP_X_FORWARDED_PROTO"]) && $_SERVER["HTTP_X_FORWARDED_PROTO"] === "https") {
    $_SERVER["HTTPS"] = "on";
}

// 强制定义站点 URL（优先级高于数据库）
define("WP_HOME", "https://haoyuai.cn");
define("WP_SITEURL", "https://haoyuai.cn");
define("FORCE_SSL_ADMIN", true);
// END ANSIBLE MANAGED BLOCK - HTTPS Configuration
EOF
'

# 检查是否已存在配置
if ! grep -q "ANSIBLE MANAGED BLOCK - HTTPS Configuration" /var/www/haoyuai.cn/wp-config.php; then
    # 在 <?php 后面插入
    sudo sed -i '1 r /tmp/https-config.txt' /var/www/haoyuai.cn/wp-config.php
    echo "✅ HTTPS 配置已添加"
else
    echo "ℹ️  HTTPS 配置已存在，跳过"
fi

echo ""
echo "4. 重启 PHP-FPM..."
sudo systemctl restart php-fpm

echo ""
echo "5. 测试访问..."
sleep 2
curl -I https://haoyuai.cn 2>&1 | head -15

echo ""
echo "=========================================="
echo "修复完成！"
echo "=========================================="
echo ""
echo "📌 请访问以下地址测试:"
echo "   https://haoyuai.cn"
echo "   https://haoyuai.cn/wp-admin"
echo ""

