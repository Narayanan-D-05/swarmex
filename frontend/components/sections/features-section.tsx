"use client"

import { motion } from "framer-motion"
import { Cpu, ShieldCheck, Lightning, ArrowRight, MagnifyingGlass, ChartLineUp } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const agents = [
  {
    name: "The Researcher",
    role: "Market Intelligence",
    description: "Scans 100+ liquidity pools in seconds, identifying the most efficient execution paths and price impact thresholds across 0G Galileo.",
    icon: MagnifyingGlass,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "group-hover:border-sky-500/50",
  },
  {
    name: "The Risk Guard",
    role: "Capital Protection",
    description: "Monitors slippage, contract vulnerabilities, and network congestion. Ensures every transaction meets your pre-defined safety parameters.",
    icon: ShieldCheck,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "group-hover:border-orange-500/50",
  },
  {
    name: "The Executor",
    role: "On-Chain Precision",
    description: "Executes complex multi-step transactions with surgical precision. Manages gas limits and delta values to ensure success without manual intervention.",
    icon: Lightning,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "group-hover:border-emerald-500/50",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-32 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="font-heading italic text-4xl md:text-5xl font-bold text-zinc-100 mb-6">
            Meet the Swarm
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">
            Specialized agents working in harmony to navigate the complexities of decentralized finance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className={`group h-full overflow-hidden border-zinc-800/50 bg-zinc-900/20 backdrop-blur-sm transition-all duration-500 rounded-3xl ${agent.border}`}>
                <CardContent className="p-8 flex flex-col h-full">
                  <div className={`w-14 h-14 rounded-2xl ${agent.bg} flex items-center justify-center mb-8 border border-zinc-800 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <agent.icon size={28} weight="duotone" className={agent.color} />
                  </div>
                  
                  <div className="mb-4">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${agent.color} mb-1`}>{agent.role}</p>
                    <h3 className="text-2xl font-bold text-zinc-100">{agent.name}</h3>
                  </div>
                  
                  <p className="text-zinc-500 text-sm leading-relaxed mb-8">
                    {agent.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600 font-mono">STATUS: STANDBY</span>
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Network Status Pill */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-24 flex justify-center"
        >
          <div className="flex items-center gap-6 px-8 py-4 rounded-full bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-xl">
             <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">0G Galileo Testnet</span>
             </div>
             <Separator orientation="vertical" className="h-4 bg-zinc-800" />
             <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
               <ChartLineUp size={16} />
               <span>Latency: 24ms</span>
             </div>
             <Separator orientation="vertical" className="h-4 bg-zinc-800" />
             <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
               <ShieldCheck size={16} />
               <span>v4 Hooks Active</span>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
