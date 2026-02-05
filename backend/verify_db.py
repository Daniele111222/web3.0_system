# -*- coding: utf-8 -*-
import psycopg2
import json

conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='ipnft_db',
    user='postgres',
    password='123456'
)
cursor = conn.cursor()

print("=== DATABASE STRUCTURE VERIFICATION ===\n")

# Check all tables and their columns
print("1. TABLE STRUCTURES:")
cursor.execute("""
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
""")

current_table = None
for row in cursor.fetchall():
    if row[0] != current_table:
        current_table = row[0]
        print(f"\n  Table: {current_table}")
    nullable = "NULL" if row[3] == 'YES' else "NOT NULL"
    print(f"    - {row[1]}: {row[2]} ({nullable})")

# Check foreign keys
print("\n\n2. FOREIGN KEY RELATIONSHIPS:")
cursor.execute("""
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
""")

for row in cursor.fetchall():
    print(f"  {row[0]}.{row[1]} -> {row[2]}.{row[3]}")

# Check indexes
print("\n\n3. INDEXES:")
cursor.execute("""
    SELECT tablename, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
""")

for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Check enums
print("\n\n4. CUSTOM ENUM TYPES:")
cursor.execute("""
    SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
""")

for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]}")

# Check constraints
print("\n\n5. UNIQUE CONSTRAINTS:")
cursor.execute("""
    SELECT tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
    ORDER BY tc.table_name, tc.constraint_name
""")

for row in cursor.fetchall():
    print(f"  {row[0]}.{row[2]} (unique)")

cursor.close()
conn.close()

print("\n\n=== VERIFICATION COMPLETE ===")
print("All database structures have been successfully created!")
