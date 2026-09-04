from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_attack_graph_routes():
    # 1. First, create a campaign since the graph needs one to exist.
    # Note: If campaign 1 already exists, this might be a duplicate or we can just reuse ID 1
    # For safety, let's just make sure campaign 1 exists or create one.
    res_camp = client.post("/api/campaigns/?name=GraphTestCampaign")
    assert res_camp.status_code == 200
    campaign_id = res_camp.json()["id"]
    print(f"Created Campaign ID {campaign_id}")

    # 2. Upsert an attack graph
    payload = {
        "nodes": [
            {"id": "node1", "label": "Web Server", "type": "asset", "status": "compromised"},
            {"id": "node2", "label": "Database", "type": "database", "status": "secure"}
        ],
        "edges": [
            {"id": "edge1", "source": "node1", "target": "node2", "label": "SQL Injection"}
        ]
    }

    res_put = client.put(f"/api/attack-graph/campaign/{campaign_id}", json=payload)
    assert res_put.status_code == 200
    graph = res_put.json()
    assert graph["campaign_id"] == campaign_id
    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1
    print("Successfully UPSERTED Attack Graph.")

    # 3. Fetch the attack graph
    res_get = client.get(f"/api/attack-graph/campaign/{campaign_id}")
    assert res_get.status_code == 200
    fetched_graph = res_get.json()
    assert fetched_graph["campaign_id"] == campaign_id
    assert fetched_graph["nodes"][0]["id"] == "node1"
    print("Successfully FETCHED Attack Graph.")

if __name__ == "__main__":
    test_attack_graph_routes()
    print("All Attack Graph tests passed!")
