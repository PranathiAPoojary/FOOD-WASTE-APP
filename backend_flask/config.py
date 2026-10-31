import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.environ.get('PORT', 5000))
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1')
    
    # Database connection parameters (supports DATABASE_URL or individual PG params)
    DATABASE_URL = os.environ.get('DATABASE_URL')
    SQL_HOST = os.environ.get('SQL_HOST', 'localhost')
    SQL_USER = os.environ.get('SQL_USER', 'postgres')
    SQL_PASSWORD = os.environ.get('SQL_PASSWORD', 'postgres')
    SQL_DB_NAME = os.environ.get('SQL_DB_NAME', 'foodcycle')
    SQL_PORT = os.environ.get('SQL_PORT', '5432')

    SECRET_KEY = os.environ.get('SECRET_KEY', 'foodcycle-secure-dev-key-2026')
