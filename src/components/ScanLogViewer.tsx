import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, CheckCircle, AlertTriangle, Clock, Zap } from "lucide-react";
import { Scan, ScanResult } from "@/types/recon";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  module: string;
  message: string;
  details?: any;
}

interface ScanLogViewerProps {
  scan: Scan;
}

export const ScanLogViewer = ({ scan }: ScanLogViewerProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate logs based on scan results
    const newLogs: LogEntry[] = [];
    
    scan.results.forEach((result: ScanResult) => {
      if (result.startTime) {
        newLogs.push({
          id: `${result.id}-start`,
          timestamp: result.startTime,
          level: 'info',
          module: result.moduleName,
          message: `Starting ${result.moduleName}...`,
          details: { moduleId: result.moduleId }
        });
      }

      if (result.status === 'running') {
        newLogs.push({
          id: `${result.id}-running`,
          timestamp: new Date(),
          level: 'info',
          module: result.moduleName,
          message: `Executing reconnaissance tasks...`,
          details: { moduleId: result.moduleId }
        });
      }

      if (result.status === 'completed' && result.endTime) {
        const duration = result.startTime 
          ? Math.round((result.endTime.getTime() - result.startTime.getTime()) / 1000)
          : 0;
        
        newLogs.push({
          id: `${result.id}-complete`,
          timestamp: result.endTime,
          level: 'success',
          module: result.moduleName,
          message: `Completed successfully in ${duration}s`,
          details: { 
            moduleId: result.moduleId,
            duration,
            dataKeys: result.data ? Object.keys(result.data) : []
          }
        });
      }

      if (result.status === 'error' && result.error) {
        newLogs.push({
          id: `${result.id}-error`,
          timestamp: result.endTime || new Date(),
          level: 'error',
          module: result.moduleName,
          message: result.error,
          details: { moduleId: result.moduleId }
        });
      }
    });

    // Sort by timestamp
    newLogs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    setLogs(newLogs);
  }, [scan.results]);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-3 w-3 text-cyber-green" />;
      case 'error':
        return <AlertTriangle className="h-3 w-3 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-cyber-blue" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-cyber-green';
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="border-cyber-green/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Terminal className="h-4 w-4 text-cyber-green" />
          Scan Activity Log
          {scan.status === 'running' && (
            <Badge variant="outline" className="bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea ref={scrollRef} className="h-64 w-full">
          <div className="space-y-2 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-muted-foreground p-4 text-center">
                No activity yet...
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 p-2 rounded border border-border/50"
                >
                  {getLogIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {log.module}
                      </Badge>
                    </div>
                    <div className={`text-xs ${getLogColor(log.level)}`}>
                      {log.message}
                    </div>
                    {log.details && log.level === 'success' && log.details.dataKeys && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Generated: {log.details.dataKeys.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};