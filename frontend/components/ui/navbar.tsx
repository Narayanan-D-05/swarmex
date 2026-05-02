"use client"

import Link from "next/link"

const navLinks = [
  { href: "#features", label: "Swarm Explained" },
]

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 p-6">
      <nav className="max-w-5xl mx-auto flex items-center justify-between h-14 px-8 rounded-full bg-zinc-950/80 border border-zinc-800/50 backdrop-blur-xl">
        <Link href="/" className="font-heading italic text-xl font-bold text-zinc-100 tracking-tight">
          SwarmEx
        </Link>
        <div className="flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium transition-colors text-zinc-500 hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/terminal"
            className="ml-4 px-6 py-2 text-sm rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Launch Terminal
          </Link>
        </div>
      </nav>
    </header>
  )
}
