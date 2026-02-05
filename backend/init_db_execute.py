# -*- coding: utf-8 -*-
import psycopg2
import sys

try:
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="ipnft_db",
        user="postgres",
        password="123456"
    )
    print("Database connection successful!")
    
    # Read and execute SQL script
    with open('create_tables.sql', 'r', encoding='utf-8') as f:
        sql_script = f.read()
    
    cursor = conn.cursor()
    cursor.execute(sql_script)
    conn.commit()
    print("Tables created successfully!")
    
    # Verify tables
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    tables = cursor.fetchall()
    print("\nCreated tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    cursor.close()
    conn.close()
    print("\nDatabase initialization complete!")
    
except psycopg2.OperationalError as e:
    error_msg = str(e)
    if "database" in error_msg.lower() and "does not exist" in error_msg.lower():
        print("ERROR: Database 'ipnft_db' does not exist!")
        print("\nTo create the database, run in PostgreSQL:")
        print("  CREATE DATABASE ipnft_db;")
    else:
        print(f"Connection Error: {error_msg}")
except UnicodeDecodeError as e:
    print("ERROR: Database connection failed with encoding issue.")
    print("This usually means the password is incorrect.")
    print(f"Details: {e}")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
