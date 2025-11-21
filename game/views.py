from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    line1 = '<h1 style="text-align: center">我的第一个网页</h1>'
    line2 = '<a href="/play/">进入游戏界面</a>'
    line3 = '<hr>'
    line4 = '<img src="https://picx.zhimg.com/80/v2-c97459abdb3d10e178df9282b3ff0a37_720w.webp" width=600>'
    return HttpResponse(line1 + line2 + line3 + line4)

def play(request):
    line1 = '<h1 style="text-align: center">游戏界面</h1>'
    line2 = '<a href="/">返回首页</a>'
    line3 = '<hr>'
    line4 = '<img src="https://pic1.zhimg.com/v2-b57f5ab63c62e11cdccd8b8f4575454c_xld.gif?source=1d2f5c51" width=1000>'
    return HttpResponse(line1 + line2 + line3 + line4)