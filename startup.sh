#!/bin/bash

# 颜色定义，方便观察输出
GREEN='\033[0;32m'
NC='\033[0m' # 无颜色

echo -e "${GREEN}正在重新加载服务配置...${NC}"
systemctl daemon-reload

echo -e "${GREEN}正在启动 匹配微服务...${NC}"
systemctl restart ballgame-match

echo -e "${GREEN}正在启动 Django Web服务...${NC}"
systemctl restart ballgame-web

echo -e "${GREEN}所有服务已启动！状态如下：${NC}"
echo "--------------------------------------"
systemctl status ballgame-match --no-pager | grep "Active:"
systemctl status ballgame-web --no-pager | grep "Active:"
echo "--------------------------------------"
echo "提示：使用 'journalctl -u ballgame-match -f' 查看实时日志"
