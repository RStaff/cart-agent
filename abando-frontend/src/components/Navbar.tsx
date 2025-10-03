"use client";
import Link from "next/link";
import styles from "./nav.module.css";
import Image from "next/image";

export default function NavBar() {
  return (
    <div className={styles.navWrap}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand} aria-label="Abando home">
          <Image src="/abando-logo.png" alt="" width={28} height={28} className={styles.brandMark} priority />
          <span className={styles.brandWord}>Abando</span>
          <sup className={styles.tm}>™</sup>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/demo/playground" className={styles.link}>Demo</Link>
          <Link href="/pricing" className={styles.link}>Pricing</Link>
          <Link href="/onboarding" className={styles.link}>Onboarding</Link>
          <Link href="/support" className={styles.link}>Support</Link>
        </div>

        <div className={styles.navCtas}>
          <Link href="/demo/playground" className={`${styles.btn} ${styles.btnGhost}`}>Open demo</Link>
          <Link href="/onboarding?trial=1" className={`${styles.btn} ${styles.btnPrimary}`}>Start free trial</Link>
        </div>
      </nav>
    </div>
  );
}
