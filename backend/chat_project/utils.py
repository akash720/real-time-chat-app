from rest_framework.views import exception_handler
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None and response.status_code == 400:
        logger.warning(f"Validation error at {context['request'].path}: {response.data}")
    return response 