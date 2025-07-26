import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Globe, 
  Shield, 
  Search, 
  Server, 
  FileText, 
  Lock, 
  Activity,
  Target,
  Terminal,
  Download,
  Play,
  Pause,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ReconResult {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  status: 'running' | 'completed' | 'error';
}

interface ReconModule {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  enabled: boolean;
}

export const ReconDashboard = () => {
  const { toast } = useToast();
  const [target, setTarget] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [results, setResults] = useState<ReconResult[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const modules: ReconModule[] = [
    {
      id: "subdomain",
      name: "Subdomain Enumeration",
      description: "Discover subdomains using multiple techniques",
      icon: Globe,
      category: "discovery",
      enabled: true
    },
    {
      id: "portscan",
      name: "Port Scanner",
      description: "Scan for open ports and services",
      icon: Server,
      category: "network",
      enabled: true
    },
    {
      id: "directory",
      name: "Directory Fuzzing",
      description: "Discover hidden directories and files",
      icon: FileText,
      category: "discovery",
      enabled: true
    },
    {
      id: "tech",
      name: "Technology Detection",
      description: "Identify web technologies and frameworks",
      icon: Activity,
      category: "analysis",
      enabled: true
    },
    {
      id: "ssl",
      name: "SSL/TLS Analysis",
      description: "Analyze SSL certificates and configuration",
      icon: Lock,
      category: "security",
      enabled: true
    },
    {
      id: "vuln",
      name: "Vulnerability Scanner",
      description: "Basic vulnerability assessment",
      icon: Shield,
      category: "security",
      enabled: false
    }
  ];

  const simulateRecon = async () => {
    if (!target) {
      toast({
        title: "Error",
        description: "Please enter a target URL",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setResults([]);

    const enabledModules = modules.filter(m => m.enabled);
    
    for (let i = 0; i < enabledModules.length; i++) {
      const module = enabledModules[i];
      
      // Add running result
      const runningResult: ReconResult = {
        id: `${module.id}-${Date.now()}`,
        type: module.name,
        data: { status: "Initializing..." },
        timestamp: new Date(),
        status: 'running'
      };
      
      setResults(prev => [...prev, runningResult]);
      
      // Simulate scan time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Generate mock results
      const mockData = generateMockResults(module.id, target);
      
      // Update result
      setResults(prev => prev.map(r => 
        r.id === runningResult.id 
          ? { ...r, data: mockData, status: 'completed' as const }
          : r
      ));
      
      setScanProgress(((i + 1) / enabledModules.length) * 100);
    }

    setIsScanning(false);
    toast({
      title: "Scan Complete",
      description: `Reconnaissance completed for ${target}`,
    });
  };

  const generateMockResults = (moduleId: string, target: string) => {
    switch (moduleId) {
      case "subdomain":
        return {
          subdomains: [
            `www.${target}`,
            `api.${target}`,
            `admin.${target}`,
            `mail.${target}`,
            `cdn.${target}`
          ],
          count: 5
        };
      case "portscan":
        return {
          openPorts: [
            { port: 80, service: "HTTP", state: "open" },
            { port: 443, service: "HTTPS", state: "open" },
            { port: 22, service: "SSH", state: "filtered" },
            { port: 3306, service: "MySQL", state: "closed" }
          ]
        };
      case "directory":
        return {
          directories: ["/admin", "/api", "/login", "/dashboard", "/uploads"],
          files: ["robots.txt", "sitemap.xml", ".htaccess"]
        };
      case "tech":
        return {
          technologies: [
            { name: "Nginx", version: "1.18.0", category: "Web Server" },
            { name: "React", version: "18.2.0", category: "JavaScript Framework" },
            { name: "CloudFlare", version: null, category: "CDN" }
          ]
        };
      case "ssl":
        return {
          certificate: {
            issuer: "Let's Encrypt",
            validFrom: "2024-01-01",
            validTo: "2024-12-31",
            algorithm: "RSA 2048",
            grade: "A+"
          }
        };
      default:
        return { message: "Scan completed successfully" };
    }
  };

  const exportResults = () => {
    const exportData = {
      target,
      timestamp: new Date().toISOString(),
      results: results.filter(r => r.status === 'completed')
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recon-${target}-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Results exported successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Target className="h-8 w-8 text-cyber-green animate-pulse-glow" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyber-green to-cyber-blue bg-clip-text text-transparent">
              Cyber Scout
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Advanced Web Reconnaissance Platform
          </p>
        </div>

        {/* Target Input */}
        <Card className="border-cyber-green/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-cyber-green" />
              Target Configuration
            </CardTitle>
            <CardDescription>
              Enter the target domain or IP address for reconnaissance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="example.com"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="flex-1 bg-secondary/50 border-cyber-green/30 focus:border-cyber-green"
                disabled={isScanning}
              />
              <Button 
                onClick={simulateRecon}
                disabled={isScanning}
                variant="cyber"
                className="min-w-32"
              >
                {isScanning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Recon
                  </>
                )}
              </Button>
            </div>
            
            {isScanning && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Scan Progress</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <Progress value={scanProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => {
                const Icon = module.icon;
                const moduleResult = results.find(r => r.type === module.name);
                
                return (
                  <Card key={module.id} className="border-cyber-green/20 hover:border-cyber-green/40 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-cyber-green" />
                          <div>
                            <CardTitle className="text-lg">{module.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {module.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          variant={module.enabled ? "default" : "secondary"}
                          className={module.enabled ? "bg-cyber-green/20 text-cyber-green border-cyber-green/30" : ""}
                        >
                          {module.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {moduleResult && (
                        <div className="space-y-2">
                          {moduleResult.status === 'running' && (
                            <div className="flex items-center gap-2 text-cyber-blue">
                              <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse" />
                              <span className="text-sm">Running...</span>
                            </div>
                          )}
                          {moduleResult.status === 'completed' && (
                            <div className="flex items-center gap-2 text-cyber-green">
                              <div className="w-2 h-2 bg-cyber-green rounded-full" />
                              <span className="text-sm">Complete</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <Card className="border-cyber-green/20">
              <CardHeader>
                <CardTitle>Module Configuration</CardTitle>
                <CardDescription>
                  Enable or disable reconnaissance modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <div key={module.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-cyber-green" />
                          <div>
                            <div className="font-medium">{module.name}</div>
                            <div className="text-sm text-muted-foreground">{module.description}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-cyber-green/30 text-cyber-green">
                          {module.category}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.id} className="border-cyber-green/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{result.type}</CardTitle>
                        <Badge 
                          variant={result.status === 'completed' ? "default" : "secondary"}
                          className={result.status === 'completed' ? "bg-cyber-green/20 text-cyber-green border-cyber-green/30" : ""}
                        >
                          {result.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-secondary/50 p-4 rounded-lg text-sm font-mono overflow-auto max-h-64 border border-cyber-green/20">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-cyber-green/20">
                <CardContent className="text-center py-12">
                  <Terminal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No scan results yet. Start a reconnaissance scan to see results here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card className="border-cyber-green/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-cyber-green" />
                  Export Results
                </CardTitle>
                <CardDescription>
                  Download your reconnaissance results in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {results.filter(r => r.status === 'completed').length} completed scans available for export
                </div>
                <Button 
                  onClick={exportResults}
                  disabled={results.filter(r => r.status === 'completed').length === 0}
                  variant="cyber"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as JSON
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};