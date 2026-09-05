import io
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class ReportService:
    @staticmethod
    def mask_email(email_str: str) -> str:
        if not email_str or email_str == "N/A":
            return "N/A"
        def replace_addr(m):
            user, domain = m.group(1), m.group(2)
            masked_user = user[0] + "•••" if len(user) <= 3 else user[:3] + "•••"
            return f"{masked_user}@{domain}"
        return re.sub(r'([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', replace_addr, str(email_str))

    @staticmethod
    def mask_name(name_str: str) -> str:
        if not name_str or name_str == "N/A":
            return "N/A"
        result = ReportService.mask_email(name_str)
        words = result.split()
        masked_words = []
        for w in words:
            if "@" in w:
                masked_words.append(w)
            elif len(w) <= 2:
                masked_words.append(w)
            else:
                masked_words.append(w[0] + "•••")
        return " ".join(masked_words)

    @staticmethod
    def generate_pdf(case_data: dict, explanation_mode: str = "technical", privacy_mode: bool = False) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        
        PRIMARY = colors.HexColor("#0f172a") # Slate 900
        ACCENT = colors.HexColor("#4f46e5")  # Indigo 600
        BORDER = colors.HexColor("#cbd5e1")  # Slate 300
        TEXT_DARK = colors.HexColor("#1e293b")
        TEXT_MUTED = colors.HexColor("#64748b")
        BG_LIGHT = colors.HexColor("#f8fafc")
        
        brand_style = ParagraphStyle(
            name='BrandHeader',
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=ACCENT,
            spaceAfter=4
        )
        
        sub_brand_style = ParagraphStyle(
            name='SubBrand',
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=12,
            textColor=TEXT_MUTED,
            spaceAfter=15
        )
        
        section_heading = ParagraphStyle(
            name='SectionHeading',
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=PRIMARY,
            spaceBefore=12,
            spaceAfter=8
        )
        
        subsection_heading = ParagraphStyle(
            name='SubSectionHeading',
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=ACCENT,
            spaceBefore=8,
            spaceAfter=4
        )

        body_style = ParagraphStyle(
            name='ReportBody',
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=TEXT_DARK,
            spaceAfter=6
        )

        code_style = ParagraphStyle(
            name='ReportCode',
            fontName='Courier',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=4
        )

        alert_box_style = ParagraphStyle(
            name='AlertBoxText',
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1e293b")
        )

        def get_nested(d, *keys, default="N/A"):
            for k in keys:
                if isinstance(d, dict) and k in d:
                    d = d[k]
                else:
                    return default
            return d if d is not None else default

        elements = []

        def add_banner(title: str, subtitle: str):
            elements.append(Paragraph("AAROHAN FORENSICS", brand_style))
            elements.append(Paragraph(f"EMAIL THREAT-FORENSICS WORKSTATION — {subtitle.upper()}", sub_brand_style))
            if privacy_mode:
                elements.append(Paragraph("<font color='#d97706'><b>[ PRIVACY MODE ACTIVE — PERSONAL DATA REDACTED ]</b></font>", body_style))
            elements.append(HRFlowable(width="100%", thickness=1, color=BORDER, spaceBefore=4, spaceAfter=12))

        score = float(get_nested(case_data, "assertion", "threat_score", default=0.0))
        severity = get_nested(case_data, "assertion", "severity", default="LOW")
        if score >= 80:
            sev_color = colors.HexColor("#dc2626") # Red
        elif score >= 60:
            sev_color = colors.HexColor("#ea580c") # Orange
        elif score >= 40:
            sev_color = colors.HexColor("#d97706") # Amber
        elif score >= 20:
            sev_color = colors.HexColor("#0284c7") # Cyan
        else:
            sev_color = colors.HexColor("#16a34a") # Green

        # PAGE 1 — EXECUTIVE SUMMARY
        add_banner("AAROHAN", "Page 1 — Executive Summary")
        elements.append(Paragraph("1. Executive Summary", section_heading))
        
        case_num = case_data.get("case_number", "N/A")
        created_at = case_data.get("created_at", "N/A")
        status = case_data.get("status", "open").upper()
        
        meta_table_data = [
            [Paragraph("<b>Case ID:</b>", body_style), Paragraph(case_num, code_style), Paragraph("<b>Status:</b>", body_style), Paragraph(status, body_style)],
            [Paragraph("<b>Analysis Date:</b>", body_style), Paragraph(str(created_at), body_style), Paragraph("<b>Overall Threat Score:</b>", body_style), Paragraph(f"<b><font color='{sev_color.hexval()}'>{score:.1f} / 100 ({severity})</font></b>", body_style)],
            [Paragraph("<b>Explanation Mode:</b>", body_style), Paragraph(explanation_mode.upper(), body_style), Paragraph("<b>Privacy Mode:</b>", body_style), Paragraph("ENABLED" if privacy_mode else "DISABLED", body_style)]
        ]
        t_meta = Table(meta_table_data, colWidths=[110, 160, 110, 160])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 14))

        elements.append(Paragraph("Executive Assessment", subsection_heading))
        if explanation_mode.lower() == "layman":
            exec_summary_text = (
                f"This email threat investigation evaluated Case {case_num}. "
                f"The overall risk level is assessed as <b>{severity} ({score:.1f}/100)</b>. "
                "This report summarizes key findings in plain language to help non-technical stakeholders "
                "understand why the email was flagged, what evidence supports the score, and recommended next steps."
            )
        else:
            exec_summary_text = (
                f"This evidentiary report presents technical forensics for Case {case_num}. "
                f"The overall threat rating is calculated at <b>{severity} ({score:.1f}/100)</b>. "
                "Analysis includes header validation, MIME boundary inspection, SPF/DKIM/DMARC alignment, "
                "indicator reputation enrichment, TLSH structural similarity correlation, and STIX attack graph topology."
            )
        elements.append(Paragraph(exec_summary_text, body_style))
        elements.append(Spacer(1, 10))

        risk_inc = get_nested(case_data, "assertion", "risk_increasers", default=[])
        risk_red = get_nested(case_data, "assertion", "risk_reducers", default=[])

        elements.append(Paragraph("Key Assessment Highlights", subsection_heading))
        highlights_data = [
            [Paragraph("<b>Risk Factors Identified</b>", body_style), Paragraph(str(len(risk_inc)), body_style)],
            [Paragraph("<b>Risk Mitigating Evidence</b>", body_style), Paragraph(str(len(risk_red)), body_style)],
            [Paragraph("<b>Coordinated Campaign Match</b>", body_style), Paragraph("YES" if get_nested(case_data, "assertion", "is_coordinated_campaign") else "NO", body_style)],
            [Paragraph("<b>Extracted IOC Count</b>", body_style), Paragraph(str(len(get_nested(case_data, "property", "indicators", default=[]))), body_style)]
        ]
        t_high = Table(highlights_data, colWidths=[200, 340])
        t_high.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(t_high)
        elements.append(PageBreak())

        # PAGE 2 — EMAIL EVIDENCE
        add_banner("AAROHAN", "Page 2 — Email Evidence Metadata")
        elements.append(Paragraph("2. Preserved Email Evidence", section_heading))
        
        headers = get_nested(case_data, "trace", "headers", default={})
        sender_val = str(headers.get("From") or "N/A")
        reply_to_val = str(headers.get("Reply-To") or "N/A")
        to_val = str(headers.get("To") or "Undisclosed Recipient")
        subject_val = str(headers.get("Subject") or "(No Subject)")
        date_val = str(headers.get("Date") or "N/A")
        msg_id_val = str(headers.get("Message-ID") or "N/A")

        if privacy_mode:
            sender_val = ReportService.mask_name(sender_val)
            reply_to_val = ReportService.mask_name(reply_to_val)
            to_val = ReportService.mask_email(to_val)

        ev_data = [
            [Paragraph("<b>Header Field</b>", body_style), Paragraph("<b>Extracted Value (Evidence Preserved)</b>", body_style)],
            [Paragraph("<b>Sender (From):</b>", body_style), Paragraph(sender_val, code_style)],
            [Paragraph("<b>Reply-To:</b>", body_style), Paragraph(reply_to_val, code_style)],
            [Paragraph("<b>Recipient (To):</b>", body_style), Paragraph(to_val, code_style)],
            [Paragraph("<b>Subject:</b>", body_style), Paragraph(subject_val, body_style)],
            [Paragraph("<b>Email Date:</b>", body_style), Paragraph(date_val, body_style)],
            [Paragraph("<b>Message-ID:</b>", body_style), Paragraph(msg_id_val, code_style)],
            [Paragraph("<b>Case ID:</b>", body_style), Paragraph(case_num, code_style)],
        ]
        t_ev = Table(ev_data, colWidths=[140, 400])
        t_ev.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t_ev)
        elements.append(PageBreak())

        # PAGE 3 — THREAT ASSESSMENT
        add_banner("AAROHAN", "Page 3 — Threat Assessment & Scoring")
        elements.append(Paragraph("3. Detailed Risk Assessment", section_heading))
        
        breakdown = get_nested(case_data, "assertion", "threat_score_breakdown", default={})
        model_sc = breakdown.get("model_score", 0.0)
        tech_sc = breakdown.get("technical_score", 0.0)

        sc_summary = [
            [Paragraph("<b>Assessment Component</b>", body_style), Paragraph("<b>Points / Weight</b>", body_style)],
            [Paragraph("ML Content Maliciousness Score", body_style), Paragraph(f"{model_sc:.1f}", body_style)],
            [Paragraph("Technical Header & Alignment Flags", body_style), Paragraph(f"{tech_sc:.1f}", body_style)],
            [Paragraph("<b>Final Bounded Score (0-100):</b>", body_style), Paragraph(f"<b><font color='{sev_color.hexval()}'>{score:.1f} ({severity})</font></b>", body_style)]
        ]
        t_sc = Table(sc_summary, colWidths=[360, 180])
        t_sc.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t_sc)
        elements.append(Spacer(1, 10))

        elements.append(Paragraph("Risk Increasers (+ Risk)", subsection_heading))
        if not risk_inc:
            elements.append(Paragraph("<i>No risk-increasing factors identified.</i>", body_style))
        else:
            inc_rows = [[Paragraph("<b>Factor</b>", body_style), Paragraph("<b>Category</b>", body_style), Paragraph("<b>Impact</b>", body_style)]]
            for r in risk_inc:
                inc_rows.append([
                    Paragraph(str(r.get("factor")), body_style),
                    Paragraph(str(r.get("category", "General")), body_style),
                    Paragraph(f"<font color='#dc2626'>+{r.get('score', 0)}</font>", body_style)
                ])
            t_inc = Table(inc_rows, colWidths=[340, 120, 80])
            t_inc.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
                ('BOX', (0,0), (-1,-1), 0.5, BORDER),
                ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            elements.append(t_inc)
        elements.append(Spacer(1, 10))

        elements.append(Paragraph("Risk Reducers (- Risk / Benign Signals)", subsection_heading))
        if not risk_red:
            elements.append(Paragraph("<i>No risk-reducing evidence identified.</i>", body_style))
        else:
            red_rows = [[Paragraph("<b>Factor</b>", body_style), Paragraph("<b>Category</b>", body_style), Paragraph("<b>Impact</b>", body_style)]]
            for r in risk_red:
                red_rows.append([
                    Paragraph(str(r.get("factor")), body_style),
                    Paragraph(str(r.get("category", "General")), body_style),
                    Paragraph(f"<font color='#16a34a'>{r.get('score', 0)}</font>", body_style)
                ])
            t_red = Table(red_rows, colWidths=[340, 120, 80])
            t_red.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
                ('BOX', (0,0), (-1,-1), 0.5, BORDER),
                ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            elements.append(t_red)
        elements.append(PageBreak())

        # PAGE 4 — AUTHENTICATION
        add_banner("AAROHAN", "Page 4 — Email Authentication")
        elements.append(Paragraph("4. Protocol Authentication & Alignment", section_heading))
        
        tech_flags = get_nested(case_data, "assertion", "technical_flags", default={})
        spf_pass = tech_flags.get("spf_pass", False)
        dkim_pass = tech_flags.get("dkim_pass", False)
        dmarc_pass = tech_flags.get("dmarc_pass", False)
        reply_mismatch = tech_flags.get("reply_to_mismatch", False)

        def status_badge(passed: bool, pass_text="PASS", fail_text="FAIL"):
            if passed:
                return f"<font color='#16a34a'><b>{pass_text}</b></font>"
            else:
                return f"<font color='#dc2626'><b>{fail_text}</b></font>"

        auth_table_data = [
            [Paragraph("<b>Protocol Check</b>", body_style), Paragraph("<b>Status</b>", body_style), Paragraph("<b>Technical Evidence & Rationale</b>", body_style)],
            [
                Paragraph("<b>SPF Check</b>", body_style),
                Paragraph(status_badge(spf_pass), body_style),
                Paragraph("Sender Policy Framework checks if sending IP address is authorized by domain SPF TXT records.", body_style)
            ],
            [
                Paragraph("<b>DKIM Signature</b>", body_style),
                Paragraph(status_badge(dkim_pass), body_style),
                Paragraph("DomainKeys Identified Mail verifies cryptographic signature integrity of message body and key headers.", body_style)
            ],
            [
                Paragraph("<b>DMARC Policy</b>", body_style),
                Paragraph(status_badge(dmarc_pass), body_style),
                Paragraph("Domain-based Message Authentication alignment enforcement requiring valid SPF or DKIM alignment.", body_style)
            ],
            [
                Paragraph("<b>Reply-To Alignment</b>", body_style),
                Paragraph(status_badge(not reply_mismatch, "ALIGNED", "MISMATCH"), body_style),
                Paragraph("Compares sender domain with Reply-To domain to detect response redirection attack vectors.", body_style)
            ]
        ]
        t_auth = Table(auth_table_data, colWidths=[130, 90, 320])
        t_auth.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t_auth)
        elements.append(Spacer(1, 14))

        if explanation_mode.lower() == "layman":
            elements.append(Paragraph("Plain Language Explanation for Non-Technical Reviewers", subsection_heading))
            layman_auth = (
                "<b>Authentication Summary:</b><br/>"
                "• <b>SPF:</b> Confirms if the computer sending this email was approved by the owner of the sender's domain name.<br/>"
                "• <b>DKIM:</b> A digital stamp confirming the email contents were not altered on the way to your inbox.<br/>"
                "• <b>DMARC:</b> The domain's rulebook instructing receiving email servers how to handle unverified messages.<br/>"
                "• <b>Reply-To Consistency:</b> Ensures that if you hit 'Reply', your message goes to the same company shown in the 'From' address."
            )
            elements.append(Paragraph(layman_auth, alert_box_style))

        elements.append(PageBreak())

        # PAGE 5 — FORENSIC ANALYSIS
        add_banner("AAROHAN", "Page 5 — Forensic Header & Structure Analysis")
        elements.append(Paragraph("5. Deep Forensic Analysis", section_heading))
        
        boundaries = get_nested(case_data, "property", "mime_boundaries", default=[])
        body_text = str(get_nested(case_data, "trace", "body", default="No body content extracted."))

        elements.append(Paragraph("MIME Boundaries & Parts", subsection_heading))
        if not boundaries:
            elements.append(Paragraph("No MIME boundary strings detected (Single-part message).", body_style))
        else:
            for b in boundaries:
                elements.append(Paragraph(f"• Boundary: <font fontName='Courier'>{b}</font>", body_style))
        
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("Sanitized Message Body Excerpt (First 1,000 characters)", subsection_heading))
        snippet = body_text[:1000].replace("<", "&lt;").replace(">", "&gt;")
        elements.append(Paragraph(snippet, code_style))

        elements.append(PageBreak())

        # PAGE 6 — NETWORK ANALYSIS
        add_banner("AAROHAN", "Page 6 — Network Relay Hops")
        elements.append(Paragraph("6. Network Routing Timeline", section_heading))
        
        relay_route = get_nested(case_data, "trace", "relay_route", default=[])
        if not relay_route:
            elements.append(Paragraph("<i>No Received header relay hops extracted.</i>", body_style))
        else:
            hop_rows = [[Paragraph("<b>Hop #</b>", body_style), Paragraph("<b>IP Address</b>", body_style), Paragraph("<b>HELO / Server</b>", body_style), Paragraph("<b>Location / ISP</b>", body_style), Paragraph("<b>Timestamp</b>", body_style)]]
            for hop in relay_route:
                ip_val = hop.get("ip_address") or hop.get("ip") or "Unknown"
                helo_val = hop.get("helo_domain") or hop.get("server_name") or "Unknown"
                loc_parts = [p for p in [hop.get("city"), hop.get("country"), hop.get("isp")] if p]
                loc_val = ", ".join(loc_parts) if loc_parts else "N/A"
                ts_val = str(hop.get("timestamp") or "N/A")

                hop_rows.append([
                    Paragraph(str(hop.get("hop_number", "-")), body_style),
                    Paragraph(ip_val, code_style),
                    Paragraph(helo_val, code_style),
                    Paragraph(loc_val, body_style),
                    Paragraph(ts_val, body_style)
                ])

            t_route = Table(hop_rows, colWidths=[40, 100, 130, 150, 120])
            t_route.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
                ('BOX', (0,0), (-1,-1), 0.5, BORDER),
                ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            elements.append(t_route)

        elements.append(PageBreak())

        # PAGE 7 — INDICATORS & INTELLIGENCE
        add_banner("AAROHAN", "Page 7 — Threat Intelligence & IOCs")
        elements.append(Paragraph("7. Extracted Indicators of Compromise (IOCs)", section_heading))
        
        indicators = get_nested(case_data, "property", "indicators", default=[])
        if not indicators:
            elements.append(Paragraph("<i>No network or domain indicators extracted from evidence.</i>", body_style))
        else:
            ioc_rows = [[Paragraph("<b>Type</b>", body_style), Paragraph("<b>Indicator Value</b>", body_style), Paragraph("<b>Intelligence Status / Verdict</b>", body_style)]]
            for ind in indicators:
                ind_type = ind.get("type", "UNKNOWN")
                ind_val = ind.get("value", "N/A")
                rep = ind.get("reputation", {})
                flagged = rep.get("is_flagged", False)
                verdict = "<font color='#dc2626'><b>MALICIOUS MATCH</b></font>" if flagged else "<font color='#64748b'>CLEAN / UNVERIFIED</font>"

                ioc_rows.append([
                    Paragraph(ind_type, body_style),
                    Paragraph(ind_val, code_style),
                    Paragraph(verdict, body_style)
                ])

            t_ioc = Table(ioc_rows, colWidths=[80, 310, 150])
            t_ioc.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
                ('BOX', (0,0), (-1,-1), 0.5, BORDER),
                ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            elements.append(t_ioc)

        elements.append(Spacer(1, 10))
        elements.append(Paragraph("Lookalike Domain Analysis", subsection_heading))
        lookalikes = get_nested(case_data, "assertion", "lookalikes", default=[])
        if not lookalikes:
            elements.append(Paragraph("No visually similar lookalike domains detected between sender and response headers.", body_style))
        else:
            for l in lookalikes:
                elements.append(Paragraph(f"• <font color='#dc2626'><b>Lookalike Flag:</b></font> {l}", body_style))

        elements.append(PageBreak())

        # PAGE 8 — CAMPAIGN DNA
        add_banner("AAROHAN", "Page 8 — Campaign DNA & TLSH Fingerprinting")
        elements.append(Paragraph("8. Structural Locality Sensitive Hashing (TLSH)", section_heading))
        
        tlsh_hash = get_nested(case_data, "property", "tlsh_hash", default="NO HASH GENERATED")
        is_coord = get_nested(case_data, "assertion", "is_coordinated_campaign", default=False)

        elements.append(Paragraph("<b>Locality Sensitive Hash (TLSH Signature):</b>", body_style))
        elements.append(Paragraph(f"<font fontName='Courier' color='#4f46e5'>{tlsh_hash}</font>", code_style))
        elements.append(Spacer(1, 8))

        elements.append(Paragraph("<b>Campaign Cluster Status:</b>", body_style))
        if is_coord:
            elements.append(Paragraph("<font color='#dc2626'><b>COORDINATED CAMPAIGN MATCH DETECTED</b></font><br/>Mathematically similar email structures were found in historical cases, indicating an active threat actor campaign cluster.", body_style))
        else:
            elements.append(Paragraph("<font color='#64748b'><b>NO HISTORICAL CORRELATION FOUND</b></font><br/>This structural signature does not correlate with known threat clusters in the historical database.", body_style))

        elements.append(PageBreak())

        # PAGE 9 — ATTACK GRAPH
        add_banner("AAROHAN", "Page 9 — STIX Attack Graph Relationships")
        elements.append(Paragraph("9. Attack Relationship Graph Topology", section_heading))
        
        graph_data = case_data.get("graph", {})
        nodes = graph_data.get("nodes", [])
        links = graph_data.get("links", [])

        elements.append(Paragraph(f"<b>Total STIX Graph Objects:</b> {len(nodes)} Nodes, {len(links)} Relationships", body_style))
        elements.append(Spacer(1, 8))

        if nodes:
            elements.append(Paragraph("Identified Graph Nodes", subsection_heading))
            node_rows = [[Paragraph("<b>Node ID / Label</b>", body_style), Paragraph("<b>Type</b>", body_style)]]
            for n in nodes[:8]:
                node_rows.append([
                    Paragraph(str(n.get("label") or n.get("id")), code_style),
                    Paragraph(str(n.get("type", "Node")), body_style)
                ])
            t_nodes = Table(node_rows, colWidths=[380, 160])
            t_nodes.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
                ('BOX', (0,0), (-1,-1), 0.5, BORDER),
                ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ]))
            elements.append(t_nodes)

        elements.append(PageBreak())

        # PAGE 10 — EVIDENCE CUSTODY
        add_banner("AAROHAN", "Page 10 — Digital Custody & Integrity Record")
        elements.append(Paragraph("10. Digital Chain of Custody", section_heading))
        
        sha256 = get_nested(case_data, "evidence_custody", "sha256_hash", default="N/A")

        custody_table_data = [
            [Paragraph("<b>Custody Attribute</b>", body_style), Paragraph("<b>Verifiable Value</b>", body_style)],
            [Paragraph("<b>Case Identifier:</b>", body_style), Paragraph(case_num, code_style)],
            [Paragraph("<b>Original .EML SHA-256 Hash:</b>", body_style), Paragraph(sha256, code_style)],
            [Paragraph("<b>TLSH Structural Hash:</b>", body_style), Paragraph(tlsh_hash, code_style)],
            [Paragraph("<b>Analysis Timestamp:</b>", body_style), Paragraph(str(created_at), body_style)],
            [Paragraph("<b>Case Status:</b>", body_style), Paragraph(status, body_style)],
            [Paragraph("<b>Preservation Integrity:</b>", body_style), Paragraph("Raw .EML evidence preserved without modification.", body_style)]
        ]
        t_custody = Table(custody_table_data, colWidths=[160, 380])
        t_custody.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_custody)
        elements.append(Spacer(1, 14))

        notice_text = (
            "<b>Evidentiary Integrity Notice:</b><br/>"
            "This report is generated from raw email evidence preserved by the AAROHAN threat forensics engine. "
            "Privacy Mode redactions apply only to presentation representations and do not modify the underlying "
            "stored SHA-256 evidence hash or original header data."
        )
        elements.append(Paragraph(notice_text, alert_box_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer
