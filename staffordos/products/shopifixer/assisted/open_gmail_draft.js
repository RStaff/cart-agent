function cleanText(value) {
  return String(value || "").trim();
}

export function buildGmailDraftUrl({ to = "", subject = "", body = "" } = {}) {
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1");

  const normalizedTo = cleanText(to);
  const normalizedSubject = cleanText(subject);
  const normalizedBody = cleanText(body);

  if (normalizedTo) params.set("to", normalizedTo);
  if (normalizedSubject) params.set("su", normalizedSubject);
  if (normalizedBody) params.set("body", normalizedBody);

  return `https://mail.google.com/mail/?${params.toString()}`;
}

function main() {
  const [to, subject, body] = process.argv.slice(2);
  console.log(buildGmailDraftUrl({ to, subject, body }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
