import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, Pause, Zap } from "lucide-react";
import { Scan } from "@/types/recon";

interface ScanStatusIndicatorProps {
  scan: Scan;
  compact?: boolean;
}

export const ScanStatusIndicator = ({ scan, compact = false }: ScanStatusIndicatorProps) => {
  const getStatusIcon = () => {
    switch (scan.status) {
      case 'running':
        return <Zap className="h-4 w-4 text-cyber-blue animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-cyber-green" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (scan.status) {
      case 'running':
        return 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30';
      case 'completed':
        return 'bg-cyber-green/20 text-cyber-green border-cyber-green/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'error':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const runningModules = scan.results.filter(r => r.status === 'running').length;
  const errorModules = scan.results.filter(r => r.status === 'error').length;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant="outline" className={getStatusColor()}>
          {scan.status}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {Math.round(scan.progress)}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Badge variant="outline" className={getStatusColor()}>
            {scan.status}
          </Badge>
          {scan.status === 'running' && runningModules > 0 && (
            <span className="text-sm text-cyber-blue">
              {runningModules} module{runningModules > 1 ? 's' : ''} running
            </span>
          )}
          {errorModules > 0 && (
            <span className="text-sm text-destructive">
              {errorModules} error{errorModules > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-sm font-medium">
          {scan.completedModules}/{scan.totalModules} modules
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(scan.progress)}%</span>
        </div>
        <Progress value={scan.progress} className="w-full" />
      </div>

      {scan.status === 'running' && (
        <div className="text-xs text-muted-foreground">
          Estimated completion:{' '}
          {new Date(Date.now() + (100 - scan.progress) * 2000).toLocaleTimeString()}
        </div>
      )}

      {scan.status === 'completed' && scan.completedAt && (
        <div className="text-xs text-muted-foreground">
          Completed at {scan.completedAt.toLocaleString()}
        </div>
      )}
    </div>
  );
};