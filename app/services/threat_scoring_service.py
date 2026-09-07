from transformers import pipeline

# Load pipeline globally to avoid reloading on every request
try:
    phishing_classifier = pipeline(
        "text-classification", model="./saved_phishing_model"
    )
except Exception as e:
    print(f"Warning: Failed to load phishing model. Error: {e}")
    phishing_classifier = None

try:
    ai_classifier = pipeline(
        "text-classification", model="roberta-base-openai-detector"
    )
except Exception as e:
    print(f"Warning: Failed to load AI model. Error: {e}")
    ai_classifier = None


def get_severity_label(score: float) -> str:
    score = max(0.0, min(100.0, float(score)))
    if score >= 80.0:
        return "CRITICAL"
    elif score >= 60.0:
        return "HIGH"
    elif score >= 40.0:
        return "MODERATE"
    elif score >= 20.0:
        return "GUARDED"
    else:
        return "LOW"


class ThreatScoringService:
    def __init__(self, body: str, technical_flags_score: float):
        self.body = body
        self.technical_flags_score = technical_flags_score

    def get_model_score(self) -> float:
        if not phishing_classifier or not self.body.strip():
            return 0.0

        try:
            # Truncate body if it's too long for BERT (typically 512 tokens)
            text_to_analyze = self.body[:2000]
            result = phishing_classifier(text_to_analyze)[0]

            label = str(result["label"]).lower()
            score = float(result["score"])

            # Convert model output to a 0-100 maliciousness score
            # distilbert binary classification outputs LABEL_1 (phish/malicious) or LABEL_0 (benign/safe)
            if "label_1" in label or "phish" in label or "malicious" in label:
                return score * 100.0
            elif "label_0" in label or "safe" in label or "benign" in label:
                return (1.0 - score) * 100.0
            else:
                return score * 100.0
        except Exception as e:
            print(f"Error during model classification: {e}")
            return 0.0

    def get_ai_score(self) -> tuple[float, str]:
        if not ai_classifier or not self.body.strip():
            return 0.0, "AI detection model not loaded or empty body"

        try:
            text_to_analyze = self.body[:2000]
            result = ai_classifier(text_to_analyze)[0]
            label = str(result["label"]).lower()
            score = float(result["score"])

            # roberta-base-openai-detector outputs "Fake" for AI and "Real" for Human.
            if "fake" in label or "ai" in label:
                return score * 100.0, f"Detected AI-generated content ({round(score*100,1)}% confidence)"
            else:
                return 0.0, f"Content appears human-written ({round(score*100,1)}% confidence)"
        except Exception as e:
            print(f"Error during AI model classification: {e}")
            return 0.0, f"Error: {e}"


    def generate_final_score(self, risk_increasers: list = None, risk_reducers: list = None) -> tuple[float, float, float, float, str]:
        model_score = self.get_model_score()
        ai_score, ai_reasoning = self.get_ai_score()
        
        # Add AI score penalty to increasers if high confidence
        if ai_score >= 50.0:
            if risk_increasers is not None:
                risk_increasers.append({
                    "factor": ai_reasoning,
                    "score": 15,
                    "category": "Content"
                })
        
        increasers_sum = sum(item.get("score", 0) for item in (risk_increasers or []))
        reducers_sum = sum(abs(item.get("score", 0)) for item in (risk_reducers or []))

        # Base technical score combines flags
        tech_score = self.technical_flags_score

        # Combine ML model weight (40%), technical flags & risk increasers - risk reducers
        combined = (model_score * 0.4) + (tech_score * 0.6) + (increasers_sum * 0.5) - reducers_sum

        final_score = min(max(combined, 0.0), 100.0)

        return round(final_score, 1), round(model_score, 1), round(ai_score, 1), round(tech_score, 1), ai_reasoning


