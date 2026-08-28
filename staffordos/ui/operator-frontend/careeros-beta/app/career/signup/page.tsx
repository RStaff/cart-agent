import { AuthForm } from "../components/AuthForm";

export default function CareerSignupPage() {
  return <>
    <section className="careerPublicShell careerSignupIntro" aria-labelledby="career-signup-intro-heading">
      <p className="careerEyebrow">Private beta</p>
      <h1 id="career-signup-intro-heading">CareerOS</h1>
      <p className="careerSignupLead">Build a clearer picture of your experience, review what CareerOS understands, and test it against a job description.</p>
      <div className="careerTrustGrid" aria-label="CareerOS beta commitments">
        <article className="careerTrustItem"><span className="careerTrustMark" aria-hidden="true">01</span><div><h2>Private by default</h2><p>Your career information stays in your private CareerOS account.</p></div></article>
        <article className="careerTrustItem"><span className="careerTrustMark" aria-hidden="true">02</span><div><h2>You are in control</h2><p>CareerOS proposes information for you to review, confirm, or correct.</p></div></article>
        <article className="careerTrustItem"><span className="careerTrustMark" aria-hidden="true">03</span><div><h2>CareerOS can be wrong</h2><p>Results are informational and may be incomplete or incorrect.</p></div></article>
        <article className="careerTrustItem"><span className="careerTrustMark" aria-hidden="true">04</span><div><h2>Optional AI features</h2><p>Transcription and AI writing are used only when you choose them.</p></div></article>
      </div>
      <nav className="careerSignupLinks" aria-label="CareerOS signup information">
        <a href="/career/privacy">Read full privacy notice</a>
        <a href="https://www.staffordmedia.ai/contact" target="_blank" rel="noreferrer">Send beta feedback</a>
      </nav>
    </section>
    <AuthForm mode="signup" />
  </>;
}
