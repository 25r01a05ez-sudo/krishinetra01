import copy
import io
import json
import re
from pathlib import Path
from unittest.mock import Mock
import pytest
import requests
from PIL import Image
from app import create_app
from db import get_db
from gemini import GeminiClient, validate_assessment, LIST_FIELDS
from errors import APIError
HEADERS = {'X-KrishiNetra': '1'}
ASSESSMENT = {
 'status':'disease', 'disease':'Possible early blight', 'crop':'Tomato', 'confidence':0.8,
 'guidance': {'summary':'Possible spots; confirm with an agricultural specialist.', **{key:['Inspect the plant.'] for key in LIST_FIELDS}},
 'language':'en', 'model':'gemini-3.8-flash', 'severity':None, 'affected_regions':[],
}
@pytest.fixture
def app(tmp_path):
 return create_app({'TESTING':True, 'DATABASE':str(tmp_path/'test.sqlite3'), 'UPLOAD_DIR':str(tmp_path/'uploads'),
                    'GEMINI_API_KEY':'', 'MAIL_MODE':'console', 'PRODUCTION':False, 'DISABLE_RATE_LIMITS':True})
@pytest.fixture
def client(app): return app.test_client()
def post(client, path, data): return client.post(path,json=data,headers=HEADERS)
def register(client, email='farmer@example.com', password='HealthyCrop1'):
 return post(client,'/api/auth/register',{'name':'Farmer','email':email,'password':password})
def upload(client, raw=None):
 if raw is None:
  stream=io.BytesIO(); Image.new('RGB',(100,100),'green').save(stream,'PNG'); raw=stream.getvalue()
 return client.post('/api/predict',data={'file':(io.BytesIO(raw),'leaf.png')},headers=HEADERS)

def test_auth_session_and_csrf(client):
 assert client.get('/api/history').status_code==401
 assert client.post('/api/auth/register',json={}).status_code==403
 assert client.post('/api/auth/register',json={},headers={**HEADERS,'Origin':'https://evil.test'}).status_code==403
 r=register(client); assert r.status_code==201
 assert 'HttpOnly' in r.headers['Set-Cookie'] and 'SameSite=Lax' in r.headers['Set-Cookie']
 assert 'password_hash' not in r.json['user']
 assert client.get('/api/auth/me').status_code==200
 assert register(client).status_code==409
 assert post(client,'/api/auth/logout',{}).status_code==200
 assert client.get('/api/history').status_code==401
 assert post(client,'/api/auth/login',{'email':'farmer@example.com','password':'wrong'}).status_code==401
 assert post(client,'/api/auth/login',{'email':'farmer@example.com','password':'HealthyCrop1'}).status_code==200

def test_image_validation_and_missing_key(client,app):
 register(client)
 assert upload(client,b'not an image').status_code==400
 assert client.post('/api/predict',headers=HEADERS).status_code==400
 assert upload(client,b'a'*(10*1024*1024+1)).status_code==413
 r=upload(client); assert r.status_code==503 and r.json['code']=='gemini_not_configured'
 assert client.get('/api/history').json['total']==0
 assert list(Path(app.config['UPLOAD_DIR']).iterdir())==[]

def test_scan_lifecycle_and_account_isolation(app,client):
 register(client); app.extensions['gemini'].assess=Mock(return_value=copy.deepcopy(ASSESSMENT))
 r=upload(client); assert r.status_code==201
 scan_id=r.json['prediction_id']
 assert client.get('/api/history').json['total']==1
 assert client.get(r.json['image_url']).mimetype=='image/jpeg'
 second=app.test_client(); register(second,'other@example.com')
 assert second.get('/api/history').json['history']==[]
 assert second.get('/api/scans/'+scan_id).status_code==404
 assert second.get(r.json['image_url']).status_code==404
 assert second.delete('/api/scans/'+scan_id,headers=HEADERS).status_code==404
 assert post(second,'/api/translate',{'scan_id':scan_id,'language':'hi'}).status_code==404
 assert client.get('/api/dashboard').json['counts']['disease']==1
 assert client.get('/api/history/export').status_code==200
 assert client.get('/api/guidance/Possible%20early%20blight').json['source']=='saved_ai_assessment'
 assert client.delete('/api/scans/'+scan_id,headers=HEADERS).status_code==200
 assert client.get(r.json['image_url']).status_code==404
 assert not list(Path(app.config['UPLOAD_DIR']).iterdir())

def test_translation_cache(app,client):
 register(client); app.extensions['gemini'].assess=Mock(return_value=copy.deepcopy(ASSESSMENT))
 scan_id=upload(client).json['id']
 app.extensions['gemini'].translate=Mock(return_value={**ASSESSMENT,'language':'hi','disease':'संभावित रोग'})
 payload={'scan_id':scan_id,'language':'hi'}
 assert post(client,'/api/translate',payload).json['language']=='hi'
 assert post(client,'/api/translate',payload).status_code==200
 app.extensions['gemini'].translate.assert_called_once()
 assert client.get('/api/scans/'+scan_id).json['language']=='en'
 assert post(client,'/api/translate',{**payload,'language':'madeup'}).status_code==400

