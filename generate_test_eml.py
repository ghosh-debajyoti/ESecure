import os
from email.message import EmailMessage

def generate_eml():
    msg = EmailMessage()
    msg['Subject'] = 'Urgent: Action Required on Your Account'
    msg['From'] = 'admin@paypal-security.com'
    msg['To'] = 'user@company.com'
    msg['Date'] = 'Thu, 03 Sep 2026 10:15:00 +0000'
    msg['Message-ID'] = '<suspicious-id-999@paypal-security.com>'

    # Add Received headers (MTA routing hops)
    # The most recent hop should be added first (top of the headers)
    msg.add_header('Received', 'from gateway.company.com ([142.250.190.46]) by mx.company.com with ESMTP; Thu, 03 Sep 2026 10:15:00 +0000')
    msg.add_header('Received', 'from unknown-attacker.net ([45.33.32.156]) by gateway.company.com with SMTP; Thu, 03 Sep 2026 10:14:50 +0000')

    # Body containing a dummy safe-browsing URL
    body = (
        "Dear Customer,\n\n"
        "We detected unusual activity on your account. Please click the link below to verify your identity:\n"
        "http://paypal-security-update.com/login-verify\n\n"
        "Additionally, we have attached the latest invoice report for your reference.\n\n"
        "Regards,\n"
        "Security Team"
    )
    msg.set_content(body)

    # Disguised VBS attachment with suspicious YARA-triggering strings
    vbs_content = b'AutoOpen()\nSet objShell = CreateObject("WScript.Shell")\nobjShell.Run "powershell.exe -e ZWNobyBoYWNrZWQ="'
    msg.add_attachment(
        vbs_content,
        maintype='text',
        subtype='plain',
        filename='invoice_report.vbs'
    )

    desktop_path = os.path.expanduser('~/Desktop/ultimate_test.eml')
    with open(desktop_path, 'wb') as f:
        f.write(bytes(msg))
        
    print(f"Successfully generated EML and saved to: {desktop_path}")

if __name__ == "__main__":
    generate_eml()
