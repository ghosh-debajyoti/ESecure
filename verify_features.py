import os
import sys
import httpx
import json

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 60)
    print("AAROHAN END-TO-END FEATURE VERIFICATION SUITE")
    print("=" * 60)
    
    # Check server availability
    try:
        r = httpx.get(f"{BASE_URL}/")
        print(f"[✓] Backend server is reachable: {r.status_code}")
    except Exception as e:
        print(f"[!] Backend server is NOT running at {BASE_URL}. Error: {e}")
        print("    Please start FastAPI server: uvicorn app.main:app --reload")
        sys.exit(1)

    # 1. Test Phishing Email Upload
    print("\n--- TEST 1: Phishing Email Analysis ---")
    phish_path = "~/Desktop/ultimate_test.eml"
    expanded_phish = os.path.expanduser(phish_path)
    
    if not os.path.exists(expanded_phish):
        # Fallback to local script generation
        from generate_test_eml import generate_eml
        generate_eml()
        
    with open(expanded_phish, "rb") as f:
        files = {"file": ("ultimate_test.eml", f, "message/rfc822")}
        resp = httpx.post(f"{BASE_URL}/api/v1/analyze", files=files, timeout=30.0)

    assert resp.status_code == 200, f"Phishing upload failed: {resp.text}"
    phish_data = resp.json()
    phish_case_num = phish_data["case_number"]
    phish_score = phish_data["assertion"]["threat_score"]
    phish_severity = phish_data["assertion"].get("severity", "UNKNOWN")
    risk_inc = phish_data["assertion"].get("risk_increasers", [])
    risk_red = phish_data["assertion"].get("risk_reducers", [])

    print(f"✓ Case Created: {phish_case_num}")
    print(f"✓ Phishing Threat Score: {phish_score}/100 ({phish_severity})")
    print(f"✓ Risk Increasers ({len(risk_inc)}): {[r['factor'] for r in risk_inc]}")
    print(f"✓ Risk Reducers ({len(risk_red)}): {[r['factor'] for r in risk_red]}")
    assert phish_score >= 40.0, f"Expected phishing score >= 40, got {phish_score}"

    # 2. Test Benign Email Upload
    print("\n--- TEST 2: Benign Email Analysis ---")
    from generate_benign_eml import generate_benign_eml
    generate_benign_eml()

    with open("benign_test.eml", "rb") as f:
        files = {"file": ("benign_test.eml", f, "message/rfc822")}
        resp_b = httpx.post(f"{BASE_URL}/api/v1/analyze", files=files, timeout=30.0)

    assert resp_b.status_code == 200, f"Benign upload failed: {resp_b.text}"
    benign_data = resp_b.json()
    benign_case_num = benign_data["case_number"]
    benign_score = benign_data["assertion"]["threat_score"]
    benign_severity = benign_data["assertion"].get("severity", "UNKNOWN")
    b_risk_inc = benign_data["assertion"].get("risk_increasers", [])
    b_risk_red = benign_data["assertion"].get("risk_reducers", [])

    print(f"✓ Case Created: {benign_case_num}")
    print(f"✓ Benign Threat Score: {benign_score}/100 ({benign_severity})")
    print(f"✓ Risk Increasers ({len(b_risk_inc)}): {[r['factor'] for r in b_risk_inc]}")
    print(f"✓ Risk Reducers ({len(b_risk_red)}): {[r['factor'] for r in b_risk_red]}")
    assert benign_score < 40.0, f"Expected benign score < 40, got {benign_score}"
    assert len(b_risk_red) > 0, "Expected risk reducers for benign email"

    # 3. Test Forensic PDF Export
    print("\n--- TEST 3: PDF Export Endpoint ---")
    pdf_resp = httpx.get(f"{BASE_URL}/api/v1/export/{phish_case_num}?explanation_mode=layman&privacy_mode=true")
    assert pdf_resp.status_code == 200, f"PDF export failed: {pdf_resp.text}"
    assert pdf_resp.content.startswith(b"%PDF"), "PDF content does not start with %PDF header"
    print(f"✓ PDF Generated Successfully ({len(pdf_resp.content)} bytes)")

    # Save PDF locally
    with open("test_aarohan_report.pdf", "wb") as f_pdf:
        f_pdf.write(pdf_resp.content)
    print("✓ Saved test PDF report to test_aarohan_report.pdf")

    # 4. Test Privacy Redaction Functions
    print("\n--- TEST 4: Privacy Mode Redaction Logic ---")
    from app.services.report_service import ReportService
    masked_email = ReportService.mask_email("security@example.com")
    masked_name = ReportService.mask_name("John Doe <john.doe@company.com>")
    print(f"✓ Email Redaction: security@example.com -> {masked_email}")
    print(f"✓ Name Redaction: John Doe <john.doe@company.com> -> {masked_name}")
    assert "sec" in masked_email and "•••" in masked_email
    assert "J•••" in masked_name


    print("\n" + "=" * 60)
    print("ALL AAROHAN FEATURE VERIFICATION TESTS PASSED CLEANLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
