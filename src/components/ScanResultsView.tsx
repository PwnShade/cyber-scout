import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { Scan } from "@/types/recon";
import { ScanStorage } from "@/utils/scanStorage";

interface ScanResultsViewProps {
  scan: Scan;
  onBack: () => void;
}

export const ScanResultsView = ({ scan, onBack }: ScanResultsViewProps) => {
  const completedResults = scan.results.filter(r => r.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="border-cyber-green/30">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-cyber-green">{scan.name}</h1>
            <p className="text-muted-foreground">Target: {scan.target}</p>
          </div>
          <Button 
            variant="cyber" 
            onClick={() => ScanStorage.exportScanAsHtml(scan.id)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export HTML
          </Button>
        </div>

        {completedResults.map(result => (
          <Card key={result.id} className="border-cyber-green/20">
            <CardHeader>
              <CardTitle>{result.moduleName}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-secondary/50 p-4 rounded-lg text-sm font-mono overflow-auto max-h-64 border border-cyber-green/20">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};