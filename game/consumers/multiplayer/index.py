from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = ""
        for i in range(1000):
            name = "room-%d" % (i)
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:
                self.room_name = name
                break
        
        # 如果房间太多，无法加入新房间
        if self.room_name == "":
            return
        await self.accept()
        
        if not cache.has_key(self.room_name):
            cache.set(self.room_name, [], 3600) # 房间1小时后过期
        
        for player in cache.get(self.room_name):
            await self.send(text_data=json.dumps({  # dumps将Python对象转换为JSON字符串
                'event': 'create_player',
                'uuid': player['uuid'],
                'username': player['username'],
                'photo': player['photo'],
            }))
    
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        
    async def disconnect(self, close_code):
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)
    
    async def create_player(self, data):
        players = cache.get(self.room_name)
        players.append({
            'uuid': data['uuid'],
            'username': data['username'],
            'photo': data['photo'],
        })
        cache.set(self.room_name, players, 3600) # 房间1小时后过期
        await self.channel_layer.group_send( # 将该消息发送到组内所有人
            self.room_name,
            {
                'type': "group_create_player",
                'event': 'create_player',
                'uuid': data['uuid'],
                'username': data['username'],
                'photo': data['photo'],
            }
        )
    
    async def group_create_player(self, data):
        await self.send(text_data=json.dumps(data))
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data['event']
        if event == 'create_player':
            await self.create_player(data)