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
vim /etc/nginx/sites-available/django

server {
    server_name ballgame.jaxenwang.top;   # 只匹配这个子域名

    # 所有请求转发给 Gunicorn（用 unix socket）
    location / {
        proxy_pass http://127.0.0.1:8000;
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

#### 使用 systemd 管理服务

- `match` 服务

```bash
sudo vim /etc/systemd/system/ballgame-match.service
```

##### `ballgame-match.service` 内容

```ini
[Unit]
Description=Ballgame Match Microservice
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=/root/acapp/match_system/src
Environment="PYTHONUNBUFFERED=1"
# 使用绝对路径指向 Python 解释器
ExecStart=/root/acapp/match_system/src/main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

- `web` 服务

```bash
sudo vim /etc/systemd/system/ballgame-web.service
```

##### `ballgame-web.service` 内容

```ini
[Unit]
Description=Ballgame Django Web (daphne)
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=/root/acapp
# 环境变量确保 Python 输出不被缓存，方便查看日志
Environment="PYTHONUNBUFFERED=1"
# 这里的路径请确保是指向你虚拟环境或系统 Python 的 gunicorn
ExecStart=/root/.pyenv/shims/daphne -b 127.0.0.1 -p 8000 acapp.asgi:application
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

#### 看 systemd 服务日志

```bash
journalctl -u ballgame-web -n 20 --no-pager
```

#### 刷新 systemd 配置并启动服务

```bash
sudo systemctl daemon-reload
```
