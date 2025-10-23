'use client';
import styles from './page.module.css';
import Brand from './Brand';

export default function NavBar(){
  return (
    <div className={styles.navWrap}>
      <nav className={styles.nav}>
        <Brand />
        <div className={styles.navLinks}>
          <Link href="/demo/playground" data-cta="open_demo" className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white shadow-sm">Open Interactive Demo</Link>
          <Link href="/onboarding?trial=1" data-cta="start_free_trial" className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-sm">Start AI Revenue Trial</Link>
        </div>
      </nav>
    </div>
  );
}
import Link from "next/link";
