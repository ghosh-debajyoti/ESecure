import requests

with open('/Users/dev/Desktop/ultimate_test.eml', 'rb') as f:
    files = {'file': ('ultimate_test.eml', f, 'message/rfc822')}
    r = requests.post('http://127.0.0.1:8000/api/v1/analyze', files=files)
    print(r.status_code)
    print(r.text)
