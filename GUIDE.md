# Django 开发学习记录

本项目记录了基于 Django 的完整开发流程与关键技术实现，适合自学与查阅。

---

## 1. Django 项目基础操作

### 1.1 初始化项目

```bash
django-admin startproject myproject
```

### 1.2 启动开发服务器

```bash
python manage.py runserver 0.0.0.0:8000
```

### 1.3 创建应用骨架

```bash
python manage.py startapp game
```

### 1.4 创建超级用户

```bash
python manage.py createsuperuser
```

### 1.5 .gitignore 示例

```gitignore
**/__pycache__/ # 匹配任意层级的子目录
*.swap  # 匹配任意目录下的所有.swap 文件
```

---

## 2. 项目架构与目录说明

- models：数据库模型
- views：视图函数
- urls：路由分发
- templates：HTML 模板
- static：静态资源（css/js/images/audio）
  - `js/src/`：前端源码
  - `js/dist/`：合并压缩后的 JS
- consumers：WebSocket 相关逻辑

---

## 3. 部署与 Nginx 配置

### 3.1 容器端口映射

```shell
docker commit CONTAINER_NAME django_lesson:1.1
docker stop CONTAINER_NAME
docker rm CONTAINER_NAME
docker run -p 20000:22 -p 8000:8000 -p 80:80 -p 443:443 --name CONTAINER_NAME -itd django_lesson:1.1
```

### 3.2 Nginx 配置与证书

- 配置文件写入 `/etc/nginx/nginx.conf`
- 证书文件写入 `/etc/nginx/cert/`
- 启动 nginx：

```shell
sudo /etc/init.d/nginx.start
```

### 3.3 Django 配置修改

- 修改 `settings.py` 的 `ALLOWED_HOSTS` 和 `DEBUG`
- 收集静态文件：

```shell
python manage.py collectstatic
```

### 3.4 配置 uwsgi

- uwsgi.ini 示例：

```ini
[uwsgi]
socket = 127.0.0.1:8000
chdir = /home/acs/acapp
wsgi-file = acapp/wsgi.py
master = true
processes = 2
threads = 5
vacuum = true
```

- 启动 uwsgi：

```shell
uwsgi --ini scripts/uwsgi.ini
```

---

## 4. 用户管理系统开发

### 4.1 数据库迁移

```shell
python manage.py makemigrations
python manage.py migrate
```

### 4.2 注册与登录流程

- 视图处理数据和业务逻辑
- 路由负责链接与函数映射
- 前端 JS 调用后端接口

---

## 5. 集成 Redis 与第三方登录

### 5.1 集成 Redis

- 安装依赖：

  ```shell
  pip install django_redis
  ```

- `settings.py` 配置：

  ```python
  CACHES = {
    'default': {
      'BACKEND': 'django_redis.cache.RedisCache',
      'LOCATION': 'redis://127.0.0.1:6379/1',
      "OPTIONS": {
        "CLIENT_CLASS": "django_redis.client.DefaultClient",
      },
    },
  }
  USER_AGENTS_CACHE = 'default'
  ```

- 启动 Redis：

  ```shell
  sudo redis-server /etc/redis/redis.conf
  ```

### 5.2 实现 OAuth2 第三方登录

- OAuth2 认证流程：

  ```mermaid
  sequenceDiagram
  participant 用户浏览器
  participant 客户端(你的网站)
  participant 第三方平台

    用户浏览器->>客户端(你的网站): 点击“第三方登录”
    客户端(你的网站)->>用户浏览器: 跳转到第三方授权页面
    用户浏览器->>第三方平台: 请求授权码
    第三方平台-->>用户浏览器: 展示授权页面
    用户浏览器->>第三方平台: 用户同意授权
    第三方平台-->>用户浏览器: 重定向回调地址并携带授权码
    用户浏览器->>客户端(你的网站): 携带授权码访问回调地址
    客户端(你的网站)->>第三方平台: 用授权码换取access_token
    第三方平台-->>客户端(你的网站): 返回access_token
    客户端(你的网站)->>第三方平台: 用access_token请求用户信息
    第三方平台-->>客户端(你的网站): 返回用户信息
    客户端(你的网站)->>用户浏览器: 完成登录
  ```

---

## 6. 前端开发与构建

- 所有 JS 代码写在 src
- 修改后运行：

  ```shell
  python scripts/compress_js.py
  ```

- 合并输出到 `dist/game.js`
- 不要直接编辑 `dist/game.js`

---

## 7. 实现联机对战系统

### 7.1 统一长度单位

### 7.2 增加“联机对战”模式

### 7.3 配置 Django Channels

- 安装 channels：

  ```shell
  pip install channels
  ```

- 启动 WebSocket 服务：

  ```shell
  daphne -b 0.0.0.0 -p 8081 acapp.asgi:application
  ```

- 远程 Redis 需开放 6379 端口，修改 `/etc/redis/redis.conf` 允许外部连接并关闭保护模式

### 7.4 编写同步函数

- 需要同步的 4 个函数：
  - `create player`
  - `move to`
  - `shoot fireball`
  - `attack`

---

## 8. 实现聊天系统

- 实现类似于 LOL 游戏内的在线聊天功能

---

## 9. 实现匹配系统

- 设计并实现玩家匹配逻辑

### 9.1 Thrift 跨语言 RPC

- Thrift 是一个开源 RPC 框架，用于跨语言服务通信
- 用 Thrift 定义接口，生成客户端/服务器代码

#### thrift 服务端

- 数据结构 Player，封装玩家信息
- 线程安全队列 queue，作为生产者-消费者缓冲区。thrift 服务收到`add_player`请求（生产者）时，把玩家对象放入队列；匹配线程（消费者）从队列取出玩家放入池中。
- Pool 匹配池
- worker 线程：不断尝试从队列取玩家，取到则放入池，取不到时，尝试在池里做匹配，然后再循环。

- 总结：资源是`Player`。`MatchHandler.add_player`是生产者，将玩家放入线程安全的消息队列，`worker`是消费者，从队列中取出玩家，放入`Pool`并执行匹配。
- 整体流程：
  - 客户端通过 thrift 调用`add_player`，玩家入队。
  - `worker`从队列中取出玩家并放入`Pool`。
  - 当池中人数达到 3 人以上，尝试按分差和等待时间规则匹配，匹配成功的三人被移除池。
  - 未匹配的玩家继续等待，下一轮再尝试。

---

## 10. 前端 JS 压缩与混淆

- 使用 terser 压缩混淆 JS 代码

  ```shell
  apt install npm
  npm install terser -g
  terser game.js -c -m
  ```
