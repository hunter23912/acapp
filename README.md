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
- models
  - 存储数据的结构，class, User
- views
  - 函数视图
- urls
  - 路由，决定调用哪个函数
- templates
  - 保存html文件

