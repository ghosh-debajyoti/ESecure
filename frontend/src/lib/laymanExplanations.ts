/**
 * Layman / Non-Technical Explanation Dictionary for AAROHAN.
 * 
 * Provides evidence-based, simple-language translations of cybersecurity terms
 * formatted into clear 4-part cards:
 * 1. WHAT WE FOUND
 * 2. WHY IT MATTERS
 * 3. IN SIMPLE TERMS
 * 4. RECOMMENDED ACTION
 */

export interface LaymanExplanation {
  title: string;
  whatWeFound: string;
  whyItMatters: string;
  inSimpleTerms: string;
  recommendedAction: string;
}

export const LAYMAN_EXPLANATIONS: Record<string, LaymanExplanation> = {
  DMARC_FAIL: {
    title: "DMARC Authentication Failed",
    whatWeFound: "The email failed the DMARC (Domain-based Message Authentication) verification check.",
    whyItMatters: "DMARC is an industry-standard security policy set by domain owners to prevent spoofing.",
    inSimpleTerms: "This check failed, so the sender's identity could not be reliably verified. That increases the risk that the message is pretending to come from someone it is not.",
    recommendedAction: "Do not trust the claimed sender identity until independently verified through another channel."
  },
  DMARC_PASS: {
    title: "DMARC Authentication Verified",
    whatWeFound: "The email passed the DMARC authentication check.",
    whyItMatters: "DMARC alignment confirms that the sender's domain policies match the email headers.",
    inSimpleTerms: "The sender's domain owner has confirmed that this email infrastructure is authorized to deliver messages on their behalf.",
    recommendedAction: "Standard precautions apply, though sender domain identity is verified."
  },
  SPF_FAIL: {
    title: "SPF Authorization Failed",
    whatWeFound: "The server that sent this message is not listed in the sender's authorized SPF records.",
    whyItMatters: "Domain owners specify which IP addresses are permitted to send emails for their domain.",
    inSimpleTerms: "The server sending this message was not authorized by the sender's domain to send messages on its behalf.",
    recommendedAction: "Exercise caution before trusting any links or attachments in this email."
  },
  SPF_PASS: {
    title: "SPF Authorization Verified",
    whatWeFound: "The sending server IP matches the sender domain's SPF record.",
    whyItMatters: "SPF confirms sending server authorization.",
    inSimpleTerms: "The computer that delivered this email was approved by the company listed in the From address.",
    recommendedAction: "Sender server authorization is validated."
  },
  DKIM_FAIL: {
    title: "DKIM Signature Invalid or Missing",
    whatWeFound: "The digital cryptographic signature (DKIM) could not be validated.",
    whyItMatters: "DKIM signatures act like tamper-evident seals on digital mail.",
    inSimpleTerms: "The email's digital signature could not be verified. This means the system could not confirm that the message was authorized by the claimed sender and had not been altered in transit.",
    recommendedAction: "Do not download attachments or enter login credentials requested in this email."
  },
  DKIM_PASS: {
    title: "DKIM Signature Verified",
    whatWeFound: "A valid cryptographic DKIM signature was verified.",
    whyItMatters: "Confirms message content integrity in transit.",
    inSimpleTerms: "The email has a valid digital seal confirming it was signed by the sending domain and arrived unaltered.",
    recommendedAction: "Content integrity is verified."
  },
  REPLY_TO_MISMATCH: {
    title: "Reply-To Address Mismatch",
    whatWeFound: "The address shown as the sender (From) differs from the address where replies would be sent (Reply-To).",
    whyItMatters: "Attackers often disassociate From and Reply-To addresses to redirect responses to attacker-controlled inboxes.",
    inSimpleTerms: "The address shown as the sender is different from the address where replies would actually be sent. Attackers sometimes use this technique to make an email look legitimate while directing responses somewhere else.",
    recommendedAction: "Do not reply to this email. Verify the sender through a known telephone number or official site."
  },
  LOOKALIKE_DETECTED: {
    title: "Visual Lookalike Domain Detected",
    whatWeFound: "The sender domain strongly resembles a well-known legitimate brand domain but differs by minor character substitutions.",
    whyItMatters: "Typosquatting and lookalike domains are commonly registered to trick users into believing a fake email is genuine.",
    inSimpleTerms: "The email address comes from a website address designed to look almost identical to a famous brand, but with subtle spelling variations.",
    recommendedAction: "Treat this message as a potential phishing attempt. Do not click links."
  },
  MALICIOUS_ATTACHMENT: {
    title: "Suspicious Payload Attachment",
    whatWeFound: "One or more attachments contained executable scripts, dangerous file extensions, or high entropy signatures.",
    whyItMatters: "Attachments are the primary delivery mechanism for ransomware and malware.",
    inSimpleTerms: "An attached file contains code that could execute malicious commands on your computer if opened.",
    recommendedAction: "Do not open or download any attachments from this message."
  },
  FLAGGED_IOC: {
    title: "Known Threat Intelligence Match",
    whatWeFound: "An IP address, domain, or URL extracted from this email matches global cybersecurity threat databases.",
    whyItMatters: "Threat intelligence aggregates reported phishing sites and malicious infrastructure globally.",
    inSimpleTerms: "Web links or servers associated with this email have been flagged as malicious by security teams worldwide.",
    recommendedAction: "Block all associated domains and do not navigate to any extracted URLs."
  },
  COORDINATED_CAMPAIGN: {
    title: "Coordinated Campaign Cluster Detected",
    whatWeFound: "The structural hash (TLSH) of this email matches evidence collected from historical attack campaigns.",
    whyItMatters: "Indicates that this email is part of a broader, organized attack campaign rather than an isolated message.",
    inSimpleTerms: "This email was built using the exact same structural blueprint as other attacks recorded in our system.",
    recommendedAction: "Alert your organization's IT security team as this indicates a targeted campaign."
  }
};
