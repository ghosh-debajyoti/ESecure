import requests

with open('/Users/dev/Downloads/sample email.eml', 'rb') as f:
    files = {'file': ('sample email.eml', f, 'message/rfc822')}
    r = requests.post('http://127.0.0.1:8000/api/v1/analyze', files=files)
    print(r.status_code)
    print(r.text)
