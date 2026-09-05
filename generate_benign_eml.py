import os
from email.message import EmailMessage

def generate_benign_eml():
    msg = EmailMessage()
    msg['Subject'] = 'Quarterly Operations & Project Roadmap Review'
    msg['From'] = 'Alice Smith <alice@acmecorp.com>'
    msg['To'] = 'Bob Jones <bob@acmecorp.com>'
    msg['Reply-To'] = 'alice@acmecorp.com'
    msg['Date'] = 'Thu, 03 Sep 2026 11:00:00 +0000'
    msg['Message-ID'] = '<valid-msg-777@acmecorp.com>'
    msg['Authentication-Results'] = 'mx.acmecorp.com; spf=pass (sender IP is 198.51.100.12); dkim=pass header.d=acmecorp.com; dmarc=pass'

    msg.add_header('Received', 'from mail.acmecorp.com ([198.51.100.12]) by mx.acmecorp.com with ESMTP; Thu, 03 Sep 2026 11:00:00 +0000')

    body = (
        "Hi Bob,\n\n"
        "Here is the summary for our Q4 operations review. All key milestones and team objectives are progressing on schedule.\n\n"
        "Please let me know if you need any additional reports before the executive meeting tomorrow.\n\n"
        "Best regards,\n"
        "Alice Smith\n"
        "Operations Director\n"
        "Acme Corp"
    )
    msg.set_content(body)

    out_path = 'benign_test.eml'
    with open(out_path, 'wb') as f:
        f.write(bytes(msg))
        
    print(f"Successfully generated benign test EML at: {out_path}")

if __name__ == "__main__":
    generate_benign_eml()
