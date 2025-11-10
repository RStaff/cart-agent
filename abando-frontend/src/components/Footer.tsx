import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <small>
          © 2025 Abando<sup>™</sup> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/dpa">DPA</Link>
        </small>
      </div>
    </footer>
  );
}
