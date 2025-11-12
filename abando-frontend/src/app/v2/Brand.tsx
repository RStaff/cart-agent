'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Abando home">
      <Image
        src="/abando-logo.png"
        alt=""             // decorative: no redundant text
        width={28}
        height={28}
        className={styles.brandMark}
        priority
      />
      <span className={styles.brandWord}>Abando</span>
      <sup className={styles.tm}>™</sup>
    </Link>
  );
}
