from django.http import JsonResponse
from django.shortcuts import redirect
from django.core.cache import cache
import requests
from django.contrib.auth.models import User
from game.models.player.player import Player
from random import randint

def receive_code(request):
    data = request.GET
    
    if("errorcode" in data):
        return JsonResponse({
            'result': "apply_failed",
            'errcode': data['errcode'],
            'errmsg': data['errmsg']
        })
    
    code = data.get("code")
    state = data.get("state")
    
    if not cache.has_key(state):
        return JsonResponse({
            'result': "state not exist",
        })
    
    cache.delete(state)
    
    apply_access_token_url = "https://www.acwing.com/third_party/api/oauth2/web/access_token/"
    
    params = {
        "appid": "165",
        "secret": "your_app_secret_here",
        "code": code,
        
    }
    
    access_token_res = requests.get(apply_access_token_url, params=params).json()
    
    access_token = access_token_res.get("access_token")
    openid = access_token_res.get("openid")
    
    players = Player.objects.filter(openid=openid)
    if players.exists():
        player = players[0]
        return JsonResponse({
            'result': "success",
            'username': player.user.username,
            'photo': player.photo,
        })
    
    get_userinfo_url = "https://www.acwing.com/third_party/api/oauth2/web/userinfo/"
    params = {
        "access_token": access_token,
        "openid": openid,
    }
    
    userinfo_res = requests.get(get_userinfo_url, params=params).json()
    
    # 从acwing获取用户信息
    username = userinfo_res.get("username")
    photo = userinfo_res.get("photo")

    # 防止用户名重复
    while User.objects.filter(username=username).exists():
        username += str(randint(0, 9))
    
    user = User.objects.create(username=username)
    player = Player.objects.create(user=user, photo=photo, openid=openid)
    
    return JsonResponse({
        'result': "success",
        'username': player.user.username,
        'photo': player.photo,
    })
      
