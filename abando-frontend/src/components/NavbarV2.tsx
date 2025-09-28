'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useEffect, useState} from 'react';
const links=[{href:'/demo/playground',label:'Demo'},{href:'/pricing',label:'Pricing'},{href:'/onboarding',label:'Onboarding'},{href:'/support',label:'Support'}];
export default function NavbarV2(){
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{const on=()=>setScrolled(window.scrollY>10);on();window.addEventListener('scroll',on);return()=>window.removeEventListener('scroll',on)},[]);
  return (
    <header className={`sticky top-0 z-40 w-full ${scrolled?'bg-[#0B1220]/95 border-b border-white/10':'bg-transparent'} backdrop-blur transition-colors`}>
      <nav className="container mx-auto max-w-6xl px-4 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Abando" width={26} height={26} className="rounded-sm"/>
          <span className="font-semibold text-slate-100">Abando</span>
          <sup className="ml-1 text-xs text-slate-300">™</sup>
        </Link>
        <div className="hidden gap-6 sm:flex">
          {links.map(l=> <a key={l.href} href={l.href} className="text-sm text-slate-300 hover:text-slate-100">{l.label}</a>)}
        </div>
        <div className="flex items-center gap-2">
          <a href="/demo/playground" className="hidden sm:inline rounded-md px-3 py-1.5 text-sm text-slate-100/90 hover:text-slate-100">Open demo</a>
          <a href="/onboarding?trial=1" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">Start free trial</a>
        </div>
      </nav>
    </header>
  );
}
