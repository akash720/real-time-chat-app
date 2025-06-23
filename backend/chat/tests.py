from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from .models import Room, Message, UserProfile


class ModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.room = Room.objects.create(name="Test Room", created_by=self.user)

    def test_room_str(self):
        self.assertEqual(str(self.room), "Test Room")

    def test_message_str(self):
        msg = Message.objects.create(room=self.room, user=self.user, content="Hello!")
        self.assertIn("testuser", str(msg))
        self.assertIn("Hello", str(msg))

    def test_userprofile_str(self):
        profile = UserProfile.objects.create(user=self.user)
        self.assertEqual(str(profile), "testuser")


class APITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="apiuser", password="apipass")
        self.client = APIClient()
        # Obtain JWT token
        response = self.client.post("/api/token/", {"username": "apiuser", "password": "apipass"}, format="json")
        self.assertEqual(response.status_code, 200)
        token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.room = Room.objects.create(name="API Room", created_by=self.user)

    def test_create_room(self):
        response = self.client.post("/api/rooms/", {"name": "New Room"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Room.objects.filter(name="New Room").count(), 1)

    def test_list_rooms(self):
        response = self.client.get("/api/rooms/")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_message(self):
        response = self.client.post("/api/messages/", {"room": self.room.id, "content": "Test message"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.filter(content="Test message").count(), 1)

    def test_list_messages(self):
        Message.objects.create(room=self.room, user=self.user, content="Msg1")
        response = self.client.get("/api/messages/")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_unauthenticated_access(self):
        # Remove credentials
        self.client.credentials()
        response = self.client.get("/api/rooms/")
        self.assertEqual(response.status_code, 401)

    def test_cannot_delete_others_room(self):
        other = User.objects.create_user(username="other", password="otherpass")
        room = Room.objects.create(name="Other Room", created_by=other)
        response = self.client.delete(f"/api/rooms/{room.id}/")
        self.assertEqual(response.status_code, 403)

    def test_cannot_delete_others_message(self):
        other = User.objects.create_user(username="other2", password="otherpass2")
        msg = Message.objects.create(room=self.room, user=other, content="Not yours")
        response = self.client.delete(f"/api/messages/{msg.id}/")
        self.assertEqual(response.status_code, 403)

    def test_create_room_no_name(self):
        response = self.client.post("/api/rooms/", {})
        self.assertEqual(response.status_code, 400)

    def test_create_message_empty_content(self):
        response = self.client.post("/api/messages/", {"room": self.room.id, "content": ""})
        self.assertEqual(response.status_code, 400)

    def test_duplicate_username_registration(self):
        response = self.client.post("/api/users/", {"username": "apiuser", "password": "newpass"})
        self.assertEqual(response.status_code, 400)

    def test_user_registration_and_login(self):
        reg = self.client.post("/api/users/", {"username": "newuser", "password": "newpass"})
        self.assertEqual(reg.status_code, 201)
        login = self.client.post("/api/token/", {"username": "newuser", "password": "newpass"}, format="json")
        self.assertEqual(login.status_code, 200)
        self.assertIn("access", login.data)

    def test_userprofile_online_status(self):
        UserProfile.objects.create(user=self.user, is_online=True)
        response = self.client.get("/api/profiles/online_users/")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_room_messages_endpoint(self):
        Message.objects.create(room=self.room, user=self.user, content="Msg1")
        response = self.client.get(f"/api/rooms/{self.room.id}/messages/")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalidtoken")
        response = self.client.get("/api/rooms/")
        self.assertEqual(response.status_code, 401)
