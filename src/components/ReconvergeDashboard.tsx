import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Target,
  Play,
  Pause,
  Download,
  History,
  Settings,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  FileText,
  Globe2,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reconModules, moduleCategories } from "@/data/modules";
import { ReconModule, Scan, ScanResult } from "@/types/recon";
import { DependencyResolver } from "@/utils/dependencyChain";
import { MockDataGenerator } from "@/utils/mockDataGenerator";
import { ScanStorage } from "@/utils/scanStorage";
import { ModuleConfigDialog } from "./ModuleConfigDialog";
import { ScanResultsView } from "./ScanResultsView";
import { DependencyVisualization } from "./DependencyVisualization";

export const ReconvergeDashboard = () => {
  const { toast } = useToast();
  const [target, setTarget] = useState("");
  const [scanName, setScanName] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(
    reconModules.filter(m => m.enabled).map(m => m.id)
  );
  const [moduleOptions, setModuleOptions] = useState<Record<string, any>>({});
  const [currentScan, setCurrentScan] = useState<Scan | null>(null);
  const [scanHistory, setScanHistory] = useState<Scan[]>([]);
  const [activeTab, setActiveTab] = useState("create");
  const [configModule, setConfigModule] = useState<ReconModule | null>(null);
  const [viewingScan, setViewingScan] = useState<string | null>(null);

  // Load scan history on mount
  useEffect(() => {
    const history = ScanStorage.loadScans();
    setScanHistory(history);
    
    const currentScanId = ScanStorage.getCurrentScanId();
    if (currentScanId) {
      const scan = ScanStorage.getScan(currentScanId);
      if (scan && scan.status === 'running') {
        setCurrentScan(scan);
        setActiveTab("monitor");
      }
    }
  }, []);

  const getSelectedModuleObjects = (): ReconModule[] => {
    return reconModules.filter(m => selectedModules.includes(m.id));
  };

  const validateAndStartScan = () => {
    if (!target.trim()) {
      toast({
        title: "Error",
        description: "Please enter a target domain",
        variant: "destructive",
      });
      return;
    }

    if (selectedModules.length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one module",
        variant: "destructive",
      });
      return;
    }

    const modules = getSelectedModuleObjects();
    const validation = DependencyResolver.validateModuleSelection(modules);

    if (!validation.valid) {
      toast({
        title: "Dependency Error",
        description: validation.errors[0],
        variant: "destructive",
      });
      return;
    }

    if (validation.warnings.length > 0) {
      toast({
        title: "Warning",
        description: validation.warnings[0],
      });
    }

    startScan();
  };

  const startScan = () => {
    const modules = getSelectedModuleObjects();
    const executionOrder = DependencyResolver.getExecutionOrder(modules);
    const totalTime = DependencyResolver.estimateTotalTime(modules);

    const scan: Scan = {
      id: `scan_${Date.now()}`,
      target: target.trim(),
      name: scanName.trim() || `Scan of ${target.trim()}`,
      status: 'running',
      createdAt: new Date(),
      startedAt: new Date(),
      selectedModules,
      moduleOptions,
      results: [],
      executionOrder,
      progress: 0,
      totalModules: modules.length,
      completedModules: 0
    };

    // Initialize results
    scan.results = modules.map(module => ({
      id: `${scan.id}_${module.id}`,
      moduleId: module.id,
      moduleName: module.name,
      status: 'pending',
      data: {},
      dependsOn: []
    }));

    setCurrentScan(scan);
    ScanStorage.saveScan(scan);
    ScanStorage.setCurrentScan(scan.id);
    setActiveTab("monitor");

    toast({
      title: "Scan Started",
      description: `Starting reconnaissance of ${target}`,
    });

    // Simulate scan execution
    simulateScanExecution(scan, totalTime);
  };

  const simulateScanExecution = async (scan: Scan, totalTime: number) => {
    const modules = getSelectedModuleObjects();
    const executionOrder = DependencyResolver.getExecutionOrder(modules);
    let completedCount = 0;

    // Execute modules in dependency order
    for (const moduleId of executionOrder) {
      const module = modules.find(m => m.id === moduleId);
      if (!module) continue;

      // Update module status to running
      const updatedScan = { ...scan };
      const resultIndex = updatedScan.results.findIndex(r => r.moduleId === moduleId);
      
      if (resultIndex >= 0) {
        updatedScan.results[resultIndex] = {
          ...updatedScan.results[resultIndex],
          status: 'running',
          startTime: new Date()
        };
        
        updatedScan.progress = (completedCount / updatedScan.totalModules) * 100;
        setCurrentScan(updatedScan);
        ScanStorage.saveScan(updatedScan);
      }

      // Simulate execution time
      await new Promise(resolve => 
        setTimeout(resolve, (module.executionTime || 30) * 50) // Speed up for demo
      );

      // Generate mock results
      const mockData = generateModuleResults(module, scan.target, updatedScan.results);

      // Update module status to completed
      if (resultIndex >= 0) {
        updatedScan.results[resultIndex] = {
          ...updatedScan.results[resultIndex],
          status: 'completed',
          endTime: new Date(),
          data: mockData
        };
        
        completedCount++;
        updatedScan.completedModules = completedCount;
        updatedScan.progress = (completedCount / updatedScan.totalModules) * 100;
        
        if (completedCount === updatedScan.totalModules) {
          updatedScan.status = 'completed';
          updatedScan.completedAt = new Date();
          ScanStorage.setCurrentScan(null);
        }
        
        setCurrentScan(updatedScan);
        ScanStorage.saveScan(updatedScan);
        setScanHistory(ScanStorage.loadScans());
      }
    }

    toast({
      title: "Scan Complete",
      description: `Reconnaissance of ${scan.target} completed successfully`,
    });
  };

  const generateModuleResults = (module: ReconModule, target: string, existingResults: ScanResult[]) => {
    // Get data from previous modules for chaining
    const getPreviousData = (dataType: string) => {
      const producers = existingResults.filter(r => 
        r.status === 'completed' && 
        reconModules.find(m => m.id === r.moduleId)?.produces.includes(dataType)
      );
      return producers.length > 0 ? producers[0].data : null;
    };

    switch (module.id) {
      case "subfinder":
      case "amass":
        return {
          subdomains: MockDataGenerator.generateSubdomains(target),
          count: MockDataGenerator.generateSubdomains(target).length
        };

      case "httpx":
        const subdomains = getPreviousData('subdomains')?.subdomains || MockDataGenerator.generateSubdomains(target);
        const aliveUrls = MockDataGenerator.generateAliveUrls(subdomains);
        return {
          aliveUrls,
          totalChecked: subdomains.length,
          aliveCount: aliveUrls.length
        };

      case "dnsx":
        return {
          resolvedIPs: MockDataGenerator.generateSubdomains(target).map(sub => ({
            domain: sub,
            ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
          }))
        };

      case "ffuf":
      case "dirsearch":
        return {
          directories: MockDataGenerator.generateDirectories(),
          files: MockDataGenerator.generateFiles(),
          totalRequests: 1250,
          foundItems: MockDataGenerator.generateDirectories().length + MockDataGenerator.generateFiles().length
        };

      case "robots-sitemap":
        return {
          robotsEntries: MockDataGenerator.generateDirectories().slice(0, 5),
          sitemapUrls: MockDataGenerator.generateDirectories().slice(0, 8).map(dir => `https://${target}${dir}`)
        };

      case "gau":
      case "waybackurls":
        return {
          historicalUrls: MockDataGenerator.generateDirectories().map(dir => `https://${target}${dir}`),
          totalFound: 156,
          uniqueUrls: 89
        };

      case "wappalyzer":
      case "builtwith":
        return {
          technologies: MockDataGenerator.generateTechnologies()
        };

      case "nuclei-general":
        return {
          vulnerabilities: MockDataGenerator.generateVulnerabilities(target),
          totalTemplates: 4500,
          executedTemplates: 4500
        };

      case "sslyze":
      case "testssl":
        return MockDataGenerator.generateSSLInfo(target);

      case "security-headers":
        const aliveUrlsForHeaders = getPreviousData('alive-urls')?.aliveUrls || [`https://${target}`];
        return {
          headers: aliveUrlsForHeaders.slice(0, 3).map(url => MockDataGenerator.generateSecurityHeaders(url))
        };

      case "gowitness":
      case "aquatone":
        const urlsForScreenshots = getPreviousData('alive-urls')?.aliveUrls || [`https://${target}`];
        return {
          screenshots: MockDataGenerator.generateScreenshots(urlsForScreenshots)
        };

      default:
        return {
          message: `${module.name} completed successfully`,
          timestamp: new Date().toISOString()
        };
    }
  };

  const pauseScan = () => {
    if (currentScan) {
      const updatedScan = { ...currentScan, status: 'paused' as const };
      setCurrentScan(updatedScan);
      ScanStorage.saveScan(updatedScan);
    }
  };

  const deleteScan = (scanId: string) => {
    ScanStorage.deleteScan(scanId);
    setScanHistory(ScanStorage.loadScans());
    if (currentScan?.id === scanId) {
      setCurrentScan(null);
      ScanStorage.setCurrentScan(null);
    }
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const selectAllInCategory = (category: string) => {
    const categoryModules = reconModules
      .filter(m => m.category === category)
      .map(m => m.id);
    
    setSelectedModules(prev => {
      const newSelection = new Set([...prev, ...categoryModules]);
      return Array.from(newSelection);
    });
  };

  const deselectAllInCategory = (category: string) => {
    const categoryModules = reconModules
      .filter(m => m.category === category)
      .map(m => m.id);
    
    setSelectedModules(prev => 
      prev.filter(id => !categoryModules.includes(id))
    );
  };

  if (viewingScan) {
    const scan = scanHistory.find(s => s.id === viewingScan);
    if (scan) {
      return (
        <ScanResultsView 
          scan={scan} 
          onBack={() => setViewingScan(null)}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Target className="h-8 w-8 text-cyber-green animate-pulse-glow" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyber-green to-cyber-blue bg-clip-text text-transparent">
              Reconverge
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Advanced Web Reconnaissance Toolkit
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe2 className="h-4 w-4 text-cyber-green" />
              {reconModules.length} Modules
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-cyber-blue" />
              Smart Chaining
            </span>
            <span className="flex items-center gap-1">
              <History className="h-4 w-4 text-cyber-purple" />
              {scanHistory.length} Scans
            </span>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Create Scan
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Monitor
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Modules
            </TabsTrigger>
          </TabsList>

          {/* Create Scan Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="border-cyber-green/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyber-green" />
                  Target Configuration
                </CardTitle>
                <CardDescription>
                  Configure your reconnaissance target and scan parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Domain</label>
                    <Input
                      placeholder="example.com"
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="bg-secondary/50 border-cyber-green/30 focus:border-cyber-green"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Scan Name (Optional)</label>
                    <Input
                      placeholder="My reconnaissance scan"
                      value={scanName}
                      onChange={(e) => setScanName(e.target.value)}
                      className="bg-secondary/50 border-cyber-green/30 focus:border-cyber-green"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Selection */}
            <Card className="border-cyber-green/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyber-green" />
                  Module Selection
                </CardTitle>
                <CardDescription>
                  Choose reconnaissance modules and configure options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {moduleCategories.map(category => {
                    const categoryModules = reconModules.filter(m => m.category === category);
                    const selectedInCategory = categoryModules.filter(m => selectedModules.includes(m.id));
                    
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {category}
                            <Badge variant="outline" className="border-cyber-green/30 text-cyber-green">
                              {selectedInCategory.length}/{categoryModules.length}
                            </Badge>
                          </h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectAllInCategory(category)}
                              className="text-xs border-cyber-green/30"
                            >
                              Select All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deselectAllInCategory(category)}
                              className="text-xs border-cyber-green/30"
                            >
                              Deselect All
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {categoryModules.map(module => {
                            const Icon = module.icon;
                            const isSelected = selectedModules.includes(module.id);
                            
                            return (
                              <div
                                key={module.id}
                                className={`p-3 border rounded-lg transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'border-cyber-green/50 bg-cyber-green/5' 
                                    : 'border-border hover:border-cyber-green/30'
                                }`}
                                onClick={() => toggleModule(module.id)}
                              >
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() => toggleModule(module.id)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Icon className="h-4 w-4 text-cyber-green flex-shrink-0" />
                                      <span className="font-medium text-sm truncate">{module.name}</span>
                                      {module.options && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setConfigModule(module);
                                          }}
                                        >
                                          <Settings className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-tight">
                                      {module.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {module.executionTime || 30}s
                                      </Badge>
                                      {module.requires.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                          Requires: {module.requires.join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      Selected: {selectedModules.length} modules
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Est. time: {Math.ceil(DependencyResolver.estimateTotalTime(getSelectedModuleObjects()) / 60)} min
                    </span>
                  </div>
                  <Button 
                    onClick={validateAndStartScan}
                    disabled={!target.trim() || selectedModules.length === 0}
                    variant="cyber"
                    className="min-w-32"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Scan
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dependency Visualization */}
            {selectedModules.length > 0 && (
              <DependencyVisualization modules={getSelectedModuleObjects()} />
            )}
          </TabsContent>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            {currentScan ? (
              <>
                <Card className="border-cyber-green/20 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Play className="h-5 w-5 text-cyber-green" />
                          {currentScan.name}
                        </CardTitle>
                        <CardDescription>
                          Target: {currentScan.target} | Started: {currentScan.startedAt?.toLocaleTimeString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={currentScan.status === 'running' ? 'default' : 'secondary'}
                          className={currentScan.status === 'running' ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' : ''}
                        >
                          {currentScan.status}
                        </Badge>
                        {currentScan.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={pauseScan}
                            className="border-cyber-green/30"
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(currentScan.progress)}% ({currentScan.completedModules}/{currentScan.totalModules})</span>
                      </div>
                      <Progress value={currentScan.progress} className="w-full" />
                    </div>
                  </CardContent>
                </Card>

                {/* Real-time Results */}
                <Card className="border-cyber-green/20 shadow-lg">
                  <CardHeader>
                    <CardTitle>Live Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentScan.results.map(result => {
                        const module = reconModules.find(m => m.id === result.moduleId);
                        const Icon = module?.icon || CheckCircle;
                        
                        return (
                          <div
                            key={result.id}
                            className="flex items-center gap-3 p-3 border border-border rounded-lg"
                          >
                            <Icon className="h-5 w-5 text-cyber-green" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{result.moduleName}</span>
                                <Badge 
                                  variant={result.status === 'completed' ? 'default' : 'secondary'}
                                  className={result.status === 'completed' ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' : ''}
                                >
                                  {result.status}
                                </Badge>
                              </div>
                              {result.status === 'running' && (
                                <div className="text-sm text-muted-foreground">
                                  Executing...
                                </div>
                              )}
                              {result.status === 'completed' && (
                                <div className="text-sm text-muted-foreground">
                                  Completed in {result.endTime && result.startTime ? 
                                    Math.round((result.endTime.getTime() - result.startTime.getTime()) / 1000) : 0}s
                                </div>
                              )}
                            </div>
                            {result.status === 'running' && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-cyber-blue animate-pulse" />
                              </div>
                            )}
                            {result.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-cyber-green" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-cyber-green/20">
                <CardContent className="text-center py-12">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active scan. Start a new scan to monitor progress here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-cyber-green/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5 text-cyber-green" />
                      Scan History
                    </CardTitle>
                    <CardDescription>
                      View and manage previous reconnaissance scans
                    </CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {scanHistory.length} total scans | Storage: {ScanStorage.getStorageSize()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {scanHistory.length > 0 ? (
                  <div className="space-y-3">
                    {scanHistory
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map(scan => (
                        <div
                          key={scan.id}
                          className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-cyber-green/30 transition-all"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{scan.name}</span>
                              <Badge 
                                variant={scan.status === 'completed' ? 'default' : 'secondary'}
                                className={scan.status === 'completed' ? 'bg-cyber-green/20 text-cyber-green border-cyber-green/30' : ''}
                              >
                                {scan.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Target: {scan.target} | Created: {new Date(scan.createdAt).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Modules: {scan.selectedModules.length} | Progress: {Math.round(scan.progress)}%
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingScan(scan.id)}
                              className="border-cyber-green/30"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => ScanStorage.exportScan(scan.id)}
                              className="border-cyber-green/30"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteScan(scan.id)}
                              className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No scans in history. Create your first scan to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <Card className="border-cyber-green/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyber-green" />
                  Module Overview
                </CardTitle>
                <CardDescription>
                  Detailed information about all available reconnaissance modules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {moduleCategories.map(category => {
                    const categoryModules = reconModules.filter(m => m.category === category);
                    
                    return (
                      <div key={category} className="space-y-3">
                        <h3 className="text-lg font-semibold">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryModules.map(module => {
                            const Icon = module.icon;
                            
                            return (
                              <div
                                key={module.id}
                                className="p-4 border border-border rounded-lg hover:border-cyber-green/30 transition-all"
                              >
                                <div className="flex items-start gap-3">
                                  <Icon className="h-5 w-5 text-cyber-green mt-1" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium">{module.name}</span>
                                      <Badge variant="outline" className="border-cyber-green/30 text-cyber-green text-xs">
                                        {module.executionTime || 30}s
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {module.description}
                                    </p>
                                    <div className="space-y-1 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">Requires:</span> {module.requires.join(', ') || 'None'}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Produces:</span> {module.produces.join(', ')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Module Configuration Dialog */}
      {configModule && (
        <ModuleConfigDialog
          module={configModule}
          isOpen={!!configModule}
          onClose={() => setConfigModule(null)}
          onSave={(options) => {
            setModuleOptions(prev => ({
              ...prev,
              [configModule.id]: options
            }));
            setConfigModule(null);
          }}
        />
      )}
    </div>
  );
};