"use client"

import Link from "next/link"
import { LiquidCtaButton } from "@/components/buttons/liquid-cta-button"
import { ArrowRight, Cpu, ShieldCheck, Lightning } from "@phosphor-icons/react"
import { motion } from "framer-motion"

export function HeroSection() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-zinc-400 font-medium">Connected to 0G Galileo Testnet</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-heading italic text-5xl md:text-8xl font-bold tracking-tight mb-8"
        >
          <span className="text-zinc-100 block">Autonomous DeFi,</span>
          <span className="bg-gradient-to-r from-zinc-500 via-zinc-200 to-zinc-500 bg-clip-text text-transparent italic">
            Executed by AI Swarms.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-12 leading-relaxed text-balance"
        >
          Watch specialized agents research, debate, and execute complex strategies on-chain — all from natural language. Built for the 0G Network.
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <Link href="/terminal">
            <LiquidCtaButton>Enter Terminal</LiquidCtaButton>
          </Link>
          <Link
            href="#features"
            className="group flex items-center gap-2 px-6 py-3 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <span>The Swarm Explained</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>

        {/* Agent Indicators */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
        >
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">Researcher</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">Risk Guard</span>
          </div>
          <div className="flex items-center gap-3">
            <Lightning className="w-5 h-5" />
            <span className="text-sm font-medium tracking-widest uppercase">Executor</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
