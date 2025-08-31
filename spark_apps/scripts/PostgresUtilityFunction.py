from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
from sqlalchemy.pool import QueuePool

# Configure connection pooling settings
POOL_SIZE = 5  # Number of connections to maintain
MAX_OVERFLOW = 10  # Maximum number of connections that can be created beyond pool_size
POOL_TIMEOUT = 30  # Timeout in seconds for getting a connection from the pool
POOL_RECYCLE = 3600  # Recycle connections after 1 hour

# Get PostgreSQL credentials from .env
postgres_host = os.getenv("POSTGRES_HOSTNAME")
postgres_port = os.getenv("POSTGRES_PORT")
postgres_db = os.getenv("POSTGRES_DATABASE")
postgres_user = os.getenv("POSTGRES_USERNAME")
postgres_password = os.getenv("POSTGRES_PASSWORD")

def execute_query(query):
    postgres_connection_url = f"postgresql://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"
    # Create an SQLAlchemy engine with connection pooling
    engine = create_engine(
        postgres_connection_url,
        isolation_level="AUTOCOMMIT",
        poolclass=QueuePool,
        pool_size=POOL_SIZE,
        max_overflow=MAX_OVERFLOW,
        pool_timeout=POOL_TIMEOUT,
        pool_recycle=POOL_RECYCLE
    )
    query = text(query)
    try:
        with engine.connect() as connection:
            connection.execute(query)
    except Exception as e:
        error_message = str(e).lower()
        query_str = str(query).lower()
        if "create database" in query_str:
            object_name = query_str.split("database")[-1].split()[0].strip('" ;')
            if "already exists" in error_message:
                print(f"Database '{object_name}' already exists")
                return
        elif "create table" in query_str:
            object_name = query_str.split("table")[-1].split()[0].strip('" ;')
            if "already exists" in error_message:
                print(f"Table '{object_name}' already exists")
                return
        print(f"Query execution failed:\n '{query}' \n:  {e}")

