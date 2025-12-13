from django.urls import path
from game.views.settings.getinfo import getinfo
from game.views.settings.login import login_view
from game.views.settings.logout import logout_view
from game.views.settings.register import register

urlpatterns = [
    path('getinfo/', getinfo, name="settings_getinfo"),
    path('login/', login_view, name="settings_login"),
    path('logout/', logout_view, name="settings_logout"),
    path('register/', register, name="settings_register"),
]