def test_otp_single_use_and_reset_revokes_sessions(app,client,capsys):
 register(client)
 assert post(client,'/api/auth/request-otp',{'email':'farmer@example.com'}).status_code==200
 code=re.search(r'code: (\d{6})',capsys.readouterr().out).group(1)
 assert post(client,'/api/auth/verify-otp',{'email':'farmer@example.com','code':code}).status_code==200
 assert post(client,'/api/auth/verify-otp',{'email':'farmer@example.com','code':code}).status_code==400
 second=app.test_client()
 assert post(second,'/api/auth/login',{'email':'farmer@example.com','password':'HealthyCrop1'}).status_code==200
 post(client,'/api/auth/request-otp',{'email':'farmer@example.com','purpose':'reset'})
 code=re.search(r'code: (\d{6})',capsys.readouterr().out).group(1)
 assert post(client,'/api/auth/reset-password',{'email':'farmer@example.com','code':code,'new_password':'ChangedPass2'}).status_code==200
 assert second.get('/api/auth/me').status_code==401
 assert post(client,'/api/auth/login',{'email':'farmer@example.com','password':'HealthyCrop1'}).status_code==401
 assert post(client,'/api/auth/login',{'email':'farmer@example.com','password':'ChangedPass2'}).status_code==200

def test_otp_attempts_expiry_and_production(app,client,capsys):
 register(client); post(client,'/api/auth/request-otp',{'email':'farmer@example.com'})
 code=re.search(r'code: (\d{6})',capsys.readouterr().out).group(1)
 for _ in range(5):
  assert post(client,'/api/auth/verify-otp',{'email':'farmer@example.com','code':'xxxxxx'}).status_code==400
 assert post(client,'/api/auth/verify-otp',{'email':'farmer@example.com','code':code}).status_code==400
 post(client,'/api/auth/request-otp',{'email':'farmer@example.com'})
 code=re.search(r'code: (\d{6})',capsys.readouterr().out).group(1)
 with app.app_context():
  db=get_db(); db.execute('UPDATE otp SET expires_at=0'); db.commit()
 assert post(client,'/api/auth/verify-otp',{'email':'farmer@example.com','code':code}).status_code==400
 app.config['PRODUCTION']=True
 assert post(client,'/api/auth/request-otp',{'email':'farmer@example.com'}).status_code==503

def test_settings_and_monitoring(app,client,monkeypatch):
 register(client)
 assert client.patch('/api/settings',json={'language':'te','tutorial_completed':True},headers=HEADERS).status_code==200
 assert client.patch('/api/settings',json={'latitude':400,'longitude':78},headers=HEADERS).status_code==400
 assert post(client,'/api/monitoring/readings',{'humidity':101}).status_code==400
 assert post(client,'/api/monitoring/readings',{'temperature':36,'humidity':90,'soil_moisture':50}).status_code==201
 r=client.get('/api/monitoring').json
 assert r['soil_moisture']['value']==50 and len(r['alerts'])==2
 client.patch('/api/settings',json={'latitude':17.4,'longitude':78.4},headers=HEADERS)
 monkeypatch.setattr('app.requests.get',Mock(side_effect=requests.Timeout()))
 assert client.get('/api/monitoring').status_code==200
 assert 'unavailable' in client.get('/api/monitoring').json['alerts'][0]

@pytest.mark.parametrize('status,expected,code',[(403,502,'gemini_rejected'),(404,502,'gemini_model_unavailable'),(429,429,'gemini_quota'),(503,503,'gemini_unavailable')])
def test_upstream_errors(monkeypatch,status,expected,code):
 monkeypatch.setattr('gemini.requests.post',Mock(return_value=Mock(status_code=status)))
 monkeypatch.setattr('gemini.time.sleep',lambda _:None)
 with pytest.raises(APIError) as e: GeminiClient('test-key').generate([{'text':'test'}])
 assert e.value.status==expected and e.value.code==code

def test_gemini_contract_timeout_and_validation(monkeypatch):
 response=Mock(status_code=200)
 response.json.return_value={'candidates':[{'finishReason':'STOP','content':{'parts':[{'text':json.dumps(ASSESSMENT)}]}}]}
 mock=Mock(return_value=response); monkeypatch.setattr('gemini.requests.post',mock)
 client=GeminiClient('test-key'); result=client.assess(b'jpeg','Tomato','en')
 assert result['status']=='disease'
 sent=mock.call_args.kwargs
 assert sent['headers']=={'x-goog-api-key':'test-key'}
 assert 'test-key' not in mock.call_args.args[0]
 assert sent['json']['contents'][0]['parts'][1]['inlineData']['mimeType']=='image/jpeg'
 mock.side_effect=requests.Timeout()
 with pytest.raises(APIError) as e: client.generate([])
 assert e.value.status==504
 for invalid in [[],{'status':'invented'},{**ASSESSMENT,'confidence':float('nan')},{**ASSESSMENT,'guidance':{}}]:
  with pytest.raises(APIError): validate_assessment(invalid)
 assert validate_assessment({**ASSESSMENT,'confidence':0.2})['status']=='uncertain'

def test_rate_limits_and_pagination(app,client):
 app.config['DISABLE_RATE_LIMITS']=False
 for _ in range(10):
  assert post(client,'/api/auth/login',{'email':'none@example.com','password':'bad'}).status_code==401
 assert post(client,'/api/auth/login',{'email':'none@example.com','password':'bad'}).status_code==429
 register(client)
 assert client.get('/api/history?page=bad').status_code==400
 assert client.get('/api/history?limit=1').json['has_more'] is False

def test_health_and_no_html_for_unknown_api(client):
 assert client.get('/api/health').json['gemini_configured'] is False
 assert client.get('/api/not-a-route').status_code==404
 assert client.get('/api/not-a-route').is_json
