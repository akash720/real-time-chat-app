import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room, Message
from django.contrib.auth.models import User
from collections import defaultdict

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    online_users = defaultdict(set)  # Dictionary to store online users per room: {room_id: set of user_ids}

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"
        self.user_id = self.scope["user"].id

        logger.info(f"User {self.user_id} connected to room {self.room_id}")

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Add user to online users set and broadcast
        self.online_users[self.room_id].add(self.user_id)
        logger.info(f"Online users in room {self.room_id}: {self.online_users[self.room_id]}")
        await self.broadcast_online_users_count()

    async def disconnect(self, close_code):
        logger.info(f"User {self.user_id} disconnecting from room {self.room_id} with code {close_code}")

        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        # Remove user from online users set and broadcast
        if self.user_id in self.online_users[self.room_id]:
            self.online_users[self.room_id].remove(self.user_id)
            logger.info(f"User {self.user_id} removed from online_users for room {self.room_id}.")
        else:
            logger.warning(f"User {self.user_id} not found in online_users for room {self.room_id} during disconnect.")

        logger.info(f"Online users in room {self.room_id} after disconnect: {self.online_users[self.room_id]}")
        await self.broadcast_online_users_count()

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        user_id = text_data_json["user_id"]

        # Get user information
        user = await self.get_user(user_id)

        # Save message to database
        await self.save_message(user_id, message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": message, "user_id": user_id, "username": user.username},
        )

    async def chat_message(self, event):
        message = event["message"]
        user_id = event["user_id"]
        username = event["username"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message, "user_id": user_id, "username": username}))

    async def broadcast_online_users_count(self):
        count = len(self.online_users[self.room_id])
        logger.info(f"Broadcasting online users count for room {self.room_id}: {count}")
        await self.channel_layer.group_send(self.room_group_name, {"type": "online_users_count", "count": count})

    async def online_users_count(self, event):
        count = event["count"]
        await self.send(text_data=json.dumps({"type": "online_users_count", "count": count}))

    @database_sync_to_async
    def save_message(self, user_id, message):
        user = User.objects.get(id=user_id)
        room = Room.objects.get(id=self.room_id)
        Message.objects.create(user=user, room=room, content=message)

    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)
