'use client';
import styles from './page.module.css';
import Brand from './Brand';

export default function NavBar(){
  return (
    <div className={styles.navWrap}>
      <nav className={styles.nav}>
        <Brand />
        <div className={styles.navLinks}>
          <Link className={styles.link} href="/demo/playground">Demo</Link>
          <Link className={styles.link} href="/pricing">Pricing</Link>
          <Link className={styles.link} href="/onboarding">Onboarding</Link>
          <Link className={styles.link} href="/support">Support</Link>
        </div>
        <div className={styles.navCtas}>
          <Link className={`${styles.btn} ${styles.btnGhost}`} href="/demo/playground">Open demo</Link>
          <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/onboarding?trial=1">Start free trial</Link>
        </div>
      </nav>
    </div>
  );
}
import Link from "next/link";
