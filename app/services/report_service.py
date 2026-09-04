import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch

class ReportService:
    @staticmethod
    def generate_pdf(case_data: dict) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            name='TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=14,
            alignment=1, # Center
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            name='HeadingStyle',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            fontName='Helvetica-Bold'
        )
        
        normal_style = styles["Normal"]
        
        elements = []
        
        # 1. Header
        elements.append(Paragraph("ESECURE-AI CYBER FORENSICS - EVIDENTIARY REPORT", title_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Helper to safely get nested values
        def get_nested(d, *keys, default="N/A"):
            for k in keys:
                if isinstance(d, dict) and k in d:
                    d = d[k]
                else:
                    return default
            return d if d is not None else default

        # 2. Executive Summary & Metadata Section
        case_num = case_data.get("case_number", "N/A")
        timestamp = case_data.get("created_at", "N/A")
        threat_score = get_nested(case_data, "assertion", "threat_score", default="N/A")
        
        elements.append(Paragraph("Executive Summary", heading_style))
        elements.append(Paragraph(
            "This report details the forensic analysis of the submitted email evidence. "
            "It encapsulates the threat scoring, digital custody chain, authentication verification, "
            "and identified indicators of compromise (IOCs) mapped against global threat intelligence.",
            normal_style
        ))
        elements.append(Spacer(1, 0.1 * inch))
        
        elements.append(Paragraph("Metadata", heading_style))
        elements.append(Paragraph(f"<b>Case Number:</b> {case_num}", normal_style))
        elements.append(Paragraph(f"<b>Analysis Timestamp:</b> {timestamp}", normal_style))
        elements.append(Paragraph(f"<b>Overall Threat Score:</b> {threat_score} / 100", normal_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # 3. Chain of Custody
        sha256_hash = get_nested(case_data, "evidence_custody", "sha256_hash", default="N/A")
        elements.append(Paragraph("Chain of Custody", heading_style))
        elements.append(Paragraph(f"<b>Original .eml SHA-256 Hash:</b> {sha256_hash}", normal_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # 4. Authentication Summary
        elements.append(Paragraph("Authentication Summary", heading_style))
        tech_flags = get_nested(case_data, "assertion", "technical_flags", default={})
        
        spf = "Pass" if tech_flags.get("spf_pass") else "Fail"
        dkim = "Pass" if tech_flags.get("dkim_pass") else "Fail"
        dmarc = "Pass" if tech_flags.get("dmarc_pass") else "Fail"
        
        elements.append(Paragraph(f"<b>SPF:</b> {spf}", normal_style))
        elements.append(Paragraph(f"<b>DKIM:</b> {dkim}", normal_style))
        elements.append(Paragraph(f"<b>DMARC:</b> {dmarc}", normal_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # 5. Threat Intelligence (IOCs)
        elements.append(Paragraph("Threat Intelligence (IOCs)", heading_style))
        indicators = get_nested(case_data, "property", "indicators", default=[])
        
        if not indicators:
            elements.append(Paragraph("No identified IOCs", normal_style))
        else:
            for ind in indicators:
                ind_type = ind.get("type", "Unknown")
                ind_val = ind.get("value", "Unknown")
                reputation = ind.get("reputation", {})
                
                vt_score = reputation.get("virustotal_score", "N/A")
                pt_score = reputation.get("phishtank_status", "N/A")
                
                info = f"<b>{ind_type}:</b> {ind_val} (VirusTotal: {vt_score}, PhishTank: {pt_score})"
                elements.append(Paragraph(info, normal_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # 6. Campaign Linkage
        elements.append(Paragraph("Campaign Linkage", heading_style))
        is_coord = get_nested(case_data, "assertion", "is_coordinated_campaign", default=False)
        lookalikes = get_nested(case_data, "assertion", "lookalikes", default=[])
        
        if is_coord:
            elements.append(Paragraph("<b>Status:</b> Coordinated Campaign Detected", normal_style))
            if lookalikes:
                lookalikes_str = ", ".join([str(l) for l in lookalikes])
                elements.append(Paragraph(f"<b>Related Cases:</b> {lookalikes_str}", normal_style))
        else:
            elements.append(Paragraph("<b>Status:</b> No coordinated campaign detected.", normal_style))
            
        doc.build(elements)
        buffer.seek(0)
        return buffer
