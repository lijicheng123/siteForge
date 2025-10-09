#!/bin/bash
# ============================================================================
# 镜像源验证脚本
# ============================================================================
# 用途: 验证所有国内镜像源是否可访问
# 使用: bash scripts/verify-mirrors.sh
# ============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 计数器
TOTAL=0
SUCCESS=0
FAILED=0

echo "=========================================="
echo "国内镜像源可访问性验证"
echo "=========================================="
echo ""

# 测试函数
test_url() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 ${name}... "
    
    # 使用 curl 测试，设置超时 10 秒
    if curl -I -L --max-time 10 --silent --fail "${url}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        SUCCESS=$((SUCCESS + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "  URL: ${url}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 测试函数（仅测试连接，不检查 HTTP 状态码）
test_url_connection() {
    local name=$1
    local url=$2
    
    TOTAL=$((TOTAL + 1))
    echo -n "测试 ${name}... "
    
    # 使用 curl 测试连接，设置超时 10 秒
    if curl --max-time 10 --silent --head "${url}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 通过${NC}"
        SUCCESS=$((SUCCESS + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "  URL: ${url}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. WP-CLI 镜像源"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_url "WP-CLI (Gitee)" \
    "https://gitee.com/fuckgitee2speed/wp-bare-metal-mirrors/raw/main/wp-cli.phar"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. EPEL 镜像源"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_url_connection "EPEL 根目录" \
    "https://mirrors.tuna.tsinghua.edu.cn/epel/"

test_url_connection "EPEL 9 仓库" \
    "https://mirrors.tuna.tsinghua.edu.cn/epel/9/Everything/x86_64/"

test_url_connection "EPEL GPG 密钥" \
    "https://mirrors.tuna.tsinghua.edu.cn/epel/RPM-GPG-KEY-EPEL-9"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Remi 镜像源"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_url_connection "Remi 根目录" \
    "https://mirrors.tuna.tsinghua.edu.cn/remi/"

test_url "Remi Release RPM (Rocky 9)" \
    "https://mirrors.tuna.tsinghua.edu.cn/remi/enterprise/remi-release-9.rpm"

test_url_connection "Remi PHP 8.3 仓库" \
    "https://mirrors.tuna.tsinghua.edu.cn/remi/enterprise/9/php83/x86_64/"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. MariaDB 配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}ℹ️  MariaDB 使用 Rocky Linux AppStream 仓库（未配置镜像）${NC}"

echo ""
echo "=========================================="
echo "验证结果汇总"
echo "=========================================="
echo "总计: ${TOTAL} 个测试"
echo -e "${GREEN}成功: ${SUCCESS}${NC}"
echo -e "${RED}失败: ${FAILED}${NC}"
echo "=========================================="

if [ ${FAILED} -eq 0 ]; then
    echo -e "${GREEN}✓ 所有镜像源验证通过！${NC}"
    echo ""
    echo "可以安全地运行部署 playbook："
    echo "  ansible-playbook playbooks/playbook_step1_prepare_server.yml ..."
    exit 0
else
    echo -e "${RED}✗ 有 ${FAILED} 个镜像源验证失败！${NC}"
    echo ""
    echo "请检查："
    echo "  1. 网络连接是否正常"
    echo "  2. 防火墙是否阻止了访问"
    echo "  3. 镜像站是否正在维护"
    echo ""
    echo "可以访问镜像站状态页面："
    echo "  https://mirrors.tuna.tsinghua.edu.cn/status/"
    exit 1
fi

