'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Abando home">
      {/* Decorative icon: empty alt prevents fallback text; ?v=1 busts stale caches */}
      <Image
        src="/abando-logo.svg?v=1"
        alt=""
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
