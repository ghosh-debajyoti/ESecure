from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ioc_routes():
    # 1. Create a campaign to attach IOCs to
    res_camp = client.post("/api/campaigns/?name=IOCTestCampaign")
    assert res_camp.status_code == 200
    campaign_id = res_camp.json()["id"]
    print(f"Created Campaign ID {campaign_id}")

    # 2. Add an IOC
    ioc_payload = {
        "type": "IP",
        "value": "192.168.1.100",
        "severity": "High",
        "description": "Suspicious login IP",
        "campaign_id": campaign_id
    }
    res_post = client.post("/api/iocs/", json=ioc_payload)
    assert res_post.status_code == 200
    ioc_data = res_post.json()
    ioc_id = ioc_data["id"]
    assert ioc_data["value"] == "192.168.1.100"
    print(f"Successfully added IOC with ID {ioc_id}")

    # 3. Fetch IOCs by Campaign
    res_get = client.get(f"/api/iocs/campaign/{campaign_id}")
    assert res_get.status_code == 200
    fetched_iocs = res_get.json()
    assert len(fetched_iocs) > 0
    assert fetched_iocs[-1]["id"] == ioc_id
    print("Successfully fetched IOCs for campaign.")

    # 4. Delete the IOC
    res_delete = client.delete(f"/api/iocs/{ioc_id}")
    assert res_delete.status_code == 200
    print("Successfully deleted the IOC.")

if __name__ == "__main__":
    test_ioc_routes()
    print("All IOC tests passed!")
