# Demo files

Sample files that `scripts/seed-demo.mjs` uploads and sends in the demo chats (by the patient).
Everything in this folder except this README is ignored by git, so sample documents never reach the repo.

- `reports/`        lab reports, scans, ECG, X-ray (PDF or image)
- `checkups/`       photos of BP/sugar readings, rash photos, thermometer, etc.
- `prescriptions/`  old paper prescriptions a patient shares when they first message

Formats: PDF, JPG, PNG or WEBP, 10 MB max each. Files are used round-robin, so 3–6 per folder is plenty.
Use only made-up or fully anonymised documents: no real patient names, numbers or faces.
