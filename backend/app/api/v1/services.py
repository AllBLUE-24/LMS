import io
import csv
import pandas as pd
from typing import List, Dict, Any
from google.cloud import firestore

# ======================================================================================
# Configuration
# ======================================================================================
STATISTICS_TRACKED_FIELDS = {
    "source": "leadsBySource",
    "location": "leadsByLocation",
    "status": "leadsByStatus",
    "assignedAgent": "leadsByAssignedAgent",
    "nurturerId": "leadsByNurturerId",
}

# ======================================================================================
# Statistics Service Functions
# ======================================================================================

def _update_statistics(batch: firestore.WriteBatch, stats_doc_ref: firestore.DocumentReference, updates: Dict[str, Any]):
    for field_path, increment in updates.items():
        if increment != 0:
            batch.update(stats_doc_ref, {field_path: firestore.Increment(increment)})

def update_stats_on_create(batch: firestore.WriteBatch, stats_doc_ref: firestore.DocumentReference, new_lead_data: Dict[str, Any]):
    updates = {"totalLeads": 1}
    for field, map_name in STATISTICS_TRACKED_FIELDS.items():
        if value := new_lead_data.get(field):
            updates[f"{map_name}.{value}"] = 1
    _update_statistics(batch, stats_doc_ref, updates)

def update_stats_on_delete(batch: firestore.WriteBatch, stats_doc_ref: firestore.DocumentReference, old_lead_data: Dict[str, Any]):
    updates = {"totalLeads": -1}
    for field, map_name in STATISTICS_TRACKED_FIELDS.items():
        if value := old_lead_data.get(field):
            updates[f"{map_name}.{value}"] = -1
    _update_statistics(batch, stats_doc_ref, updates)

def update_stats_on_update(batch: firestore.WriteBatch, stats_doc_ref: firestore.DocumentReference, old_lead_data: Dict[str, Any], new_lead_data: Dict[str, Any]):
    updates = {}
    for field, map_name in STATISTICS_TRACKED_FIELDS.items():
        old_value = old_lead_data.get(field)
        new_value = new_lead_data.get(field)
        if old_value != new_value:
            if old_value:
                field_path = f"{map_name}.{old_value}"
                updates[field_path] = updates.get(field_path, 0) - 1
            if new_value:
                field_path = f"{map_name}.{new_value}"
                updates[field_path] = updates.get(field_path, 0) + 1
    _update_statistics(batch, stats_doc_ref, updates)

# ======================================================================================
# File Processing Helper Functions
# ======================================================================================

def process_csv_data(contents: bytes, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    processed_records = []
    try:
        decoded_content = contents.decode('utf-8-sig')
        stream = io.StringIO(decoded_content)
        reader = csv.DictReader(stream)
        for row in reader:
            record = {}
            for file_header, db_field in mapping.items():
                clean_file_header = file_header.strip()
                if clean_file_header in row and row[clean_file_header] is not None:
                    record[db_field] = row[clean_file_header]
            processed_records.append(record)
    except Exception as e:
        raise ValueError(f"Error processing CSV file: {e}")
    return processed_records

def process_excel_data(contents: bytes, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    try:
        df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
        df.columns = [str(col).strip() for col in df.columns]
        clean_mapping = {k.strip(): v for k, v in mapping.items()}
        df.rename(columns=clean_mapping, inplace=True)
        records = df.to_dict(orient='records')
        return [{str(k): v for k, v in rec.items()} for rec in records]
    except Exception as e:
        raise ValueError(f"Error processing Excel file: {e}")
