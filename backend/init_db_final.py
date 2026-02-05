# -*- coding: utf-8 -*-
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# First, check if database exists and create it if needed
conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='postgres',
    user='postgres',
    password='123456'
)
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
cursor = conn.cursor()

cursor.execute("SELECT 1 FROM pg_database WHERE datname='ipnft_db'")
exists = cursor.fetchone()

if not exists:
    print("Creating database ipnft_db...")
    cursor.execute('CREATE DATABASE ipnft_db')
    print("Database created successfully!")
else:
    print("Database ipnft_db already exists")

cursor.close()
conn.close()

# Now connect to ipnft_db and create tables
print("\nConnecting to ipnft_db...")
conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='ipnft_db',
    user='postgres',
    password='123456'
)

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
print("\nTables in database:")
for table in tables:
    print(f"  - {table[0]}")

cursor.close()
conn.close()
print("\nDatabase initialization complete!")
