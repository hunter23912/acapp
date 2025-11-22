# 一个伟大的关于django的巨著
在这里我会记录django的开发流程

## django开发中常用操作
### 初始化django项目
```bash
django-admin startproject myproject
```

### 启动django开发服务器
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
### .gitignore通配符示例
```gitignore
**/__pycache__/
```
匹配任意层级的子目录

```gitignore
*.swap
```
匹配任意目录下的所有.swap文件


## 应用知识
### 架构介绍
- `models`管理数据库数据
- `views`管理`http`函数
- `urls`管理路由，即链接与函数的对应关系
- `templates`管理html文件
- `static`管理静态文件
  - `css`对象的格式，比如位置、长宽、颜色背景、字体大小等
    - 通常一个项目的`css`文件就一个
  - `js`对象的逻辑，比如对象的创建与销毁、事件函数、移动、变色等
    - 通常一个项目的`js`文件有很多个
    - `src`存放原代码，便于开发和维护
    - `dist`存放经过打包、压缩、合并后的`js`文件
  - `images`图片文件
  - `audio`音频文件
- `consumers`管理`websocket`函数
### 项目结构
#### 菜单

#### 对战界面

#### 设置

