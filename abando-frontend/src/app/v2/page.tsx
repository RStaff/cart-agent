import NavBar from "../../components/NavBar";
import Link from "next/link";
import styles from "./page.module.css";

export default function Page() {
  return (
    <div className={styles.shell}>
      <NavBar />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <span className={styles.badge}>New • 14-day free trial</span>
            <h1 className={styles.h1}>
              Recover more checkouts with your AI<br/>Shopping Copilot
            </h1>
            <p className={styles.sub}>
              Abando<sup>™</sup> answers questions, handles objections, and guides buyers
              through checkout—so abandonment turns into orders.
            </p>
            <div className={styles.heroCtas}>
              <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/onboarding">Start Free Trial</Link>
              <Link className={`${styles.btn} ${styles.btnGhost}`} href="/demo/playground">Try the Demo</Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={`${styles.container} ${styles.grid}`}>
            <div className={styles.card}>
              <h3>Why it converts</h3>
              <ul>
                <li>Answers that convert (shipping, sizing, returns)</li>
                <li>Guided checkout with minimal friction</li>
                <li>Proven playbooks (discount, urgency, FAQ)</li>
                <li>Analytics that show recovered revenue</li>
              </ul>
            </div>
            <div className={styles.card}>
              <div className={styles.chat}>
                <div className={`${styles.msg} ${styles.bot}`}>👋 Hey there! I can answer questions and guide you to checkout.</div>
                <div className={`${styles.msg} ${styles.user}`}>Do you have free returns?</div>
                <div className={`${styles.msg} ${styles.bot}`}>Yes—30 days, no questions asked. Ready to checkout?</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <small>
            © 2025 Abando<sup>™</sup> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/dpa">DPA</Link>
          </small>
        </div>
      </footer>
    </div>
  );
}
