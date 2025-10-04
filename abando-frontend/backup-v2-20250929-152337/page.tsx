import styles from './page.module.css';
import NavBar from './NavBar';

export const metadata = {
  title: 'Abando – Recover abandoned carts with AI',
  description: 'Cart Agent follows up across email and chat to recover revenue.',
};

export default function Page() {
  return (
    <div className={styles.page}>
      <NavBar />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <span className={styles.badge}>New • 14-day free trial</span>
          <h1 className={styles.h1}>Recover more checkouts with your AI Shopping Copilot</h1>
          <p className={styles.sub}>
            Abando<sup>™</sup> answers questions, handles objections, and guides buyers through
            checkout—so abandonment turns into orders.
          </p>
          <div className={styles.heroCtas}>
            <a className={`${styles.btn} ${styles.btnPrimary}`} href="/onboarding">Start Free Trial</a>
            <a className={`${styles.btn} ${styles.btnGhost}`} href="/demo/playground">Try the Demo</a>
          </div>
        </div>
      </section>

      {/* Divider band */}
      <section className={styles.band}>
        <div className={styles.container}>
          <div>Trusted by founders</div>
          <div className={styles.bandRule} />
        </div>
      </section>

      {/* Two-column cards */}
      <section style={{background:'#0B1220', padding:'24px 0 64px'}}>
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

      <div className={styles.spacer} />
      <footer className={styles.footer}>
        <div className={styles.container}>
          <small>© 2025 Abando<sup>™</sup> · <a href="/legal/terms">Terms</a> · <a href="/legal/privacy">Privacy</a> · <a href="/legal/dpa">DPA</a></small>
        </div>
      </footer>
    </div>
  );
}
