import Link from "next/link";
export default function Footer() {
  return (
    <footer style={{background:"var(--bg)",color:"#9fb0c6",padding:"24px 0",font:"500 13px/1.4 system-ui,-apple-system,sans-serif"}}>
      <div style={{width:"min(1120px,92vw)",margin:"0 auto",padding:"0 16px"}}>
        <small>
          © 2025 Abando<sup>™</sup> · <Link href="/legal/terms">Terms</Link> · <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/dpa">DPA</Link>
        </small>
      </div>
    </footer>
  );
}
