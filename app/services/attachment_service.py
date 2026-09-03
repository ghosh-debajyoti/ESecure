import hashlib
import math
import mimetypes
import os
from email.message import EmailMessage
from typing import Any

try:
    import yara
    YARA_AVAILABLE = True
except ImportError:
    YARA_AVAILABLE = False

DANGEROUS_EXTS = {".exe", ".scr", ".vbs", ".iso", ".docm", ".xlsm", ".hta", ".bat", ".cmd", ".ps1"}
SUSPICIOUS_STRINGS = [b"AutoOpen", b"powershell", b"WScript.Shell", b"cmd.exe", b"MZ"]

class AttachmentService:
    @staticmethod
    def _calculate_entropy(data: bytes) -> float:
        if not data:
            return 0.0
        entropy = 0.0
        length = len(data)
        counts = [0] * 256
        for byte in data:
            counts[byte] += 1
        for count in counts:
            if count > 0:
                p = count / length
                entropy -= p * math.log2(p)
        return entropy
        
    @staticmethod
    def _scan_yara_fallback(data: bytes) -> list[str]:
        indicators = []
        for s in SUSPICIOUS_STRINGS:
            if s in data:
                indicators.append(f"Suspicious string found: {s.decode('utf-8', errors='ignore')}")
        return indicators

    @classmethod
    def inspect_attachments(cls, msg: EmailMessage) -> list[dict[str, Any]]:
        attachments = []
        
        yara_rules = None
        if YARA_AVAILABLE:
            rule = """
            rule Suspicious_Attachment {
                strings:
                    $mz = "MZ"
                    $auto = "AutoOpen" nocase
                    $ps = "powershell" nocase
                    $wscript = "WScript.Shell" nocase
                condition:
                    any of them
            }
            """
            try:
                yara_rules = yara.compile(source=rule)
            except Exception:
                yara_rules = None
        
        for part in msg.walk():
            cdisp = str(part.get("Content-Disposition"))
            if "attachment" in cdisp or part.get_filename():
                payload = part.get_payload(decode=True) or b""
                if not payload:
                    continue
                
                # Ignore small inline images
                if len(payload) < 200 and part.get_content_type().startswith("image/"):
                    continue
                    
                filename = part.get_filename() or "unknown_attachment"
                filename = os.path.basename(filename) # sanitize
                
                size = len(payload)
                mime_type = part.get_content_type()
                if mime_type == "application/octet-stream":
                    mt, _ = mimetypes.guess_type(filename)
                    if mt:
                        mime_type = mt
                        
                sha256 = hashlib.sha256(payload).hexdigest()
                md5 = hashlib.md5(payload).hexdigest()
                entropy = cls._calculate_entropy(payload)
                
                _, ext = os.path.splitext(filename)
                ext = ext.lower()
                
                is_suspicious = False
                indicators = []
                
                if ext in DANGEROUS_EXTS:
                    is_suspicious = True
                    indicators.append(f"Dangerous extension: {ext}")
                    
                if entropy > 7.5:
                    is_suspicious = True
                    indicators.append(f"High entropy ({entropy:.2f}), possibly packed/encrypted")
                    
                if YARA_AVAILABLE and yara_rules:
                    try:
                        matches = yara_rules.match(data=payload)
                        if matches:
                            is_suspicious = True
                            for match in matches:
                                indicators.append(f"YARA Rule Match: {match.rule}")
                    except Exception:
                        pass
                else:
                    fb_inds = cls._scan_yara_fallback(payload)
                    if fb_inds:
                        is_suspicious = True
                        indicators.extend(fb_inds)
                        
                attachments.append({
                    "filename": filename,
                    "sha256": sha256,
                    "md5": md5,
                    "size": size,
                    "mime_type": mime_type,
                    "entropy": entropy,
                    "is_suspicious": is_suspicious,
                    "threat_indicators": indicators
                })
                
        return attachments
