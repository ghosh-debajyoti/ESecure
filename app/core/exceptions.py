class EmailParsingError(Exception):
    """Raised when an email file is malformed and cannot be parsed."""
    pass

class ThreatIntelUnavailableError(Exception):
    """Raised when the threat intelligence service is unreachable."""
    pass

class AttachmentProcessingError(Exception):
    """Raised when an attachment is corrupted or cannot be processed."""
    pass
