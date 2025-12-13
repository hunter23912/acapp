from django.http import JsonResponse
from django.contrib.auth import logout

def logout_view(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({
            'result': "用户未登录"
        })
    logout(request) # 删除cookie
    return JsonResponse({
        'result': "success"
    })