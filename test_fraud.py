from app.services.fraud_type_service import FraudTypeService

def test_fraud_classifier():
    emails = [
        {
            "subject": "ACTION REQUIRED: Invoice Attached",
            "body": "Please find the attached invoice. Your payment is overdue. Download the PDF to view the remittance."
        },
        {
            "subject": "Microsoft Support: Virus Detected",
            "body": "Your computer is infected with a virus. Call us immediately at toll-free 1-800-123-4567 to get a refund for your subscription."
        },
        {
            "subject": "Update on Project Q3",
            "body": "Hi team, let's meet tomorrow to discuss the quarterly goals. Thanks."
        }
    ]
    
    for i, e in enumerate(emails):
        fraud = FraudTypeService.classify_fraud_type(e["body"], e["subject"])
        print(f"Email {i+1} => Fraud Type: {fraud}")

if __name__ == "__main__":
    test_fraud_classifier()
