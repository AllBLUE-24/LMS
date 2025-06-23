# app/api/v1/leads.py

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from typing import List, Dict, Any
from google.cloud.firestore_v1.client import Client
from google.cloud import firestore  # <<< CHANGE #1: IMPORT ADDED
import pandas as pd
import io
import json
import csv
from pydantic import ValidationError

from app.schemas.lead import Lead, LeadInput
from app.db.firestore import get_db

router = APIRouter()

def process_csv_data(contents: bytes, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    This robustly processes CSV data using Python's built-in csv module,
    avoiding complex pandas logic for maximum reliability.
    """
    processed_records = []
    try:
        # Use a BOM-safe encoding
        decoded_content = contents.decode('utf-8-sig')
        stream = io.StringIO(decoded_content)
        # Use DictReader to automatically handle rows as dictionaries
        reader = csv.DictReader(stream)

        for row in reader:
            record = {}
            # Iterate through the user's mapping instructions
            for file_header, db_field in mapping.items():
                # Clean the file header for matching and check if it exists in the row
                clean_file_header = file_header.strip()
                if clean_file_header in row:
                    record[db_field] = row[clean_file_header]
            processed_records.append(record)
            
    except Exception as e:
        raise ValueError(f"Error processing CSV file: {e}")
        
    return processed_records

def process_excel_data(contents: bytes, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    """ Processes Excel files using pandas, which is necessary for .xlsx format. """
    df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
    # Clean headers from the dataframe to ensure matching
    df.columns = [str(col).strip() for col in df.columns]
    df.rename(columns=mapping, inplace=True)
    return df.to_dict(orient='records')


@router.post("/upload-file", status_code=201)
async def upload_leads_file(mapping: str = Form(...), file: UploadFile = File(...), db: Client = Depends(get_db)):
    """
    Receives a file and mapping, processes it with robust data sanitization,
    validates it, and saves it to Firestore.
    """
    try:
        column_mapping = json.loads(mapping)
        if not isinstance(column_mapping, dict):
            raise ValueError("Mapping must be a valid JSON object.")
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid mapping format: {e}")
    
    if "name" not in column_mapping.values() or "email" not in column_mapping.values():
        raise HTTPException(status_code=400, detail="Mapping is incomplete. You must map columns to both 'name' and 'email'.")

    contents = await file.read()
    try:
        if file.filename.endswith('.csv'):
            processed_records = process_csv_data(contents, column_mapping)
        elif file.filename.endswith('.xlsx'):
            processed_records = process_excel_data(contents, column_mapping)
        else:
            raise HTTPException(status_code=400, detail="Invalid file format.")
    except (ValueError, Exception) as e:
        raise HTTPException(status_code=400, detail=f"Failed to read or process file: {e}")

    # --- Validation Logic with Data Sanitization ---
    validation_errors = []
    leads_to_import: List[LeadInput] = []
    for i, record in enumerate(processed_records):
        try:
            # Clean record by removing keys with None values and empty strings
            clean_record = {k: v for k, v in record.items() if v is not None and v != ''}
            
            if not clean_record.get('status'):
                clean_record['status'] = 'New'
            
            # Now, validate the clean record
            leads_to_import.append(LeadInput(**clean_record))
        except ValidationError as e:
            for error in e.errors():
                field = error['loc'][0]
                msg = error['msg']
                validation_errors.append(f"Row {i + 2}, Column mapped to '{field}': {msg}")

    if validation_errors:
        error_detail_str = ". ".join(sorted(list(set(validation_errors)))[:5])
        raise HTTPException(
            status_code=422,
            detail=f"Found {len(validation_errors)} validation error(s). Please fix your file. Sample errors: {error_detail_str}"
        )

    if not leads_to_import:
        raise HTTPException(status_code=400, detail="No valid lead data found after processing.")

    # --- Duplicate checking and Firestore batch write ---
    imported_count = 0
    duplicate_count = 0
    leads_ref = db.collection('leads')
    batch = db.batch()

    for lead in leads_to_import:
        query = leads_ref.where('email', '==', lead.email).limit(1).stream()
        try:
            next(query)
            duplicate_count += 1
        except StopIteration:
            # --- CHANGE #2: MODIFIED LOGIC TO ADD TIMESTAMP ---
            # 1. Convert the Pydantic model to a dictionary
            lead_data = lead.model_dump(exclude_none=True)
            
            # 2. Add our new server-side timestamp field
            lead_data['createdAt'] = firestore.SERVER_TIMESTAMP

            # 3. Set the modified dictionary in the batch
            new_lead_ref = leads_ref.document()
            batch.set(new_lead_ref, lead_data)
            imported_count += 1

    if imported_count > 0:
        batch.commit()
    
    return {
        "status": "success",
        "imported_count": imported_count,
        "duplicate_count": duplicate_count,
    }

@router.get("/", response_model=List[Lead])
async def get_all_leads(db: Client = Depends(get_db)):
    leads_list = []
    try:
        leads_ref = db.collection('leads')
        docs = docs = leads_ref.stream()
        for doc in docs:
            lead_data = doc.to_dict()
            lead_data['id'] = doc.id
            leads_list.append(lead_data)
        return leads_list
    except Exception as e:
        print(f"An error occurred while fetching leads: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch leads from database")