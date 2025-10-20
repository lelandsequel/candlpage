import os
import csv
import datetime as dt
from typing import List, Dict
import gspread
from google.oauth2.service_account import Credentials

SCOPE = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

def _get_client():
    json_path = os.getenv("GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON_PATH", "./secrets/google-service-account.json")
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Google Sheets credentials not found at: {json_path}")
    creds = Credentials.from_service_account_file(json_path, scopes=SCOPE)
    return gspread.authorize(creds)

def _ensure_header(ws, header):
    existing = ws.row_values(1) or []
    if existing != header:
        if existing:
            ws.delete_rows(1)
        ws.insert_row(header, 1)

def append_rows(rows: List[Dict]):
    """Append lead data to CSV and optionally to Google Sheets.

    Args:
        rows: List of lead dictionaries to save
    """
    if not rows:
        print("⚠️  No rows to append, skipping output")
        return

    # Always write CSV archive
    date = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs("./out", exist_ok=True)
    header = list(rows[0].keys())
    values = [list(r.values()) for r in rows]
    csv_path = f"./out/leads_{date}.csv"

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(values)
    print(f"✅ CSV saved: {csv_path}")

    # Try to write to Google Sheets (optional)
    try:
        client = _get_client()
        sheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
        if not sheet_id:
            print("⚠️  GOOGLE_SHEETS_SPREADSHEET_ID not set, skipping Google Sheets upload")
            return

        ws_name = os.getenv("GOOGLE_SHEETS_WORKSHEET_NAME", "Leads")
        sh = client.open_by_key(sheet_id)
        try:
            ws = sh.worksheet(ws_name)
        except gspread.exceptions.WorksheetNotFound:
            # Create worksheet if it doesn't exist
            ws = sh.add_worksheet(title=ws_name, rows=1000, cols=30)

        _ensure_header(ws, header)
        ws.append_rows(values, value_input_option="RAW")
        print(f"✅ Google Sheets updated: {len(rows)} rows appended")
    except FileNotFoundError as e:
        print(f"⚠️  Google Sheets credentials not found: {e}")
        print(f"   Data saved to CSV only: {csv_path}")
    except Exception as e:
        print(f"⚠️  Failed to update Google Sheets: {e}")
        print(f"   Data saved to CSV only: {csv_path}")
