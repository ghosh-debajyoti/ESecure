import re
from typing import Any

from app.schemas.thread import ThreadContinuityResult, ThreadFinding

class ThreadContinuityService:
    @staticmethod
    def analyze_thread(headers: dict[str, Any], body: str) -> ThreadContinuityResult:
        in_reply_to = headers.get("In-Reply-To")
        references = headers.get("References")
        subject = headers.get("Subject", "")
        
        findings = []
        is_reply = False
        is_suspicious = False
        confidence = 1.0

        if subject is None:
            subject = ""
            
        subject_is_reply = bool(re.match(r'^(re|fw|fwd|aw|wg):\s+', subject, re.IGNORECASE))
        
        # Check quoted text presence
        # Looks for typical quote indicators like "> ", "On [date], [person] wrote:"
        has_quoted_text = bool(re.search(r'(^\s*>|On\s+.*wrote:|-{3,}\s*Original Message\s*-{3,})', body, re.MULTILINE | re.IGNORECASE))

        if in_reply_to or references:
            is_reply = True
            if not has_quoted_text:
                # Missing/broken reply detection
                findings.append(
                    ThreadFinding(
                        type="BROKEN_THREAD",
                        description="In-Reply-To header present but no quoted text found in body.",
                        severity="MEDIUM"
                    )
                )
                is_suspicious = True
                confidence = 0.8
            else:
                findings.append(
                    ThreadFinding(
                        type="VALID_THREAD",
                        description="Valid thread headers and quoted text found.",
                        severity="LOW"
                    )
                )
        else:
            if subject_is_reply and has_quoted_text:
                # Forged reply detection
                findings.append(
                    ThreadFinding(
                        type="FORGED_REPLY",
                        description="Subject and body indicate a reply, but thread headers are missing.",
                        severity="HIGH"
                    )
                )
                is_suspicious = True
                confidence = 0.9

        return ThreadContinuityResult(
            is_reply=is_reply,
            is_suspicious=is_suspicious,
            confidence=confidence,
            findings=findings
        )
