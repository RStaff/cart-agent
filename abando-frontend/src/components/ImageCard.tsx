import * as React from "react";

export function ImageCard({
  src, alt="Product image", ratio="4/3", maxHeight=260, border=true,
}: { src?: string; alt?: string; ratio?: "1/1"|"4/3"|"16/9"; maxHeight?: number; border?: boolean }) {
  if (!src) {
    return (
      <div style={{
        height: maxHeight, borderRadius: 12, display:"grid", placeItems:"center",
        background:"#0b1220", border: border ? "1px solid rgba(255,255,255,.08)" : "none",
        color:"#64748b", fontSize:13
      }}>
        No image
      </div>
    );
  }
  const [e, setErr] = React.useState(false);
  return (
    <div style={{
      position:"relative", overflow:"hidden", borderRadius: 12, background:"#0b1220",
      border: border ? "1px solid rgba(255,255,255,.08)" : "none",
      maxHeight, aspectRatio: ratio,
    }}>
      {!e ? (
        <img
          src={src}
          alt={alt}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={()=>setErr(true)}
          loading="lazy"
        />
      ) : (
        <div style={{height:"100%", display:"grid", placeItems:"center", color:"#64748b"}}>Image unavailable</div>
      )}
    </div>
  );
}
export default ImageCard;
