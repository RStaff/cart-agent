function cleanReplyText(body = "") {
  let text = String(body || "").replaceAll("\r\n", "\n");

  const footerMarkers = [
    "\nReply to this email directly",
    "\nView it on GitHub",
    "\nYou are receiving this because",
    "\nManage notifications",
    "\n-- \nReply to this email directly",
    "\n________________________________",
  ];

  for (const marker of footerMarkers) {
    const index = text.indexOf(marker);
    if (index >= 0) {
      text = text.slice(0, index);
    }
  }

  const lines = text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => {
      const lowered = line.toLowerCase();
      if (!line.trim()) return true;
      if (lowered.includes("notifications@github.com")) return false;
      if (lowered.includes("github notification")) return false;
      if (lowered.startsWith("on github,")) return false;
      if (lowered.includes("commented on this issue")) return false;
      if (/\b(commented on|replied|mentioned you)\b/.test(lowered) && lowered.includes("#")) return false;
      return true;
    });

  return lines.join("\n").trim();
}

function extractGithubIssueUrl(subject = "", body = "") {
  const source = `${subject}\n${body}`;
  return source.match(/https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+/)?.[0] || null;
}

function extractGithubUsername(subject = "", body = "") {
  const subjectMatch = String(subject || "").match(/^([A-Za-z0-9_-]+)\s+(commented on|replied|mentioned you)/i);
  if (subjectMatch?.[1]) {
    return subjectMatch[1];
  }
  const bodyMatch = String(body || "").match(/^([A-Za-z0-9_-]+)\s+(commented|replied|mentioned)/im);
  return bodyMatch?.[1] || null;
}

export function parseGithubEmail(email = {}) {
  const subject = String(email?.subject || "").trim();
  const body = String(email?.body_text || "").trim();
  const githubIssueUrl = extractGithubIssueUrl(subject, body);
  if (!githubIssueUrl) {
    return null;
  }

  const replyText = cleanReplyText(body);
  if (!replyText) {
    return null;
  }

  return {
    githubIssueUrl,
    githubUsername: extractGithubUsername(subject, body),
    replyText,
    timestamp: String(email?.date || "").trim() || new Date().toISOString(),
  };
}
