# E-KAVACH

> A simple guide for evaluators who want to understand the project beyond the presentation.

## 1. What is E-KAVACH?

**E-KAVACH** is an AI-powered email security and cyber-forensics platform.

It takes a suspicious email file (`.eml`) and helps answer four simple questions:

1. **Is this email dangerous?**
2. **Why was it flagged?**
3. **Where did it come from and what is connected to it?**
4. **Can the evidence be used for further investigation?**

Instead of only saying **“Phishing”**, E-KAVACH collects useful evidence from the email and presents it in an investigation-friendly form.

---

## 2. How does it work?

```text
Suspicious Email (.eml)
        ↓
Email Reading & Evidence Collection
        ↓
Sender / Header / Link / Attachment Checks
        ↓
AI + Security Analysis
        ↓
Threat Score & Reason
        ↓
Connections, Campaigns & Attack View
        ↓
Forensic Case + Report
```

The original uploaded email is the main source of the investigation. The platform creates a unique **Case Number** for every analysis.

---

## 3. What does E-KAVACH check?

### Email details

- Sender and reply address
- Subject and message details
- Email delivery path
- Attachments
- Links and other suspicious indicators

### Security checks

- Checks whether the sender information is trustworthy
- Checks for suspicious links, domains and IP addresses
- Checks attachments for possible threats
- Checks for look-alike sender domains
- Checks whether the email may come from a compromised legitimate account
- Checks whether the email appears to continue or break an existing email conversation

### AI-based checks

E-KAVACH uses AI to identify signs of phishing and AI-generated writing. These results are combined with the other security checks instead of relying on a single signal.

---

## 4. What makes the project useful for investigation?

### A. Explainable Threat Score

The platform gives a threat score and shows the main reasons that increased or reduced the risk.

This makes the result easier to understand than a simple **Safe / Unsafe** label.

### B. Email Conversation Check

E-KAVACH can examine email conversation information such as message IDs and reply references.

This can help identify unusual breaks or inconsistencies in an email thread.

### C. QR and Image Phishing Detection

The platform can inspect images inside an email and check QR codes or text found in images for suspicious destinations.

### D. Similar Email / Campaign Detection

E-KAVACH uses email-content similarity to find related messages and identify possible coordinated campaigns.

### E. Attack Graph

Important items found during an investigation can be shown as connected entities, helping an investigator understand relationships between the email, indicators and infrastructure.

### F. Forensic Evidence

Each case can contain useful evidence such as:

- Case number
- Email details
- SHA-256 evidence hash
- TLSH similarity fingerprint
- Extracted indicators
- Relay information
- Threat score
- Analysis reasons
- Investigation graph

A PDF forensic report can also be generated for a case.

---

## 5. Business Mode

E-KAVACH also provides a separate **Business Mode** for organisations.

It is designed to answer questions that are different from analysing one person's email.

### Employee / Department Risk Mapping

It groups analysed emails by their intended recipients and shows which employees or departments are receiving more risky emails.

This helps an organisation identify where additional awareness or protection may be needed.

### Organisational Attack Progression

When the available evidence connects multiple cases, E-KAVACH can show how an attack or campaign may move from one target to another.

The view can connect:

```text
Attack / Campaign
       ↓
Target Employee
       ↓
Link / Domain / IP / Other Evidence
       ↓
Related Target or Case
```

Only evidence-supported relationships should be treated as connections; a matching threat type alone is not enough to establish a relationship.

---

## 6. What happens after an email is uploaded?

1. The `.eml` file is uploaded.
2. E-KAVACH reads the email and its available evidence.
3. Security and AI checks are performed.
4. A unique Case Number is created.
5. The result is stored as an investigation case.
6. The dashboard shows the findings.
7. The case can be viewed later from history.
8. A forensic report can be exported.

---

## 7. Main investigation views

| View | Purpose |
|---|---|
| **Analyze Email** | Upload and investigate a suspicious `.eml` file |
| **Cases / History** | Review previously analysed cases |
| **Attack Graph** | Understand relationships between evidence and infrastructure |
| **IOCs** | Review suspicious IPs, domains, URLs and file hashes |
| **Campaigns** | Identify related email activity |
| **Reports** | Generate a forensic report |
| **Business Overview** | See organisation-level risk |
| **Employee Risk** | Identify higher-risk recipients/departments |
| **Attack Progression** | View evidence-supported movement across targets |

---

## 8. Technology used

The project uses:

- **Python + FastAPI** — backend and analysis services
- **React + TypeScript + Vite** — web interface
- **AI models** — phishing and AI-generated-content analysis
- **TLSH** — finds similar email content even when it has been changed
- **Threat intelligence services** — adds context to discovered indicators
- **SQLite / PostgreSQL** — stores investigation data
- **STIX/UCO-compatible structures** — helps organise security evidence in a standard form

The technology is used to support the investigation workflow; the goal is to keep the final findings understandable to a non-technical user.

---

## 9. Example investigation

Suppose an employee receives an email claiming to be an urgent invoice request.

E-KAVACH can:

1. Read the `.eml` file.
2. Check the sender and reply address.
3. Examine the email delivery path.
4. Find links, domains, IP addresses and attachments.
5. Check suspicious indicators using available threat information.
6. Check whether the message looks like phishing or AI-generated content.
7. Check for QR/image-based phishing.
8. Check whether the sender may be spoofed or possibly compromised.
9. Look for similar messages from a possible campaign.
10. Produce a threat score with reasons and supporting evidence.
11. Store the result as a case and generate a report.

---

## 10. Why this is different from a basic spam filter

A normal spam filter mainly tries to decide whether an email should be allowed or blocked.

**E-KAVACH goes further into investigation.** It attempts to preserve and connect useful evidence from the email so that a user, security team or investigator can understand **what happened, why it is suspicious, and what evidence is available for the next step.**

The project combines email analysis, evidence collection, AI-based detection, campaign correlation, attack visualisation and forensic reporting in one workflow.

---

## 11. Current prototype scope

The current prototype focuses on **`.eml` email files**.

Future expansion can include direct connections to services such as Gmail and Microsoft 365, along with browser or email-client integrations.

The platform is intended to **assist investigation**, not replace a human investigator or make a final legal determination.

---

## 12. Suggested evaluation flow

For a quick demonstration, an evaluator can follow this path:

**Analyze Email → Upload `.eml` → Review Threat Score & Reasons → Open Case → Check IOCs / Attack Graph → View Business Mode (if analysing organisational activity) → Export Report**

---

## 13. Project Repository

**Source Code:**
https://github.com/ghosh-debajyoti/ESecure

This repository contains the backend, frontend, analysis services, database models, API routes and tests used by the prototype.

---

## 14. Related References

The project also takes inspiration from established cybersecurity standards and resources:

- MITRE ATT&CK — Phishing: https://attack.mitre.org/techniques/T1566/
- OASIS STIX: https://oasis-open.github.io/cti-documentation/resources.html
- OpenCTI Documentation: https://docs.opencti.io/latest/
- CISA Phishing Guidance: https://www.cisa.gov/sites/default/files/publications/phishing-infographic-508c.pdf

---

### In one sentence

**E-KAVACH turns a suspicious email into an understandable investigation case by combining threat detection, evidence collection, relationship analysis and forensic reporting.**
