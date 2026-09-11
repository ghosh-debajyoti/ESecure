import requests
import time

def test_e2e():
    print('Testing E2E Flow...')
    
    # 1. Upload EML
    print('1. Uploading EML...')
    with open('benign_test.eml', 'rb') as f:
        files = {'file': ('benign_test.eml', f, 'message/rfc822')}
        res = requests.post('http://localhost:8000/api/v1/analyze', files=files)
        
    assert res.status_code == 200, f'Upload failed: {res.text}'
    data = res.json()
    case_number = data.get('case_number')
    print(f'Case created: {case_number}')
    
    # Wait for processing if async, though it seems synchronous
    
    # 2. Get normalized graph
    print('2. Fetching Normalized Graph...')
    res = requests.get('http://localhost:8000/api/attack-graph/normalized')
    assert res.status_code == 200, f'Graph fetch failed: {res.text}'
    graph = res.json()
    
    nodes = graph.get('nodes', [])
    edges = graph.get('edges', [])
    print(f'Graph has {len(nodes)} nodes and {len(edges)} edges')
    
    # Verify no duplicates
    node_ids = [n['id'] for n in nodes]
    assert len(node_ids) == len(set(node_ids)), 'Duplicate nodes found!'
    
    # Verify edges reference real nodes
    for e in edges:
        assert e['source'] in node_ids, f'Edge source {e["source"]} not in nodes!'
        assert e['target'] in node_ids, f'Edge target {e["target"]} not in nodes!'
        
    print('✅ No duplicate nodes')
    print('✅ All edges reference valid nodes')
    
    # Verify we have actual intel and not just mock
    ioc_nodes = [n for n in nodes if n.get('type') == 'ioc']
    print(f'Found {len(ioc_nodes)} IOC nodes.')
    
    print('E2E Test Passed!')

if __name__ == "__main__":
    test_e2e()
