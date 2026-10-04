"""Prepare an official USCIS form PDF for in-browser filling.

USCIS publishes its forms encrypted (no password to open, but owner restrictions), which
pdf-lib cannot read. Forms of the U.S. government are public domain; this script writes an
unencrypted copy with the same fields.

Usage:
  1. Download the current edition from uscis.gov (for example https://www.uscis.gov/n-400).
  2. pip install pypdf cryptography
  3. python scripts/prepare-uscis-pdf.py path/to/n-400.pdf public/forms/n-400.pdf
  4. If the edition date changed, update the edition in src/forms/<form>.ts and check the
     field names in src/pdf/<form>Pdf.ts (npm test fills the PDF and fails on unknown fields).
"""

import sys
from pypdf import PdfReader, PdfWriter

if len(sys.argv) != 3:
    sys.exit(__doc__)
src, out = sys.argv[1], sys.argv[2]
reader = PdfReader(src)
if reader.is_encrypted:
    reader.decrypt("")
PdfWriter(clone_from=reader).write(out)
print("pages:", len(reader.pages), "fields:", len(reader.get_fields() or {}))
