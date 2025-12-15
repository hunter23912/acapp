from django.http import JsonResponse
from urllib.parse import quote 
from random import randint
from django.core.cache import cache

def get_state():
    res = ""
    for i in range(8):
        res += str(randint(0, 9))
    return res

def apply_code(request):
    appid = "165"
    redirect_uri = quote("http://113.44.43.227:8000/settings/acwing/web/receive_code/") # 这是授权码回调地址
    scope = "userinfo"
    state = get_state()

    cache.set(state, True, 7200) # 有效期2小时
    apply_code_url = f"https://www.acwing.com/third_party/api/oauth2/web/authorize/" # 这是申请授权码的接口

    return JsonResponse({
        'result': "success",
        'apply_code_url': apply_code_url + f"?appid={appid}&redirect_uri={redirect_uri}&scope={scope}&state={state}",
    })
