import { useState, useEffect } from 'react';
import { Command } from '@tauri-apps/plugin-shell';

function App() {
  const [vaultAddress, setVaultAddress] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [dockerStatus, setDockerStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [logs, setLogs] = useState<string[]>([]);
  const [childProcess, setChildProcess] = useState<any>(null);
  
  // Telemetry state
  const [activePort, setActivePort] = useState<number | null>(null);
  const [nodeStatus, setNodeStatus] = useState<any>(null);
  const [dbLogs, setDbLogs] = useState<any[]>([]);

  useEffect(() => {
    checkDocker();
  }, []);

  // Telemetry Polling
  useEffect(() => {
    if (!activePort) return;
    
    const interval = setInterval(async () => {
      try {
        const statusRes = await fetch(`http://127.0.0.1:${activePort}/status`);
        if (statusRes.ok) {
          const data = await statusRes.json();
          setNodeStatus(data);
        }
        
        const logsRes = await fetch(`http://127.0.0.1:${activePort}/logs`);
        if (logsRes.ok) {
          const data = await logsRes.json();
          setDbLogs(data.logs || []);
        }
      } catch (e) {
        // Silent catch for telemetry errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activePort]);

  const checkDocker = async () => {
    try {
      const output = await Command.create('docker', ['info']).execute();
      if (output.code === 0) {
        setDockerStatus('ok');
      } else {
        setDockerStatus('error');
      }
    } catch (e) {
      setDockerStatus('error');
    }
  };

  const toggleNode = async () => {
    if (isRunning) {
      // Graceful Stop via HTTP
      if (activePort) {
        try {
          await fetch(`http://127.0.0.1:${activePort}/shutdown`, { method: 'POST' });
        } catch (e) {
          console.error("Failed to call /shutdown:", e);
        }
      }
      
      // Fallback kill if process is still tracked
      if (childProcess) {
        try {
          await childProcess.kill();
        } catch (e) {}
        setChildProcess(null);
      }
      
      setIsRunning(false);
      setActivePort(null);
      setNodeStatus(null);
      setDbLogs([]);
      setLogs((prev) => [...prev, 'System: Node stopped.']);
    } else {
      if (!vaultAddress || !vaultAddress.startsWith('0x')) {
        setLogs((prev) => [...prev, 'Error: Invalid Operator Vault address.']);
        return;
      }
      
      setLogs([]); // Clear logs on start
      setActivePort(null);
      setNodeStatus(null);
      
      try {
        const command = Command.sidecar('binaries/worker-bin', []);
        
        command.on('close', (data) => {
          setLogs((prev) => [...prev, `System: Sidecar closed with code ${data.code}`]);
          setIsRunning(false);
          setChildProcess(null);
          setActivePort(null);
          setNodeStatus(null);
        });

        command.on('error', (error) => {
          setLogs((prev) => [...prev, `Error: ${error}`]);
        });

        command.stdout.on('data', (line) => {
          setLogs((prev) => [...prev, `Stdout: ${line}`]);
          // Dynamic Port Discovery
          const match = line.match(/http:\/\/127\.0\.0\.1:(\d+)/);
          if (match && match[1]) {
            setActivePort(parseInt(match[1], 10));
          }
        });

        command.stderr.on('data', (line) => {
          setLogs((prev) => [...prev, `Stderr: ${line}`]);
          // Uvicorn logs to stderr by default!
          const match = line.match(/http:\/\/127\.0\.0\.1:(\d+)/);
          if (match && match[1]) {
            setActivePort(parseInt(match[1], 10));
          }
        });

        const child = await command.spawn();
        setChildProcess(child);
        setIsRunning(true);
        setLogs((prev) => [...prev, 'System: Node started securely in background.']);
      } catch (e: any) {
        setLogs((prev) => [...prev, `Error starting node: ${e.toString()}`]);
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-rose-50 min-h-screen text-slate-800 font-sans p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Autonome DePIN Node</h1>
          <p className="mt-2 text-lg text-slate-500 font-medium">Ephemeral Compute Runner</p>
        </div>

        {/* Docker Pre-Flight Banner */}
        {dockerStatus === 'error' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">
                  Docker Desktop is required to run sandboxed AI workloads. Please start Docker and restart the app.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Vault Address Input (Glass Card) */}
        <div className="bg-white/70 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/50">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Operator Vault Address (ERC-4337)
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={vaultAddress}
            onChange={(e) => setVaultAddress(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-orange-400 outline-none text-slate-800 font-mono text-sm shadow-sm transition-all"
            disabled={isRunning}
          />
          <p className="text-xs text-slate-500 mt-2">
            Earnings (1.5 ATMA / task) are routed safely to this cold smart account. Execution keys are ephemeral.
          </p>

          <button
            onClick={toggleNode}
            disabled={dockerStatus !== 'ok'}
            className={`w-full mt-4 py-3 px-8 rounded-full font-bold shadow-md transition-all ${
              dockerStatus !== 'ok' 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : isRunning 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white' 
                  : 'bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white'
            }`}
          >
            {isRunning ? 'Stop Node' : 'Start Node'}
          </button>
        </div>

        {/* Telemetry Dashboard */}
        {isRunning && nodeStatus && (
          <div className="bg-white/70 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/50 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="col-span-1 md:col-span-2 flex justify-between items-center pb-4 border-b border-slate-200/50">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Node Address</p>
                <p className="text-sm font-mono text-slate-800 bg-slate-100 px-3 py-1 rounded-md border border-slate-200 shadow-sm">{nodeStatus.node_address || "Loading..."}</p>
              </div>
              <div className="text-right flex items-center space-x-6">
                <div>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Port</p>
                   <p className="text-sm font-semibold text-slate-800">{activePort}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Network</p>
                  <p className="text-sm font-semibold text-orange-600 bg-orange-100 border border-orange-200 px-2 py-1 rounded-md">{nodeStatus.network?.chain_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Status</p>
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <p className="text-sm font-semibold text-slate-800">{nodeStatus.status}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">CPU Usage</span>
                <span className="text-sm font-bold text-slate-900">{nodeStatus.hardware?.cpu_usage_pct}%</span>
              </div>
              <div className="w-full bg-slate-200/60 rounded-full h-3 shadow-inner overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-rose-400 h-3 rounded-full transition-all duration-500" style={{ width: `${nodeStatus.hardware?.cpu_usage_pct || 0}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Process RAM</span>
                <span className="text-sm font-bold text-slate-900">{nodeStatus.hardware?.process_ram_mb} MB</span>
              </div>
              <div className="w-full bg-slate-200/60 rounded-full h-3 shadow-inner overflow-hidden">
                <div className="bg-gradient-to-r from-rose-400 to-red-400 h-3 rounded-full transition-all duration-500" style={{ width: `${Math.min(((nodeStatus.hardware?.process_ram_mb || 0) / (nodeStatus.hardware?.ram_total_gb * 1024 || 8192)) * 100, 100)}%` }}></div>
              </div>
            </div>
            
          </div>
        )}

        {/* Database Logs (Telemetry) */}
        {isRunning && activePort && dbLogs.length > 0 && (
          <div className="bg-white/70 backdrop-blur-md shadow-lg rounded-2xl p-6 border border-white/50">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Settled Tasks</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm">
              <table className="min-w-full divide-y divide-slate-200/60 text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Task ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Domain</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tx Hash</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Reward</th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-slate-100">
                  {dbLogs.map((log: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">{log.task_id.substring(0, 16)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{log.domain}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-orange-500 truncate max-w-xs">{log.tx_hash}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-600 font-bold">{log.reward}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* The Execution Console */}
        <div className="bg-slate-900 text-emerald-400 font-mono text-sm p-4 rounded-xl h-48 overflow-y-auto mt-6 shadow-inner border border-slate-800">
          <div>
            {logs.length === 0 ? (
              <p className="text-slate-500">System idle. Waiting for node initialization...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1 leading-relaxed whitespace-pre-wrap break-all">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
