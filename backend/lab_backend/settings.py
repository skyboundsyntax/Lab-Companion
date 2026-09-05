import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Automatically load environment variables from backend/.env or root .env
for _env_path in [BASE_DIR / '.env', BASE_DIR.parent / '.env']:
    if _env_path.exists():
        try:
            with open(_env_path, 'r', encoding='utf-8') as _f:
                for _line in _f:
                    _line = _line.strip()
                    if _line and not _line.startswith('#') and '=' in _line:
                        _k, _v = _line.split('=', 1)
                        os.environ.setdefault(_k.strip(), _v.strip().strip("'").strip('"'))
        except Exception:
            pass


# SECURITY: DEBUG mode toggle (default: True in dev, must be False in production)
DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 'yes')

# SECURITY WARNING: Never hardcode production secrets in the repository!
_RAW_SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY')
if _RAW_SECRET_KEY:
    SECRET_KEY = _RAW_SECRET_KEY
elif DEBUG:
    # Deterministic local dev key for testing only
    SECRET_KEY = 'django-insecure-lab-companion-development-fallback-key-2026-local-only'
else:
    raise RuntimeError("CRITICAL SECURITY ERROR: DJANGO_SECRET_KEY environment variable MUST be set when DJANGO_DEBUG=False!")

_ALLOWED_HOSTS_RAW = os.environ.get('DJANGO_ALLOWED_HOSTS', '*' if DEBUG else 'localhost,127.0.0.1')
ALLOWED_HOSTS = [h.strip() for h in _ALLOWED_HOSTS_RAW.split(',') if h.strip()]
if 'testserver' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('testserver')


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'corsheaders',

    # Local apps
    'api.apps.ApiConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'lab_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'lab_backend.wsgi.application'

# Database Configuration: Supabase PostgreSQL, Local PostgreSQL, or SQLite fallback
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('SUPABASE_DB_URL')
USE_POSTGRES = os.environ.get('USE_POSTGRES', '').lower() in ('true', '1', 'yes') or bool(os.environ.get('POSTGRES_DB')) or bool(DATABASE_URL)

if DATABASE_URL:
    import urllib.parse
    _db_url = urllib.parse.urlparse(DATABASE_URL)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': _db_url.path.lstrip('/') or 'postgres',
            'USER': urllib.parse.unquote(_db_url.username or 'postgres'),
            'PASSWORD': urllib.parse.unquote(_db_url.password or ''),
            'HOST': _db_url.hostname or 'localhost',
            'PORT': str(_db_url.port or 5432),
        }
    }
elif USE_POSTGRES:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('POSTGRES_DB', os.environ.get('DB_NAME', 'postgres')),
            'USER': os.environ.get('POSTGRES_USER', os.environ.get('DB_USER', 'postgres')),
            'PASSWORD': os.environ.get('POSTGRES_PASSWORD', os.environ.get('DB_PASSWORD', '')),
            'HOST': os.environ.get('POSTGRES_HOST', os.environ.get('DB_HOST', 'localhost')),
            'PORT': os.environ.get('POSTGRES_PORT', os.environ.get('DB_PORT', '5432')),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Custom User Model
AUTH_USER_MODEL = 'api.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
}

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL', 'True' if DEBUG else 'False').lower() in ('true', '1', 'yes')
_CORS_ORIGINS_RAW = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _CORS_ORIGINS_RAW:
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _CORS_ORIGINS_RAW.split(',') if o.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-user-id',
    'x-user-role',
    'x-user-email',
]

# Email & SMTP Configuration for Real OTP Delivery
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 'yes')
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'Lab Companion Security <auth@labcompanion.edu>')

# Supabase Auth Configuration for Real Email OTP Delivery
SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

# Production Security Headers & Cookies (Active when DJANGO_DEBUG=False)
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    if os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1', 'yes'):
        SECURE_SSL_REDIRECT = True
    if os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1', 'yes'):
        SESSION_COOKIE_SECURE = True
    if os.environ.get('CSRF_COOKIE_SECURE', 'False').lower() in ('true', '1', 'yes'):
        CSRF_COOKIE_SECURE = True
    if os.environ.get('SECURE_HSTS_SECONDS'):
        try:
            SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', 31536000))
            SECURE_HSTS_INCLUDE_SUBDOMAINS = True
            SECURE_HSTS_PRELOAD = True
        except ValueError:
            pass

