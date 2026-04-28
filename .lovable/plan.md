# खुशी ज्वैलर्स — Mortgage Jewellery App

A single-page web app for the shopkeeper to calculate loan amounts against pledged jewellery, generate printable A4 slips, attach a photo of the item, and keep a searchable local history.

## Shop details (pre-filled on every slip)
- **Name:** खुशी ज्वैलर्स / Khushi Jewellers
- **Location:** Bari Pahari, Bihar Sharif, Bihar 803118

## Main screen — Calculator & Slip Form

**Customer details**
- Customer name
- Address
- Phone (required)

**Jewellery details**
- Item name / description (e.g., "22K Gold Chain")
- Weight in grams
- Photo upload button (camera or gallery) — preview shown inline

**Loan details**
- Principal amount (₹) — **manually entered by shopkeeper**
- Interest type toggle: **Simple Interest** ⇄ **Compound Interest**
- Rate of interest (% per month or per year — selectable)
- Time period (months / years)
- Compounding frequency (only for CI: monthly / quarterly / yearly)

**Live calculation panel** (updates as user types)
- Interest amount
- Total payable
- Suggested maturity date (auto-filled from time period, **editable** via date picker — shopkeeper can change it any time, or leave it blank if customer wants an open-ended return date)

**Language toggle** (top of screen): switch all labels and the slip between **हिंदी** and **English** instantly. Default: Hindi.

## Buttons

1. **Calculate** — locks in the figures and reveals the slip preview.
2. **Download Slip (PDF)** — A4-formatted printable slip, ready to print directly.
3. **Save Record** — stores the entry in local history with timestamp.
4. **Upload Jewellery Image** — inline in the form; image is embedded into the slip and saved with the record.

Required fields validated before Calculate: customer name, address, phone, item, weight, principal, rate, time, interest type. Maturity date is optional.

## A4 Slip layout

A clean, print-ready A4 page (portrait):
- Header: shop name (large, Hindi + English), address, slip number, date & time
- Customer block: name, address, phone
- Jewellery block: item name, weight, embedded photo
- Loan block: principal, rate, period, SI/CI type, interest charges, total payable, maturity date (shown only if set)
- Signature lines: **customer signature** and **shopkeeper signature**
- Footer: short terms note

Generated as a real PDF, opens download dialog, prints cleanly on A4.

## Records / History page

Accessible via a "Records" tab in the top nav.

- Table of all saved slips: slip #, date/time, customer name, phone, principal, total payable, status
- Search by customer name or phone; filter by date range
- Click a row → view full slip again, re-download PDF, or mark as "Repaid"
- **Export buttons:**
  - Download all records as **CSV** (for Excel/accounting)
  - Download all records as **PDF report** (printable summary table)

All data stored in browser localStorage. A "Backup all data" button exports a JSON file the shopkeeper can save for safety.

## Design

- Mobile-first, also works great on desktop/tablet
- Warm gold/cream palette fitting a jewellery shop, large readable Hindi + English typography (Noto Sans Devanagari)
- Big tap-friendly buttons, minimal clutter

## Technical notes

- React + Tailwind, single-page, fully client-side
- PDF via `jspdf` + `jspdf-autotable` for A4 slips and reports
- Image stored as base64 in localStorage with the record
- CSV export via Blob download
- i18n via in-app dictionary (hi / en)
- Maturity date uses Shadcn date picker, editable & clearable
- No backend, no login — storage is `localStorage`