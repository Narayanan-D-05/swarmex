'use client';
import { useState, useEffect, useRef } from 'react';

type AgentLog = any;

function useAgentStream(sessionId: string) {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const retries = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    let es: EventSource;
    
    function connect() {
      es = new EventSource(`http://localhost:3001/stream/${sessionId}`);
      es.onmessage = e => {
        const log = JSON.parse(e.data);
        setLogs(prev => [...prev, log]);
        retries.current = 0;  // reset backoff on success
      };
      // Bug #27 fix: reconnect with exponential backoff (not just reload)
      es.onerror = () => {
        es.close();
        const delay = Math.min(1000 * 2 ** retries.current, 30000);
        retries.current++;
        setTimeout(connect, delay);
      };
    }
    connect();
    
    return () => es?.close();
  }, [sessionId]);

  return logs;
}

export default function TerminalPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const logs = useAgentStream(sessionId);

  const startSwarm = async () => {
    const res = await fetch('http://localhost:3001/orchestrator/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'Swap 10 USDC to ETH with max 1% slippage' })
    });
    const data = await res.json();
    setSessionId(data.sessionId);
  };

  return (
    <div className="terminal-container">
      <h1>SwarmEx Terminal</h1>
      <button onClick={startSwarm}>Execute Swarm</button>
      <div className="logs">
        {logs.map((log, i) => (
          <pre key={i}>{JSON.stringify(log, null, 2)}</pre>
        ))}
      </div>
    </div>
  );
}
