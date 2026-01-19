import csv
import os

DATA_FILE = 'data/waste_data.csv'

def init_db():
    if not os.path.exists('data'):
        os.makedirs('data')
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['date', 'meal_type', 'food_item', 'produced_kg', 'leftover_kg', 'reason', 'recorded_by', 'diversion_type'])

def save_waste_data(data):
    init_db()
    # Check if header needs updating (simple migration if file exists but old schema)
    # For this dev context, we'll append. Ideally we'd migrate.
    # We will just append the new field at the end.
    
    with open(DATA_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            data.get('date'),
            data.get('meal_type'),
            data.get('food_item'),
            data.get('produced_kg'),
            data.get('leftover_kg'),
            data.get('reason'),
            data.get('recorded_by'),
            data.get('diversion_type', 'Disposed') # Default to Disposed
        ])

def get_all_data():
    init_db()
    data = []
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return []
    return data
