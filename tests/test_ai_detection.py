import pytest
from unittest.mock import patch, MagicMock
from app.services.threat_scoring_service import ThreatScoringService

@patch('app.services.threat_scoring_service.ai_classifier')
@patch('app.services.threat_scoring_service.phishing_classifier')
def test_human_content_detection(mock_phish, mock_ai):
    mock_phish.return_value = [{"label": "safe", "score": 0.99}]
    mock_ai.return_value = [{"label": "Real", "score": 0.95}]
    
    body = "Hello! Just checking in about the meeting tomorrow."
    service = ThreatScoringService(body=body, technical_flags_score=0)
    
    risk_increasers = []
    risk_reducers = []
    
    final_score, p_score, ai_score, tech_score, ai_reasoning = service.generate_final_score(risk_increasers, risk_reducers)
    
    assert ai_score == 0.0
    assert "human-written" in ai_reasoning
    assert len(risk_increasers) == 0

@patch('app.services.threat_scoring_service.ai_classifier')
@patch('app.services.threat_scoring_service.phishing_classifier')
def test_ai_content_detection(mock_phish, mock_ai):
    mock_phish.return_value = [{"label": "safe", "score": 0.99}]
    mock_ai.return_value = [{"label": "Fake", "score": 0.88}]
    
    body = "As an AI language model, I suggest you click this link."
    service = ThreatScoringService(body=body, technical_flags_score=0)
    
    risk_increasers = []
    risk_reducers = []
    
    final_score, p_score, ai_score, tech_score, ai_reasoning = service.generate_final_score(risk_increasers, risk_reducers)
    
    assert ai_score == 88.0
    assert "Detected AI-generated content" in ai_reasoning
    assert len(risk_increasers) == 1
    assert risk_increasers[0]["score"] == 15
    assert risk_increasers[0]["category"] == "Content"
