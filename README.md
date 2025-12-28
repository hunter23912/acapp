# 一个伟大的关于 django 的巨著

在这里我会记录 django 的开发流程

## django 开发中常用操作

### 初始化 django 项目

```bash
django-admin startproject myproject
```

### 启动 django 开发服务器

```bash
python manage.py runserver 0.0.0.0:8000
```

### 创建新的应用骨架

```bash
python manage.py startapp game
```

### 创建超级用户

```bash
python manage.py createsuperuser
```

### .gitignore 通配符示例

```gitignore
**/__pycache__/ # 匹配任意层级的子目录

*.swap # 匹配任意目录下的所有.swap 文件
```

## 应用知识

### 架构介绍

- `game`
  - `models`管理数据库数据
    - `player`
  - `views`管理`http`函数
    - `index.py` `return multiends/web.html`
    - `menu`
    - `playground`
    - `settings`
      - `getinfo.py`
      - `login.py`
      - `logout.py`
      - `register.py`
  - `urls`管理路由，即链接与函数的对应关系
    - `index.py`
    - `menu`
      - `index.py`
    - `playground`
      - `index.py`
    - `settings`
      - `index.py`
  - `templates`管理 html 文件
    - `multiends`
      - `web.html`
  - `static`管理静态文件
    - `css`对象的格式，比如位置、长宽、颜色背景、字体大小等
      - 通常一个项目的`css`文件就一个
    - `js`对象的逻辑，比如对象的创建与销毁、事件函数、移动、变色等
      - 通常一个项目的`js`文件有很多个
      - `src`存放原代码，便于开发和维护
        - `menu`
        - `playground`
          - `ac_game_object`
          - `game_map`
          - `particle`粒子效果
          - `player`
          - `skill`
            - `fireball`
          - `socket`
            - `multiplayer`
        - `settings`
      - `dist`存放经过打包、压缩、合并后的`js`文件
    - `images`图片文件
    - `audio`音频文件
  - `consumers`管理`websocket`函数
    - `multiplayer`
      - `index.py`

### 项目结构

#### 菜单

#### 对战界面

#### 设置

## 5.部署 nginx 与对接 acapp

### 1.增加容器映射端口：80 和 443

- 登录容器，关闭所运行中的任务
- 登录运行容器的服务器，然后执行

```shell
docker commit CONTAINER_NAME django_lesson:1.1 # 将容器保存成镜像，将CONTAINER_NAME替换成容器名称
docker stop CONTAINER_NAME # 关闭容器
docker rm CONTAINER_NAME # 删除容器

# 使用保存的镜像重新创建容器
docker run -p 20000:22 -p 8000:8000 -p 80:80 -p 443:443 --name CONTAINER_NAME -itd django_lesson:1.1
```

### 2.创建 nginx 配置文件以及 https 证书

将`nginx.conf`中的内容写入服务器`/etc/nginx/nginx.conf`文件中。
将`acapp.key`内容写到服务`/etc/nginx/cert/acapp.key`文件中。
将`acapp.pem`内容写到服务`/etc/nginx/cert/acapp.pem`文件中。
然后启动 nginx 服务

```shell
sudo /etc/init.d/nginx.start
```

### 3.修改 django 项目的配置

- 打开 `settings.py` 文件：
  - 将分配的域名添加到`ALLOWED_HOSTS`列表中，注意只需要添加`https://`后面的部分。
  - 令`DEBUG = false`。
- 归档`static`文件
  - `python manage.py collectstatic`

### 4.配置 uwsgi

- 在 django 项目中添加 uwsgi 的配置文件：`scripts/uwsgi.ini`，内容如下：

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

启动 uwsgi 服务：

```shell
uwsgi --ini scripts/uwsgi.ini
```

## 6.1 创建用户管理系统

### 1.django 的更新数据库命令

```shell
python manage.py makemigrations

python manage.py migrate
```

### 2.注册登录时涉及的后端交互

- `views` 处理数据，与数据库交互，处理业务逻辑
- `urls` 处理路由，链接与函数的映射
- `js` 前端如何调用

## 6.2 实现第三方登录（OAuth2 协议）

### 1.在 django 中集成 redis

- 安装`django_redis`
  `pip install django_redis`

- 配置`settings.py`

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

- 启动`redis-server`
  `sudo redis-server /etc/redis/redis.conf`

### 2.web 端一键登录

- OAuth2 认证流程

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

## 7. 实现联机对战系统

### 1.统一长度单位

### 2.增加“联机对战”模式

### 3.配置 django_channels

启动`django_channels`:在`~/acapp`目录下执行：

```shell
daphne -b 0.0.0.0 -p 5015 acapp.asgi:application
```

专门用来执行 websocket 服务器

### 4.编写同步函数

需要同步的 4 个函数：

- `create player`
- `move to`
- `shoot fireball`
- `attack`
