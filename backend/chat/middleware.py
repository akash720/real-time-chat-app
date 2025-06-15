# backend/chat/middleware.py
# No imports at the module level that touch Django

class TokenAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # All Django-related imports are now inside the __call__ method
        from channels.db import database_sync_to_async
        from django.contrib.auth.models import AnonymousUser
        from django.contrib.auth import get_user_model
        from rest_framework_simplejwt.tokens import AccessToken
        import logging

        logger = logging.getLogger(__name__)

        @database_sync_to_async
        def get_user_from_token(token):
            User = get_user_model()
            try:
                access_token = AccessToken(token)
                user = User.objects.get(id=access_token['user_id'])
                return user
            except Exception as e:
                logger.error(f"Error authenticating user from token: {e}")
                return AnonymousUser()

        query_string = scope['query_string'].decode()
        query_params = dict(qp.split('=') for qp in query_string.split('&') if '=' in qp)
        token = query_params.get('token')

        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()

        return await self.app(scope, receive, send) 