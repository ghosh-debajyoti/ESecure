from app.services.report_service import ReportService

case_data = {
    "case_number": "CAS-12345678",
    "created_at": "2026-09-03T19:15:00+05:30",
    "trace": { "headers": {}, "relay_route": [] },
    "property": { "indicators": [{"type": "URL", "value": "http://evil.com", "reputation": {"virustotal_score": "5/90", "phishtank_status": "Valid Phish"}}], "attachments": [], "mime_boundaries": [], "tlsh_hash": "T123456" },
    "assertion": { "threat_score": 95.0, "is_coordinated_campaign": True, "lookalikes": ["CAS-87654321"], "technical_flags": {"spf_pass": False, "dkim_pass": False, "dmarc_pass": False} },
    "evidence_custody": { "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }
}

try:
    pdf_buffer = ReportService.generate_pdf(case_data)
    with open("test_report.pdf", "wb") as f:
        f.write(pdf_buffer.read())
    print("PDF generated successfully!")
except Exception as e:
    print(f"Failed: {e}")
