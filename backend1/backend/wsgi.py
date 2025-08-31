"""
WSGI config for backend project.
"""

import os
import sys
from django.core.wsgi import get_wsgi_application

# Add the project root (backend1) to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set the settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()
