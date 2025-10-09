#!/bin/bash
# ============================================================================
# WordPress 性能优化验证脚本
# 适用于：2核2G 服务器，方案四混合优化
# ============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查项计数
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}WordPress 性能优化验证（方案四：2核2G配置）${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# ============================================================================
# 1. PHP-FPM 配置检查
# ============================================================================
echo -e "${YELLOW}[1/10] 检查 PHP-FPM 配置...${NC}"

# 检查 PHP-FPM 进程池配置
if grep -q "pm.max_children = 20" /etc/php-fpm.d/www.conf 2>/dev/null; then
    echo -e "${GREEN}✓${NC} PHP-FPM max_children = 20 (针对2G内存优化)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} PHP-FPM max_children 未优化"
    ((FAILED++))
fi

# 检查 OPcache 配置
OPCACHE_MEM=$(php -r "echo ini_get('opcache.memory_consumption');")
if [ "$OPCACHE_MEM" -ge "256" ]; then
    echo -e "${GREEN}✓${NC} OPcache 内存: ${OPCACHE_MEM}M (已优化)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} OPcache 内存: ${OPCACHE_MEM}M (建议 >= 256M)"
    ((WARNINGS++))
fi

# 检查文件上传大小
UPLOAD_SIZE=$(php -r "echo ini_get('upload_max_filesize');")
if [ "$UPLOAD_SIZE" = "64M" ]; then
    echo -e "${GREEN}✓${NC} 文件上传大小: $UPLOAD_SIZE (已设置)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} 文件上传大小: $UPLOAD_SIZE (应为 64M)"
    ((FAILED++))
fi

echo ""

# ============================================================================
# 2. MySQL/MariaDB 配置检查
# ============================================================================
echo -e "${YELLOW}[2/10] 检查 MySQL/MariaDB 配置...${NC}"

# 检查 InnoDB Buffer Pool
BUFFER_POOL=$(mysql -N -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';" 2>/dev/null | awk '{print $2}')
BUFFER_POOL_MB=$((BUFFER_POOL / 1024 / 1024))
if [ "$BUFFER_POOL_MB" -ge "512" ]; then
    echo -e "${GREEN}✓${NC} InnoDB Buffer Pool: ${BUFFER_POOL_MB}M (针对2G内存优化)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} InnoDB Buffer Pool: ${BUFFER_POOL_MB}M (应为 512M)"
    ((FAILED++))
fi

# 检查最大连接数
MAX_CONN=$(mysql -N -e "SHOW VARIABLES LIKE 'max_connections';" 2>/dev/null | awk '{print $2}')
if [ "$MAX_CONN" -ge "150" ]; then
    echo -e "${GREEN}✓${NC} Max Connections: $MAX_CONN (并发100够用)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Max Connections: $MAX_CONN (建议 >= 150)"
    ((WARNINGS++))
fi

echo ""

# ============================================================================
# 3. Redis 服务检查
# ============================================================================
echo -e "${YELLOW}[3/10] 检查 Redis 服务...${NC}"

if systemctl is-active --quiet redis; then
    echo -e "${GREEN}✓${NC} Redis 服务运行中"
    ((PASSED++))
    
    # 检查 Redis 内存配置
    REDIS_MEM=$(redis-cli CONFIG GET maxmemory 2>/dev/null | tail -1)
    REDIS_MEM_MB=$((REDIS_MEM / 1024 / 1024))
    if [ "$REDIS_MEM_MB" -ge "256" ]; then
        echo -e "${GREEN}✓${NC} Redis 最大内存: ${REDIS_MEM_MB}M"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Redis 最大内存: ${REDIS_MEM_MB}M (建议 256M)"
        ((WARNINGS++))
    fi
    
    # 测试 Redis 连接
    if redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✓${NC} Redis 连接正常"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Redis 连接失败"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Redis 服务未运行"
    ((FAILED++))
fi

echo ""

# ============================================================================
# 4. Nginx FastCGI Cache 检查
# ============================================================================
echo -e "${YELLOW}[4/10] 检查 Nginx FastCGI Cache...${NC}"

if [ -d "/var/cache/nginx/fastcgi_cache" ]; then
    echo -e "${GREEN}✓${NC} FastCGI 缓存目录存在"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} FastCGI 缓存目录不存在"
    ((FAILED++))
fi

if grep -q "fastcgi_cache_path" /etc/nginx/nginx.conf 2>/dev/null; then
    echo -e "${GREEN}✓${NC} FastCGI Cache 已配置"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} FastCGI Cache 未配置"
    ((FAILED++))
