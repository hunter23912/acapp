from django.db import models
from django.contrib.auth.models import User

class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # 当user删除时，对应的Player也会被删除
    photo = models.URLField(max_length=200, blank=True)

    def __str__(self):
        return str(self.user)