import React, { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api.ts';

export const DatabaseHealthBadge: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [dbName, setDbName] = useState<string>('');
  const [latency, setLatency] = useState<number | null>(null);

  const checkHealth = async () => {
    const start = performance.now();
    try {
      const data = await api.getHealth();
      const end = performance.now();
      if (data.status === 'healthy') {
        setStatus('healthy');
        setDbName(data.databaseName || 'Cloud SQL');
        setLatency(Math.round(end - start));
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={checkHealth}
      title="Live PostgreSQL Cloud SQL connection status. Click to refresh."
      className="hidden md:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 shadow-xs"
    >
      <Database className="w-3.5 h-3.5 text-emerald-600" />
      <span className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold">PostgreSQL</span>
        {status === 'healthy' && (
          <span className="text-emerald-700 font-mono text-[11px]">
            {dbName ? `(${dbName})` : ''} {latency ? `· ${latency}ms` : ''}
          </span>
        )}
        {status === 'checking' && <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />}
        {status === 'error' && (
          <span className="text-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Offline
          </span>
        )}
      </span>
    </div>
  );
};
