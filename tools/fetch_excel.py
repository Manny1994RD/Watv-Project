#!/usr/bin/env python3
"""Download the sermon Excel from a Google Drive / Google Sheets / OneDrive share link.

Usage:
    python3 tools/fetch_excel.py "<share link>"      (or set the EXCEL_URL environment variable)

The link must be shared as "Anyone with the link can view". The file is checked to be the
sermon library (it must have the "Catálogo · Catalog" sheet) before it replaces
data/Biblioteca_Sermones_WATV.xlsx, so a wrong or broken link never breaks the site.

Exit code 0 = updated or unchanged, 1 = could not download or not a valid library.
Prints "changed" or "unchanged" on the last line.
"""
import base64
import hashlib
import io
import os
import re
import sys
import urllib.request
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "data" / "Biblioteca_Sermones_WATV.xlsx"
REQUIRED_SHEET = "Catálogo · Catalog"
UA = {"User-Agent": "Mozilla/5.0 (compatible; SermonFinderBot/1.0)"}


def direct_download_url(url):
    """Turn a normal share link into a link that downloads the .xlsx file itself."""
    url = url.strip()
    # Google Sheets (a spreadsheet opened/converted in Google Sheets)
    m = re.search(r"docs\.google\.com/spreadsheets/d/([\w-]+)", url)
    if m:
        return f"https://docs.google.com/spreadsheets/d/{m.group(1)}/export?format=xlsx"
    # An .xlsx file stored in Google Drive
    m = re.search(r"drive\.google\.com/(?:file/d/|open\?id=|uc\?(?:.*&)?id=)([\w-]+)", url)
    if m:
        return f"https://drive.usercontent.google.com/download?id={m.group(1)}&export=download&confirm=t"
    # OneDrive personal (1drv.ms / onedrive.live.com): use the public "shares" API
    if re.search(r"(1drv\.ms|onedrive\.live\.com)", url):
        token = base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")
        return f"https://api.onedrive.com/v1.0/shares/u!{token}/root/content"
    # OneDrive for work/school or SharePoint
    if "sharepoint.com" in url:
        return url + ("&" if "?" in url else "?") + "download=1"
    return url


def main():
    link = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("EXCEL_URL", "")
    if not link:
        print("No link given (pass it as an argument or set EXCEL_URL).")
        return 1
    url = direct_download_url(link)
    print("Downloading the sermon Excel from the shared link…")
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
    except Exception as e:  # noqa: BLE001
        print(f"Could not download the file: {e}")
        print("Check that the link is shared as 'Anyone with the link can view'.")
        return 1

    if not data.startswith(b"PK"):
        print("The link did not return an Excel file (got a web page instead).")
        print("Check that the link is shared as 'Anyone with the link can view'.")
        return 1
    try:
        wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True)
        sheets = wb.sheetnames
    except Exception as e:  # noqa: BLE001
        print(f"The file could not be opened as Excel: {e}")
        return 1
    if REQUIRED_SHEET not in sheets:
        print(f"This Excel has no '{REQUIRED_SHEET}' sheet (found: {', '.join(sheets)}). Not using it.")
        return 1

    old = TARGET.read_bytes() if TARGET.exists() else b""
    if hashlib.sha256(old).digest() == hashlib.sha256(data).digest():
        print("The Excel has not changed.")
        print("unchanged")
        return 0
    TARGET.write_bytes(data)
    print(f"Saved the new Excel ({len(data) / 1024:.0f} KB).")
    print("changed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
