import psycopg2
import sys

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="ipnft_db",
        user="postgres",
        password="postgres"
    )
    print("Database connection successful!")
    conn.close()
except psycopg2.OperationalError as e:
    print(f"OperationalError: {e}")
    print("\nPlease check:")
    print("1. PostgreSQL service is running")
    print("2. Database 'ipnft_db' exists (create it in pgAdmin if not)")
    print("3. Username and password are correct")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
