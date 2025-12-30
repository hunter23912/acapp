from django.db import models
from django.contrib.auth.models import User

class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # 当user删除时，对应的Player也会被删除
    photo = models.URLField(max_length=200, blank=True)
    openid = models.CharField(max_length=50, blank=True, null=True) # 作为第三方登录的唯一标识符
    score = models.IntegerField(default=1500)

    def __str__(self):
        return str(self.user)