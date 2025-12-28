from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

# websocket后端服务器，负责转发玩家逻辑
class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()    
        
    async def disconnect(self, close_code):
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)
    
    async def create_player(self, data):
        self.room_name = ""
        for i in range(0, 1000):
            name = "room-%d" % (i)
            if not cache.has_key(name) or len(cache.get(name)) < settings.ROOM_CAPACITY:
                self.room_name = name
                break
        
        # 如果房间太多，无法加入新房间
        if self.room_name == "":
            return
        
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
        players = cache.get(self.room_name)
        
        # 只在cache中存储用户创建的时间
        players.append({
            'uuid': data['uuid'],
            'username': data['username'],
            'photo': data['photo'],
            'created_at': data.get('created_at', None),
        })
        cache.set(self.room_name, players, 3600) # 房间1小时后过期
        await self.channel_layer.group_send( # 将该消息发送到组内所有人
            self.room_name,
            {
                'type': "group_send_event",
                'event': 'create_player',
                'uuid': data['uuid'],
                'username': data['username'],
                'photo': data['photo'],
            }
        )
    
    async def group_send_event(self, data):
        await self.send(text_data=json.dumps(data))
        
    async def move_to(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': 'move_to',
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )
    
    async def shoot_fireball(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': 'shoot_fireball',
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
                'ball_uuid': data['ball_uuid'],
            }
        )
    
    async def attack(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': 'attack',
                'uuid': data['uuid'],
                'attackee_uuid': data['attackee_uuid'],
                'x': data['x'],
                'y': data['y'],
                'angle': data['angle'],
                'damage': data['damage'],
                'ball_uuid': data['ball_uuid'],       
            }
        )
    
    async def flash(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': 'flash',
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data['event']
        if event == 'create_player':
            await self.create_player(data)
        elif event == 'move_to':
            await self.move_to(data)
        elif event == 'shoot_fireball':
            await self.shoot_fireball(data)
        elif event == 'attack':
            await self.attack(data)
        elif event == 'flash':
            await self.flash(data)