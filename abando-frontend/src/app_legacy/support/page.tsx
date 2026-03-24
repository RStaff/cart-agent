import Link from "next/link";
export default function SupportPage(){
  return <main style={{maxWidth:960,margin:"64px auto",padding:"0 16px"}}>
    <h1>Support</h1>
    <p style={{color:"#9fb0c6"}}>Email support@abando.ai and we’ll get back to you within 1 business day.</p>
    <p><Link href="/">← Back home</Link></p>
  </main>;
}
