'use client';
import styles from './page.module.css';
import Brand from './Brand';

export default function NavBar() {
  return (
    <div className={styles.navWrap}>
      <nav className={styles.nav}>
        <Brand />
        <div className={styles.navLinks}>
          <a className={styles.link} href="/demo/playground">Demo</a>
          <a className={styles.link} href="/pricing">Pricing</a>
          <a className={styles.link} href="/onboarding">Onboarding</a>
          <a className={styles.link} href="/support">Support</a>
        </div>
        <div className={styles.navCtas}>
          <a className={`${styles.btn} ${styles.btnGhost}`} href="/demo/playground">Open demo</a>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href="/onboarding?trial=1">Start free trial</a>
        </div>
      </nav>
    </div>
  );
}
