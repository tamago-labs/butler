import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Trash2, Download } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'app' | 'mcp' | 'claude' | 'tauri';
  message: string;
  data?: any;
}

interface LogsPanelProps {
  className?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private maxLogs = 1000;

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  addListener(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    listener(this.logs); // Send current logs immediately
  }

  removeListener(listener: (logs: LogEntry[]) => void) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  log(level: LogEntry['level'], source: LogEntry['source'], message: string, data?: any) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      source,
      message,
      data
    };

    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener([...this.logs]));

    // Also log to browser console with prefix
    const prefix = `[${source.toUpperCase()}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'debug':
        console.debug(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }

  info(source: LogEntry['source'], message: string, data?: any) {
    this.log('info', source, message, data);
  }

  warn(source: LogEntry['source'], message: string, data?: any) {
    this.log('warn', source, message, data);
  }

  error(source: LogEntry['source'], message: string, data?: any) {
    this.log('error', source, message, data);
  }

  debug(source: LogEntry['source'], message: string, data?: any) {
    this.log('debug', source, message, data);
  }

  clear() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  exportLogs(): string {
    return this.logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source.toUpperCase()}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n');
  }
}

const LogsPanel: React.FC<LogsPanelProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logger = Logger.getInstance();

  useEffect(() => {
    const handleLogsUpdate = (newLogs: LogEntry[]) => {
      setLogs(newLogs);
    };

    logger.addListener(handleLogsUpdate);
    return () => logger.removeListener(handleLogsUpdate);
  }, [logger]);

  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'errors') return log.level === 'error';
    if (filter === 'mcp') return log.source === 'mcp';
    if (filter === 'claude') return log.source === 'claude';
    if (filter === 'app') return log.source === 'app';
    return true;
  });

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'debug': return 'text-gray-400';
      default: return 'text-text-primary';
    }
  };

  const getSourceColor = (source: LogEntry['source']) => {
    switch (source) {
      case 'mcp': return 'text-blue-400';
      case 'claude': return 'text-green-400';
      case 'tauri': return 'text-purple-400';
      default: return 'text-accent';
    }
  };

  const copyLog = (log: LogEntry) => {
    const logText = `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source.toUpperCase()}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`;
    navigator.clipboard.writeText(logText);
  };

  const copyAllLogs = () => {
    navigator.clipboard.writeText(logger.exportLogs());
  };

  const downloadLogs = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `butler-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`h-full flex flex-col bg-sidebar-bg ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            <h3 className="font-medium text-text-primary text-sm">System Logs</h3>
            <span className="text-xs text-text-muted">({filteredLogs.length})</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={copyAllLogs}
              className="p-1 hover:bg-gray-700 rounded text-text-muted hover:text-text-primary"
              title="Copy all logs"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={downloadLogs}
              className="p-1 hover:bg-gray-700 rounded text-text-muted hover:text-text-primary"
              title="Download logs"
            >
              <Download className="w-3 h-3" />
            </button>
            <button
              onClick={() => logger.clear()}
              className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300"
              title="Clear logs"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 text-xs">
          {[
            { key: 'all', label: 'All' },
            { key: 'errors', label: 'Errors' },
            { key: 'mcp', label: 'MCP' },
            { key: 'claude', label: 'Claude' },
            { key: 'app', label: 'App' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-2 py-1 rounded ${
                filter === key
                  ? 'bg-accent text-white'
                  : 'bg-gray-700 text-text-muted hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Auto-scroll toggle */}
        <div className="mt-2">
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            Auto-scroll to bottom
          </label>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No logs to display</p>
            <p className="text-xs mt-1">Logs will appear here as the application runs</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="group hover:bg-gray-800/50 rounded p-1 cursor-pointer"
                onClick={() => copyLog(log)}
                title="Click to copy"
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 shrink-0">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={`shrink-0 ${getLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className={`shrink-0 ${getSourceColor(log.source)}`}>
                    [{log.source.toUpperCase()}]
                  </span>
                  <span className="flex-1 text-text-primary break-all">
                    {log.message}
                  </span>
                  <Copy className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 shrink-0" />
                </div>
                {log.data && (
                  <div className="mt-1 ml-20 p-2 bg-gray-900 rounded text-gray-300 text-xs overflow-x-auto">
                    <pre>{JSON.stringify(log.data, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

// Export both the component and the logger instance
export default LogsPanel;
export { Logger };
export type { LogEntry };
