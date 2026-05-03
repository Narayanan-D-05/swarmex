'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Lightning, ChartLineUp, WarningCircle,
  PaperPlaneRight, ArrowClockwise, Link as LinkIcon,
  MagnifyingGlass, Database, Robot, Fingerprint, CheckCircle
} from '@phosphor-icons/react';
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

type AgentLog = {
  timestamp: string;
  agent: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  data?: any;
};

const AGENT_CONFIG: Record<string, { icon: any; color: string; ringColor: string; label: string; glowColor: string }> = {
  orchestrator: { icon: Robot, color: 'text-indigo-400', ringColor: 'border-indigo-500', label: 'Swarm Supervisor', glowColor: '79,70,229' },
  intentParser: { icon: Fingerprint, color: 'text-blue-400', ringColor: 'border-blue-500', label: 'Intent Decoder', glowColor: '96,165,250' },
  researcher: { icon: MagnifyingGlass, color: 'text-sky-400', ringColor: 'border-sky-500', label: 'Market Researcher', glowColor: '56,189,248' },
  RiskAgent: { icon: ShieldCheck, color: 'text-orange-400', ringColor: 'border-orange-500', label: 'Risk Guardian', glowColor: '251,146,60' },
  executor: { icon: Lightning, color: 'text-emerald-400', ringColor: 'border-emerald-500', label: 'Execution Core', glowColor: '52,211,153' },
  reporter: { icon: ChartLineUp, color: 'text-purple-400', ringColor: 'border-purple-500', label: 'Metrics Reporter', glowColor: '192,132,252' },
  System: { icon: WarningCircle, color: 'text-zinc-400', ringColor: 'border-zinc-600', label: 'Core System', glowColor: '161,161,170' },
};

// Node positions in SVG viewBox percentage (0–100)
const FLOW_NODES = [
  { id: 'intentParser', label: 'DECODE', cx: 50, cy: 13 },
  { id: 'researcher', label: 'RESEARCH', cx: 20, cy: 30 },
  { id: 'RiskAgent', label: 'VALIDATE', cx: 80, cy: 30 },
  { id: 'orchestrator', label: 'SUPERVISE', cx: 50, cy: 50 },
  { id: 'executor', label: 'EXECUTE', cx: 50, cy: 70 },
  { id: 'reporter', label: 'REPORT', cx: 50, cy: 90 },
];

// Edge definitions matching graph.ts
const EDGES = [
  { from: 'intentParser', to: 'researcher' },
  { from: 'intentParser', to: 'RiskAgent' },
  { from: 'researcher', to: 'orchestrator' },
  { from: 'RiskAgent', to: 'orchestrator' },
  { from: 'orchestrator', to: 'executor' },
  { from: 'executor', to: 'reporter' },
];

function getNode(id: string) { return FLOW_NODES.find(n => n.id === id)!; }

function EdgePath({ from, to, isActive, isCompleted }: { from: string; to: string; isActive: boolean; isCompleted: boolean }) {
  const a = getNode(from);
  const b = getNode(to);
  if (!a || !b) return null;

  // Curved path using quadratic bezier
  const mx = (a.cx + b.cx) / 2;
  const my = (a.cy + b.cy) / 2;
  const d = `M ${a.cx} ${a.cy} Q ${mx} ${my} ${b.cx} ${b.cy}`;

  return (
    <g>
      {/* Base dim line */}
      <path d={d} stroke="#3f3f46" strokeWidth="0.6" fill="none" strokeDasharray="2 3" />

      {/* Completed line */}
      {isCompleted && (
        <path d={d} stroke="#10b981" strokeWidth="1" fill="none" opacity="0.6" />
      )}

      {/* Active animated particle */}
      {isActive && (
        <>
          <motion.path
            d={d}
            stroke="url(#activeGrad)"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }}
          />
          {/* Travelling dot */}
          <motion.circle r="1.8" fill="#6366f1"
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            transition={{ duration: 1, ease: 'easeInOut', repeat: Infinity }}
            style={{ offsetPath: `path("${d}")` } as any}
          />
        </>
      )}
    </g>
  );
}