fi

if grep -q "fastcgi_cache WORDPRESS" /etc/nginx/conf.d/*.conf 2>/dev/null; then
    echo -e "${GREEN}✓${NC} 虚拟主机已启用 FastCGI Cache"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} 虚拟主机可能未启用 FastCGI Cache"
    ((WARNINGS++))
fi

echo ""

# ============================================================================
# 5. 系统内核参数检查
# ============================================================================
echo -e "${YELLOW}[5/10] 检查系统内核参数...${NC}"

# 检查 TCP BBR
BBR=$(sysctl net.ipv4.tcp_congestion_control 2>/dev/null | awk '{print $3}')
if [ "$BBR" = "bbr" ]; then
    echo -e "${GREEN}✓${NC} TCP BBR 拥塞控制已启用"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} TCP BBR 未启用 (当前: $BBR)"
    ((WARNINGS++))
fi

# 检查 vm.swappiness
SWAPPINESS=$(sysctl vm.swappiness 2>/dev/null | awk '{print $3}')
if [ "$SWAPPINESS" -le "10" ]; then
    echo -e "${GREEN}✓${NC} vm.swappiness = $SWAPPINESS (已优化)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} vm.swappiness = $SWAPPINESS (建议 <= 10)"
    ((WARNINGS++))
fi

# 检查文件句柄限制
FILE_MAX=$(sysctl fs.file-max 2>/dev/null | awk '{print $3}')
if [ "$FILE_MAX" -ge "65536" ]; then
    echo -e "${GREEN}✓${NC} fs.file-max = $FILE_MAX (已优化)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} fs.file-max = $FILE_MAX (建议 >= 65536)"
    ((WARNINGS++))
fi

echo ""

# ============================================================================
# 6. WordPress 插件检查
# ============================================================================
echo -e "${YELLOW}[6/10] 检查 WordPress 性能插件...${NC}"

# 查找 WordPress 安装目录
WP_DIR=$(find /var/www -maxdepth 2 -name "wp-config.php" -type f 2>/dev/null | head -1 | xargs dirname)

if [ -n "$WP_DIR" ]; then
    # 检查 Redis Object Cache 插件
    if wp plugin is-installed redis-cache --path="$WP_DIR" --allow-root 2>/dev/null; then
        if wp plugin is-active redis-cache --path="$WP_DIR" --allow-root 2>/dev/null; then
            echo -e "${GREEN}✓${NC} Redis Object Cache 插件已安装并激活"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠${NC} Redis Object Cache 插件已安装但未激活"
            ((WARNINGS++))
        fi
    else
        echo -e "${RED}✗${NC} Redis Object Cache 插件未安装"
        ((FAILED++))
    fi
    
    # 检查页面缓存插件
    if wp plugin is-active wp-super-cache --path="$WP_DIR" --allow-root 2>/dev/null || \
       wp plugin is-active w3-total-cache --path="$WP_DIR" --allow-root 2>/dev/null; then
        echo -e "${GREEN}✓${NC} 页面缓存插件已激活"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} 建议安装页面缓存插件（WP Super Cache）"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} 未找到 WordPress 安装目录，跳过插件检查"
    ((WARNINGS++))
fi

echo ""

# ============================================================================
# 7. Nginx 配置检查
# ============================================================================
echo -e "${YELLOW}[7/10] 检查 Nginx 配置...${NC}"

# 检查 worker_processes
WORKERS=$(grep "worker_processes" /etc/nginx/nginx.conf 2>/dev/null | grep -v "#" | awk '{print $2}' | tr -d ';')
if [ "$WORKERS" = "2" ] || [ "$WORKERS" = "auto" ]; then
    echo -e "${GREEN}✓${NC} Nginx worker_processes = $WORKERS (2核CPU优化)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Nginx worker_processes = $WORKERS (建议 2 或 auto)"
    ((WARNINGS++))
fi

# 检查 gzip 压缩
if grep -q "gzip on" /etc/nginx/nginx.conf 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Gzip 压缩已启用"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Gzip 压缩未启用"
    ((FAILED++))
fi

# 检查 client_max_body_size
CLIENT_SIZE=$(grep -r "client_max_body_size" /etc/nginx/conf.d/*.conf 2>/dev/null | head -1 | awk '{print $2}' | tr -d ';')
if echo "$CLIENT_SIZE" | grep -q "64"; then
    echo -e "${GREEN}✓${NC} client_max_body_size = $CLIENT_SIZE"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} client_max_body_size = $CLIENT_SIZE (应为 64M)"
    ((FAILED++))
fi

echo ""

# ============================================================================
# 8. 系统资源使用情况
# ============================================================================
echo -e "${YELLOW}[8/10] 检查系统资源使用情况...${NC}"

# 内存使用
MEM_TOTAL=$(free -m | grep "Mem:" | awk '{print $2}')
MEM_USED=$(free -m | grep "Mem:" | awk '{print $3}')
MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))

if [ "$MEM_PERCENT" -lt "80" ]; then
    echo -e "${GREEN}✓${NC} 内存使用: ${MEM_USED}M / ${MEM_TOTAL}M (${MEM_PERCENT}%)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} 内存使用过高: ${MEM_USED}M / ${MEM_TOTAL}M (${MEM_PERCENT}%)"
    ((FAILED++))
fi

# CPU 负载
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
echo -e "${BLUE}ℹ${NC} CPU 负载 (1分钟): $LOAD_AVG"

# 磁盘使用
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt "80" ]; then
    echo -e "${GREEN}✓${NC} 磁盘使用: ${DISK_USAGE}%"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} 磁盘使用: ${DISK_USAGE}% (偏高)"
    ((WARNINGS++))
fi

echo ""

# ============================================================================
# 9. 服务状态检查
# ============================================================================
echo -e "${YELLOW}[9/10] 检查关键服务状态...${NC}"

for service in nginx php-fpm mariadb redis; do
    if systemctl is-active --quiet $service; then
        echo -e "${GREEN}✓${NC} $service 服务运行中"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $service 服务未运行"
        ((FAILED++))
    fi
done

echo ""

# ============================================================================
# 10. 性能测试（如果有域名）
# ============================================================================
echo -e "${YELLOW}[10/10] 执行简单性能测试...${NC}"

# 尝试找到配置的域名
DOMAIN=$(grep -r "server_name" /etc/nginx/conf.d/*.conf 2>/dev/null | head -1 | awk '{print $3}' | tr -d ';')

if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
    echo "测试域名: $DOMAIN"
    
    # HTTP 响应测试
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}\n' http://$DOMAIN 2>/dev/null || echo "0")
    if [ "$RESPONSE_TIME" != "0" ]; then
        echo -e "${BLUE}ℹ${NC} HTTP 响应时间: ${RESPONSE_TIME}s"
        
        # 检查是否命中缓存
        CACHE_STATUS=$(curl -I http://$DOMAIN 2>/dev/null | grep -i "X-Cache-Status" | awk '{print $2}' | tr -d '\r')
        if [ -n "$CACHE_STATUS" ]; then
            echo -e "${BLUE}ℹ${NC} FastCGI Cache 状态: $CACHE_STATUS"
        fi
    else
        echo -e "${YELLOW}⚠${NC} 无法连接到网站"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} 未找到配置的域名，跳过性能测试"
    ((WARNINGS++))
fi

echo ""

# ============================================================================
# 总结报告
# ============================================================================
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}验证结果总结${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}通过项: $PASSED${NC}"
echo -e "${RED}失败项: $FAILED${NC}"
echo -e "${YELLOW}警告项: $WARNINGS${NC}"
echo ""

if [ "$FAILED" -eq "0" ]; then
    echo -e "${GREEN}✓ 所有关键项检查通过！性能优化配置正确。${NC}"
    exit 0
elif [ "$FAILED" -le "3" ]; then
    echo -e "${YELLOW}⚠ 部分检查未通过，但不影响基本运行。建议修复失败项。${NC}"
    exit 0
else
    echo -e "${RED}✗ 多个关键检查失败，请检查配置！${NC}"
    exit 1
fi

