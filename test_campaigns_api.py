from fastapi.testclient import TestClient
from app.main import app
import sys

client = TestClient(app)

def test_campaign_routes():
    # Create campaign
    response = client.post("/api/campaigns/?name=TestCampaign")
    assert response.status_code == 200
    campaign_id = response.json()["id"]
    print(f"Created campaign with ID: {campaign_id}")

    # Update DNA
    dna_payload = {
        "dna": {
            "targetAudience": {"demographics": "Test Demo", "psychographics": "Test Psycho"},
            "coreMessage": "Buy more things",
            "tone": ["Energetic", "Professional"],
            "primaryGoal": "Credential Harvesting",
            "brandGuidelines": {"primaryColor": "#ff0000", "slogan": "We are great"}
        }
    }
    
    response = client.patch(f"/api/campaigns/{campaign_id}/dna", json=dna_payload)
    assert response.status_code == 200
    updated = response.json()
    assert updated["dna"]["targetAudience"]["demographics"] == "Test Demo"
    print("Successfully updated Campaign DNA.")
    print(updated)

if __name__ == "__main__":
    test_campaign_routes()
    print("All tests passed!")