export default function TerminalPage() {
  const [intent, setIntent] = useState('swap 10 usdc to eth maximum slippage 1%');
  const [isRunning, setIsRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [visitedAgents, setVisitedAgents] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [finalTxHash, setFinalTxHash]             = useState<string | null>(null);
  const [finalRootHash, setFinalRootHash]         = useState<string | null>(null);
  const [finalRegistryTxHash, setFinalRegistryTxHash] = useState<string | null>(null);
  const [finalChain, setFinalChain]               = useState<string>('base-sepolia');
  const [showLogs, setShowLogs] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const addLog = useCallback((log: AgentLog) => {
    setLogs(prev => [...prev, log]);
    const key = Object.keys(AGENT_CONFIG).find(k => k.toLowerCase() === log.agent?.toLowerCase());
    if (key) {
      setActiveAgent(key);
      setVisitedAgents(prev => new Set(prev).add(key));
    }
  }, []);

  const startSwarm = async () => {
    if (isRunning) return;
    setLogs([]);
    setVisitedAgents(new Set());
    setFinalTxHash(null);
    setIsRunning(true);
    setActiveAgent('intentParser');

    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    const sessionId = Math.random().toString(36).substring(7);

    // ── Open SSE FIRST, then fire POST ──────────────────────────────────────
    const es = new EventSource(`http://localhost:3001/stream/${sessionId}`);
    esRef.current = es;

    // ✅ KEY FIX: server emits `event: log`, not the default `message` event
    es.addEventListener('log', (e: MessageEvent) => {
      try {
        const log: AgentLog = JSON.parse(e.data);
        addLog(log);
      } catch { }
    });

    // Also handle generic messages (connected ack etc.)
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'connected') return;
        addLog(d);
      } catch { }
    };

    es.addEventListener('completed', (e: any) => {
      setIsRunning(false);
      setActiveAgent(null);
      try {
        const data = JSON.parse(e.data);
        if (data.txHash)         setFinalTxHash(data.txHash);
        if (data.rootHash)       setFinalRootHash(data.rootHash);
        if (data.registryTxHash) setFinalRegistryTxHash(data.registryTxHash);
        if (data.chain)          setFinalChain(data.chain || 'base-sepolia');
      } catch { }
      es.close();
    });

    es.addEventListener('error', () => {
      setIsRunning(false);
      setActiveAgent(null);
    });

    es.onerror = () => {
      // Don't spam retries — EventSource auto-retries
    };

    // Small delay so SSE handshake is fully established before backend starts emitting
    await new Promise(r => setTimeout(r, 300));

    try {
      const res = await fetch('http://localhost:3001/orchestrator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, sessionId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      addLog({ timestamp: new Date().toISOString(), agent: 'System', message: `Connection Error: ${err.message}. Ensure backend is running on port 3001.`, type: 'error' });
      setIsRunning(false);
      setActiveAgent(null);
      es.close();
    }
  };

  // Determine which edges to highlight
  const activeEdges = EDGES.filter(e => e.to === activeAgent);
  const completedEdges = EDGES.filter(e => visitedAgents.has(e.from) && visitedAgents.has(e.to));

  return (
    <div className="min-h-screen bg-black text-white font-['Space_Grotesk'] selection:bg-indigo-500/30">
      <Navbar />

      <main className="pt-16 h-screen flex overflow-hidden">
        {/* ── Left Sidebar ─────────────────────────────────────── */}
        <div className="w-72 border-r border-zinc-800/50 bg-zinc-950/60 backdrop-blur-xl flex flex-col shrink-0">
          {/* Network badge */}
          <div className="p-5 border-b border-zinc-800/50">
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-3">Swarm Intelligence</p>
            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-zinc-300 font-medium">0G Mainnet (Test)</span>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">Optimal</Badge>
            </div>
          </div>

          {/* Agent list */}
          <div className="flex-1 p-5 overflow-y-auto">
            <p className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mb-3">Active Workflow</p>
            <div className="space-y-1.5">
              {FLOW_NODES.map((node, idx) => {
                const cfg = AGENT_CONFIG[node.id];
                const isActive = activeAgent === node.id;
                const isVisited = visitedAgents.has(node.id);
                return (
                  <div key={node.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-400
                    ${isActive ? 'bg-indigo-500/10 border border-indigo-500/20' : isVisited ? 'bg-emerald-500/5 border border-emerald-500/10 opacity-80' : 'opacity-30'}`}>
                    <div className={`p-1.5 rounded-lg bg-zinc-900 ${isActive ? cfg.color : isVisited ? 'text-emerald-500' : 'text-zinc-600'}`}>
                      {isVisited && !isActive ? <CheckCircle size={16} weight="fill" /> : <cfg.icon size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-zinc-300 truncate">{cfg.label}</div>
                      <div className="text-[9px] text-zinc-500 uppercase tracking-tighter">
                        {isActive ? 'Processing...' : isVisited ? 'Completed ✓' : 'Standby'}
                      </div>
                    </div>
                    {/* Step number */}
                    <span className="text-[9px] text-zinc-700 font-mono">{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Intent input */}
          <div className="p-5 border-t border-zinc-800/50">
            <div className="p-4 rounded-2xl bg-gradient-to-b from-zinc-900/60 to-zinc-950 border border-zinc-800/50 backdrop-blur-2xl shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PaperPlaneRight size={12} className={isRunning ? 'text-emerald-400' : 'text-indigo-500'} />
                  <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Prediction Query</span>
                </div>
                {isRunning && (
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
                  </div>
                )}
              </div>
              <textarea
                value={intent}
                onChange={e => setIntent(e.target.value)}
                disabled={isRunning}
                placeholder="swap 10 usdc to eth maximum slippage 1%"
                className="w-full bg-transparent border-none focus:ring-0 text-[11px] text-zinc-300 placeholder:text-zinc-700 resize-none h-20 scrollbar-hide"
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), startSwarm())}
              />
              <Button
                onClick={startSwarm}
                disabled={isRunning || !intent.trim()}
                className={`w-full rounded-xl h-10 transition-all duration-500 ${isRunning ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-black hover:bg-zinc-100'}`}
              >
                <div className="flex items-center gap-2">
                  {isRunning
                    ? <ArrowClockwise className="w-4 h-4 animate-spin" />
                    : <Lightning size={16} weight="fill" />}
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {isRunning ? 'Running...' : 'Deploy Swarm'}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Center Canvas ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_center,_#0a0a0f_0%,_#000_70%)]">
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          {/* SVG Canvas for edges + nodes */}
          <div className="flex-1 relative overflow-hidden">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
              style={{ padding: '0' }}
            >
              <defs>
                <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ── Edges ── */}
              {EDGES.map(edge => {
                const isEdgeActive = activeEdges.some(e => e.from === edge.from && e.to === edge.to);
                const isCompleted = completedEdges.some(e => e.from === edge.from && e.to === edge.to);
                return (
                  <EdgePath
                    key={`${edge.from}-${edge.to}`}
                    from={edge.from} to={edge.to}
                    isActive={isEdgeActive}
                    isCompleted={isCompleted}
                  />
                );
              })}

              {/* ── Nodes ── */}
              {FLOW_NODES.map(node => {
                const cfg = AGENT_CONFIG[node.id];
                const isActive = activeAgent === node.id;
                const isVisited = visitedAgents.has(node.id);

                const outerR = 4.5;
                const innerR = 3.2;

                return (
                  <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                    {/* Glow pulse ring when active */}
                    {isActive && (
                      <motion.circle
                        r={outerR + 2}
                        fill="none"
                        stroke={`rgba(${cfg.glowColor},0.25)`}
                        strokeWidth="1.5"
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}

                    {/* Outer ring */}
                    <circle
                      r={outerR}
                      fill="#09090b"
                      stroke={isActive ? `rgba(${cfg.glowColor},0.9)` : isVisited ? '#10b981' : '#27272a'}
                      strokeWidth={isActive ? 0.7 : 0.4}
                      filter={isActive ? 'url(#nodeGlow)' : undefined}
                    />

                    {/* Inner fill */}
                    <circle
                      r={innerR}
                      fill={isActive ? `rgba(${cfg.glowColor},0.12)` : isVisited ? 'rgba(16,185,129,0.08)' : 'transparent'}
                    />

                    {/* Agent Icon */}
                    <foreignObject x="-2.5" y="-2.5" width="5" height="5">
                      <div className={`flex items-center justify-center w-full h-full ${isActive ? cfg.color : isVisited ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        <cfg.icon size="100%" weight={isActive ? "fill" : "regular"} />
                      </div>
                    </foreignObject>

                    {/* Step label above node */}
                    <text
                      y={-outerR - 1.8}
                      textAnchor="middle"
                      fontSize="1.8"
                      fontWeight="700"
                      letterSpacing="0.6"
                      fill={isActive ? `rgba(${cfg.glowColor},1)` : '#52525b'}
                      style={{ fontFamily: 'Space Grotesk, sans-serif', textTransform: 'uppercase' }}
                    >
                      {node.label}
                    </text>

                    {/* Agent name below */}
                    <text
                      y={outerR + 2.8}
                      textAnchor="middle"
                      fontSize="2"
                      fill={isActive ? '#e4e4e7' : '#52525b'}
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {cfg.label}
                    </text>

                    {/* Status dot */}
                    {isVisited && !isActive && (
                      <circle cx={outerR - 0.8} cy={-outerR + 0.8} r="1.2" fill="#10b981" />
                    )}
                    {isActive && (
                      <motion.circle
                        cx={outerR - 0.8} cy={-outerR + 0.8} r="1.2"
                        fill={`rgba(${cfg.glowColor},1)`}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Success Banner — 3 verifiable links */}
            <AnimatePresence>
              {finalTxHash && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50"
                >
                  <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl px-6 py-4 rounded-2xl flex items-start gap-4 shadow-2xl shadow-emerald-500/10">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-1">
                      <CheckCircle size={24} weight="fill" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">Swarm Execution Successful</h4>
                      <p className="text-[10px] text-zinc-400 mb-3">Trade settled on Uniswap v4. Execution archived to 0G.</p>
                      <div className="flex flex-col gap-2">
                        {/* Link 1: Uniswap v4 swap on Base Sepolia */}
                        <a
                          href={`https://sepolia.basescan.org/tx/${finalTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-bold transition-all"
                        >
                          <Lightning size={12} />
                          Uniswap v4 Swap (Base Sepolia): {finalTxHash.slice(0, 10)}...{finalTxHash.slice(-8)}
                        </a>
                        {/* Link 2: 0G Storage proof */}
                        {finalRootHash && (
                          <a
                            href={`https://storagescan-newton.0g.ai`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-[10px] font-bold transition-all"
                          >
                            <Database size={12} />
                            0G Storage Proof: {finalRootHash.slice(0, 10)}...{finalRootHash.slice(-8)}
                          </a>
                        )}
                        {/* Link 3: 0G Agent Registry update */}
                        {finalRegistryTxHash && (
                          <a
                            href={`https://chainscan-galileo.0g.ai/tx/${finalRegistryTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg text-[10px] font-bold transition-all"
                          >
                            <ShieldCheck size={12} />
                            0G Agent Registry: {finalRegistryTxHash.slice(0, 10)}...{finalRegistryTxHash.slice(-8)}
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { setFinalTxHash(null); setFinalRootHash(null); setFinalRegistryTxHash(null); }}
                      className="ml-2 p-1 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors shrink-0"
                    >
                      <WarningCircle size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ── Log Drawer ───────────────────────────────────────── */}
          <div className={`transition-all duration-500 ${showLogs ? 'h-56' : 'h-11'} border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur-2xl shrink-0`}>
            <div className="h-11 px-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Live Output</span>
                <span className="text-[10px] text-zinc-600">·</span>
                <span className="text-[10px] text-zinc-600">{logs.length} events</span>
              </div>
              <button onClick={() => setShowLogs(v => !v)} className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                {showLogs ? 'Minimize ↓' : 'Expand ↑'}
              </button>
            </div>

            {showLogs && (
              <ScrollArea className="h-44 px-5 pb-4" ref={scrollRef}>
                <div className="space-y-3 pt-1">
                  <AnimatePresence initial={false}>
                    {logs.map((log, i) => {
                      const cfg = AGENT_CONFIG[
                        Object.keys(AGENT_CONFIG).find(k => k.toLowerCase() === log.agent?.toLowerCase()) ?? 'System'
                      ] ?? AGENT_CONFIG.System;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-3 group"
                        >
                          <span className="text-[9px] font-mono text-zinc-700 pt-0.5 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <cfg.icon size={10} className={cfg.color} />
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-snug group-hover:text-zinc-300 transition-colors break-words">
                              {log.message.split('\n').map((line, li) => {
                                const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                                if (urlMatch) {
                                  const [pre, url, post] = [line.slice(0, urlMatch.index), urlMatch[0], line.slice((urlMatch.index ?? 0) + urlMatch[0].length)];
                                  return <span key={li} className="block">{pre}<a href={url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-200 underline underline-offset-2 break-all">{url}</a>{post}</span>;
                                }
                                return <span key={li} className="block">{line}</span>;
                              })}
                            </p>
                            {log.data?.txHash && (
                              <a href={`https://chainscan-galileo.0g.ai/tx/${log.data.txHash}`} target="_blank"
                                className="inline-flex items-center gap-1 mt-1 text-[9px] text-indigo-400 hover:text-indigo-300 transition-colors">
                                <LinkIcon size={9} />
                                View on 0G Scan: {log.data.txHash.slice(0, 12)}...{log.data.txHash.slice(-8)}
                              </a>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {logs.length === 0 && (
                    <p className="text-[10px] text-zinc-700 italic">Waiting for swarm deployment...</p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────── */}
        <div className="w-64 border-l border-zinc-800/50 bg-zinc-950/60 backdrop-blur-xl p-5 hidden lg:flex flex-col gap-6 shrink-0">
          <section>
            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mb-4">Workflow Rules</p>
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-zinc-400">Execution Limit</span>
                <span className="text-indigo-400 font-mono">10 A0GI</span>
              </div>
              <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full w-[65%] bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full" />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {[
                { label: 'Auto-Slippage', on: true },
                { label: 'Guardian Protocol', on: true },
                { label: 'Parallel Intelligence', on: false },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/40">
                  <span className="text-[10px] text-zinc-400">{r.label}</span>
                  <div className="w-7 h-3.5 bg-zinc-800 rounded-full relative">
                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all ${r.on ? 'left-[calc(100%-12px)] bg-indigo-500' : 'left-0.5 bg-zinc-600'}`} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex-1 flex flex-col justify-end">
            <div className="p-4 rounded-2xl bg-zinc-900/20 border border-dashed border-zinc-800 text-center">
              <Database size={20} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-[10px] text-zinc-600 font-medium">Memory Persistence</p>
              <p className="text-[9px] text-zinc-800 mt-1 leading-snug">All executions archived to 0G Storage</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
