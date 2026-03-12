import json
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

async def analyze_email_explainability(sender: str, subject: str, content: str, ml_verdict: str, heuristic_hits: list):
    """
    Analyzes an email using OpenAI to provide structured explainability insights.
    """
    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY is not configured. Returning placeholder explainability data.")
        return _get_placeholder_explainability(ml_verdict, heuristic_hits)

    prompt = f"""
    Analyze the following email for security risks and provide a structured explanation.
    
    Email Details:
    Sender: {sender}
    Subject: {subject}
    Content: 
    {content}
    
    Context from other systems:
    - ML Detection Verdict: {ml_verdict}
    - Heuristic Rule Hits: {', '.join([h['name'] for h in heuristic_hits]) if heuristic_hits else 'None'}
    
    Please provide the analysis in the following JSON format:
    {{
      "summary": "Short 1-sentence summary of the risk level.",
      "suspicious_indicators": ["List of specific phrases/tPatterns found in content"],
      "malicious_intent_markers": ["Intent flags: e.g., Urgency, Credential Harvesting, Impersonation"],
      "header_anomaly_analysis": "Comment on the sender and subject alignment.",
      "confidence_breakdown": {{
        "overall_score": 0-100,
        "language_factor": 0-100,
        "intent_factor": 0-100,
        "consistency_factor": 0-100
      }},
      "reasoning": "Detailed technical explanation of why this verdict was reached."
    }}
    
    Ensure the JSON is valid and the fields are detailed.
    """

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "You are an expert cybersecurity analyst specialized in email forensics and phishing detection."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": { "type": "json_object" },
                    "temperature": 0.1
                },
                timeout=30.0
            )

            if response.status_code == 200:
                result = response.json()
                explanation_str = result['choices'][0]['message']['content']
                return json.loads(explanation_str)
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return _get_placeholder_explainability(ml_verdict, heuristic_hits)

    except Exception as e:
        logger.exception(f"Exception during OpenAI explainability analysis: {str(e)}")
        return _get_placeholder_explainability(ml_verdict, heuristic_hits)

def _get_placeholder_explainability(ml_verdict, heuristic_hits):
    """
    Returns a structured placeholder if OpenAI is unavailable.
    """
    return {
        "summary": "AI explainability analysis is currently in placeholder mode.",
        "suspicious_indicators": ["Urgent request pattern detected", "Suspicious sender domain correlation"],
        "malicious_intent_markers": ["Social Engineering", "Urgency"],
        "header_anomaly_analysis": "Sender domain matches known patterns but investigation is recommended.",
        "confidence_breakdown": {
            "overall_score": 85 if ml_verdict == 'malicious' else 20,
            "language_factor": 75,
            "intent_factor": 90,
            "consistency_factor": 80
        },
        "reasoning": f"Based on ML verdict ({ml_verdict}) and {len(heuristic_hits)} heuristic hits, this email shows characteristics consistent with potential security risks."
    }
