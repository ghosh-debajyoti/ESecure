/**
 * Presentation Redaction Helpers for AAROHAN Privacy Mode.
 * 
 * IMPORTANT:
 * - Redacts personal identifiers like email addresses and names in presentation UI & PDF.
 * - DOES NOT modify technical forensic indicators: IP addresses, domains, URLs, hashes, case IDs, timestamps, ASN.
 * - DOES NOT modify stored backend evidence or original .eml hashes.
 */

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "N/A";
  const str = String(email).trim();
  if (!str.includes("@")) return maskName(str);

  return str.replace(/([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, user, domain) => {
    let maskedUser = user;
    if (user.length <= 2) {
      maskedUser = user[0] + "•••";
    } else if (user.length <= 4) {
      maskedUser = user.slice(0, 2) + "•••";
    } else {
      maskedUser = user.slice(0, 3) + "•••";
    }
    return `${maskedUser}@${domain}`;
  });
}

export function maskName(name: string | null | undefined): string {
  if (!name) return "N/A";
  const str = String(name).trim();

  // If formatted as "John Doe <john@example.com>", handle both parts
  if (str.includes("<") && str.includes(">")) {
    const parts = str.split("<");
    const displayName = parts[0].trim();
    const emailPart = parts[1].replace(">", "").trim();
    const maskedDisplay = maskNameWords(displayName);
    const maskedAddr = maskEmail(emailPart);
    return `${maskedDisplay} <${maskedAddr}>`;
  }

  if (str.includes("@")) {
    return maskEmail(str);
  }

  return maskNameWords(str);
}

function maskNameWords(str: string): string {
  const words = str.split(/\s+/);
  return words
    .map((w) => {
      if (w.length <= 1) return w;
      if (w.length === 2) return w[0] + "•";
      return w[0] + "•••";
    })
    .join(" ");
}
