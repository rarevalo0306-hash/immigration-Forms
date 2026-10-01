"""Prepare the official USCIS Form I-765 PDF for in-browser filling.

USCIS publishes its forms encrypted (no password to open, but owner restrictions), which
pdf-lib cannot read. Forms of the U.S. government are public domain; this script writes an
unencrypted copy with the same fields to public/forms/i-765.pdf.

Usage:
  1. Download the current edition from https://www.uscis.gov/i-765 (Form I-765, PDF).
  2. pip install pypdf cryptography
  3. python scripts/prepare-i765-pdf.py path/to/i-765.pdf
  4. If the edition date changed, update I765_EDITION in src/forms/i765.ts and check the
     field names in src/pdf/i765Pdf.ts (npm test fills the PDF and fails on unknown fields).
"""

import sys
from pypdf import PdfReader, PdfWriter

src = sys.argv[1] if len(sys.argv) > 1 else "i-765.pdf"
reader = PdfReader(src)
if reader.is_encrypted:
    reader.decrypt("")
writer = PdfWriter(clone_from=reader)
writer.write("public/forms/i-765.pdf")
print("pages:", len(reader.pages), "fields:", len(reader.get_fields() or {}))
