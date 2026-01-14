### 如何极速部署网站？

#### 大致流程

```text
浏览器 → HTTPS(443) → Nginx(反向代理+静态文件) → Gunicorn(多进程) → Django(wsgi)
```

#### 具体步骤

```bash
# 安装nginx
sudo apt install nginx -y

# 安装gunicorn
pip install gunicorn

# 在项目根目录下，用gunicorn启动Django项目
gunicorn --bind 127.0.0.1:8080 acapp.wsgi:application

# 配置nginx反向代理
sudo vim /etc/nginx/sites-available/django
```

##### nginx 配置文件内容

```nginx
server {
    server_name ballgame.jaxenwang.top;   # 只匹配这个子域名

    # 所有请求转发给 Gunicorn（用 unix socket）
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件直接由 Nginx 处理（性能最好）
    location /static/ {
        alias /var/www/ballgame/static/;   # 改成你的实际路径
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/ballgame.jaxenwang.top/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/ballgame.jaxenwang.top/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
    if ($host = ballgame.jaxenwang.top) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name ballgame.jaxenwang.top;
    return 404; # managed by Certbot


}
```

```shell
# 测试nginx配置是否正确
sudo nginx -t
# 启用配置
sudo ln -s /etc/nginx/sites-available/django /etc/nginx/sites-enabled
# 重启nginx
sudo systemctl restart nginx
```

##### 可能遇见文件权限的问题，可将静态文件转移或者修改权限

- 转移静态文件

```bash
cp -r /root/acapp/game/static/* /var/www/ballgame/static/
# nginx默认用户是www-data
chown -R www-data:www-data /var/www/ballgame/static
chmod -R 755 /var/www/ballgame/static
```

#### 多个微服务部署示例（主项目 8000 端口，websocket 8001 端口，匹配系统微服务 8002 端口）

```bash
server {
    listen 80;
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # ... 你的 SSL 配置、证书等 ...

    # 主 HTTP 项目（假设用 gunicorn 或 uvicorn 跑在 unix socket 或 8000）
    location / {
        proxy_pass http://unix:/run/main.sock;   # 或 http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 专用路径（注意：必须以 /ws/ 开头，与你路由一致）
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;           # 你的 websocket 后端端口
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 重要：WebSocket 长连接需要较长的超时
        proxy_read_timeout 3600s;      # 1小时，根据需要调整
        proxy_send_timeout 3600s;
    }

    # 如果你的匹配系统也需要通过 Nginx 代理（可选）
    location /match/ {
        proxy_pass http://127.0.0.1:8002/;
        # ... 普通 http 代理头 ...
    }
}
```
