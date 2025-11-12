"use client";
import Image from "next/image";
export default function BrandLogo({width=240,height=28}:{width?:number;height?:number}){
  return <Image src="/brand/abando-logo.svg" alt="Abando" width={width} height={height} priority/>;
}
