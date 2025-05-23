import sqlite3
DATABASE_NAME = 'kcm_data.db' # Make sure this path is correct if script is not in same dir

def add_cabinet_columns():
    conn = sqlite3.connect(DATABASE_NAME)
    cursor = conn.cursor()
    columns_to_add = []
    for i in range(1, 6): # 5 members
        for lang in ['en', 'sq', 'sr']:
            columns_to_add.append(f"cabinet_member_{i}_name_{lang} TEXT")
    
    existing_columns_query = "PRAGMA table_info(indicators);"
    cursor.execute(existing_columns_query)
    existing_column_names = [row[1] for row in cursor.fetchall()]

    added_count = 0
    for col_def in columns_to_add:
        col_name = col_def.split()[0] # e.g., "cabinet_member_1_name_en"
        if col_name not in existing_column_names:
            try:
                alter_sql = f"ALTER TABLE indicators ADD COLUMN {col_def};"
                cursor.execute(alter_sql)
                print(f"Added column: {col_name}")
                added_count += 1
            except sqlite3.OperationalError as e:
                print(f"Error adding column {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")
    
    conn.commit()
    conn.close()
    if added_count > 0:
        print(f"Successfully added {added_count} new columns to 'indicators' table.")
    else:
        print("No new columns were added (they might all exist already or there were errors).")

if __name__ == '__main__':
    add_cabinet_columns()