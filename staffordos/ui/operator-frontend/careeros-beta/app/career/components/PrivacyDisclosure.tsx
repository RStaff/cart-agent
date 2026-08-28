import Link from "next/link";

const betaFeedbackHref = "https://www.staffordmedia.ai/contact";

export function PrivacyDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) return <aside className="careerPrivacyDisclosure careerPrivacyDisclosureCompact" aria-label="CareerOS data privacy"><p className="careerMuted">Your career information is private to your account. <Link href="/career/privacy">Data &amp; privacy</Link></p></aside>;
  return <aside className={compact ? "careerPrivacyDisclosure careerPrivacyDisclosureCompact" : "careerPrivacyDisclosure"} aria-label="CareerOS beta data notice">
    <p className="careerEyebrow">Private beta data notice</p>
    <h2>How CareerOS uses your career information</h2>
    <p className="careerMuted">CareerOS is an invite-only early beta. Information you submit is stored in your private, tenant-scoped CareerOS account and used to organize your experience, review capabilities, compare job descriptions, and explain fit.</p>
    <p className="careerMuted">CareerOS uses deterministic and automated processing to propose source-backed CareerFacts and information for your review. Confirming or correcting proposed experience and capability answers is part of the customer review flow; the system does not silently treat every inference as fact.</p>
    <p className="careerMuted">Results are informational and may be incomplete or incorrect. Missing evidence is treated as unknown or not enough evidence, not automatically as proof that you lack a capability. Customer information is not intentionally exposed to other CareerOS tenants.</p>
    <p className="careerMuted">You can export your customer-owned CareerOS data using the <a href="/api/career/account/export">account export function</a> and delete your account using the account deletion function. Current beta intake supports bounded pasted, manual, or optional microphone-assisted text; binary resume and document uploads are not supported.</p>
    <p className="careerMuted">Microphone use is optional. If you choose it, your recording is sent to an external transcription service to create text. CareerOS does not intentionally retain the raw audio; you can edit the transcript, and only text you submit enters your career-information flow. Paste or type remains available.</p>
    <p className="careerMuted">AI writing assistance is optional. If you choose it, the relevant job information and confirmed experience used for that draft are sent to an external AI writing service to improve wording. The generated wording stays separate from your confirmed career information, and you should review it before using it.</p>
    <p className="careerMuted">Only submit information you are comfortable using in this early beta. <Link href="/career/privacy">Read this notice later</Link> or <a href={betaFeedbackHref} target="_blank" rel="noreferrer">send beta feedback</a>.</p>
  </aside>;
}
