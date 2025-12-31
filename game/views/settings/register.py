from django.contrib.auth.models import User
from game.models.player.player import Player
from rest_framework.views import APIView
from rest_framework.response import Response

class PlayerView(APIView):
    def post(self, request):
        data = request.POST
        username = data.get('username', "").strip() # 去掉前后空格
        password = data.get('password', "").strip()
        password_confirm = data.get('password_confirm', "").strip()
        if not username or not password:
            return Response({
                'result': "用户名或密码不能为空"
            })
        if password != password_confirm:
            return Response({
                'result': "两次输入的密码不一致"
            })
        if User.objects.filter(username=username).exists():
            return Response({
                'result': "用户名已存在"
            })
        user = User(username=username)
        user.set_password(password)
        user.save()
        Player.objects.create(user=user, photo="https://pica.zhimg.com/v2-e65b6412a8c6ae4739f84c7d4b9d927c_1440w.jpg")
        return Response({
            'result': "success"
        })
        
