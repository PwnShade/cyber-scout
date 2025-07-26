import { Scan, ScanResult } from "@/types/recon";

const STORAGE_KEYS = {
  SCANS: 'reconverge_scans',
  CURRENT_SCAN: 'reconverge_current_scan'
};

export class ScanStorage {
  static saveScans(scans: Scan[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SCANS, JSON.stringify(scans, this.dateReplacer));
    } catch (error) {
      console.error('Failed to save scans:', error);
    }
  }

  static loadScans(): Scan[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SCANS);
      if (!stored) return [];
      
      const scans = JSON.parse(stored, this.dateReviver);
      return Array.isArray(scans) ? scans : [];
    } catch (error) {
      console.error('Failed to load scans:', error);
      return [];
    }
  }

  static saveScan(scan: Scan): void {
    const scans = this.loadScans();
    const existingIndex = scans.findIndex(s => s.id === scan.id);
    
    if (existingIndex >= 0) {
      scans[existingIndex] = scan;
    } else {
      scans.push(scan);
    }
    
    this.saveScans(scans);
  }

  static getScan(scanId: string): Scan | undefined {
    const scans = this.loadScans();
    return scans.find(s => s.id === scanId);
  }

  static deleteScan(scanId: string): void {
    const scans = this.loadScans();
    const filtered = scans.filter(s => s.id !== scanId);
    this.saveScans(filtered);
  }

  static setCurrentScan(scanId: string | null): void {
    if (scanId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SCAN, scanId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SCAN);
    }
  }

  static getCurrentScanId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SCAN);
  }

  static exportScan(scanId: string): void {
    const scan = this.getScan(scanId);
    if (!scan) return;

    const exportData = {
      scan,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconverge-scan-${scan.target}-${scan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static exportScanAsHtml(scanId: string): void {
    const scan = this.getScan(scanId);
    if (!scan) return;

    const completedResults = scan.results.filter(r => r.status === 'completed');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reconverge Scan Report - ${scan.target}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .header { 
            background: linear-gradient(135deg, #1a1a1a, #2d2d2d); 
            color: white; 
            padding: 2rem; 
            border-radius: 8px; 
            margin-bottom: 2rem;
        }
        .header h1 { margin: 0; font-size: 2.5rem; }
        .header p { margin: 0.5rem 0 0; opacity: 0.8; }
        .section { 
            background: white; 
            margin: 1rem 0; 
            padding: 1.5rem; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 { 
            color: #1a1a1a; 
            border-bottom: 2px solid #00ff00; 
            padding-bottom: 0.5rem; 
            margin-top: 0;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 1rem; 
        }
        pre { 
            background: #1a1a1a; 
            color: #00ff00; 
            padding: 1rem; 
            border-radius: 4px; 
            overflow-x: auto; 
            font-size: 0.9rem;
        }
        .status { 
            display: inline-block; 
            padding: 0.25rem 0.5rem; 
            border-radius: 4px; 
            font-size: 0.8rem; 
            font-weight: bold;
        }
        .status.completed { background: #dcfce7; color: #166534; }
        .status.error { background: #fef2f2; color: #dc2626; }
        .meta { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 1rem; 
            margin-bottom: 2rem;
        }
        .meta-item { 
            background: white; 
            padding: 1rem; 
            border-radius: 8px; 
            text-align: center;
        }
        .meta-value { 
            font-size: 1.5rem; 
            font-weight: bold; 
            color: #00ff00; 
        }
        .meta-label { 
            color: #666; 
            font-size: 0.9rem; 
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reconverge Scan Report</h1>
        <p>Target: ${scan.target} | Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="meta">
        <div class="meta-item">
            <div class="meta-value">${scan.completedModules}</div>
            <div class="meta-label">Modules Completed</div>
        </div>
        <div class="meta-item">
            <div class="meta-value">${Math.round(scan.progress)}%</div>
            <div class="meta-label">Progress</div>
        </div>
        <div class="meta-item">
            <div class="meta-value">${scan.status}</div>
            <div class="meta-label">Status</div>
        </div>
        <div class="meta-item">
            <div class="meta-value">${scan.createdAt ? new Date(scan.createdAt).toLocaleDateString() : 'N/A'}</div>
            <div class="meta-label">Created</div>
        </div>
    </div>

    ${completedResults.map(result => `
        <div class="section">
            <h2>
                ${result.moduleName} 
                <span class="status ${result.status}">${result.status}</span>
            </h2>
            <pre>${JSON.stringify(result.data, null, 2)}</pre>
        </div>
    `).join('')}

    <div class="section">
        <h2>Scan Configuration</h2>
        <pre>${JSON.stringify({
          selectedModules: scan.selectedModules,
          moduleOptions: scan.moduleOptions,
          executionOrder: scan.executionOrder
        }, null, 2)}</pre>
    </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconverge-report-${scan.target}-${scan.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private static dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', __value: value.toISOString() };
    }
    return value;
  }

  private static dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.__value);
    }
    return value;
  }

  static clearAllScans(): void {
    localStorage.removeItem(STORAGE_KEYS.SCANS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SCAN);
  }

  static getStorageSize(): string {
    try {
      const scans = localStorage.getItem(STORAGE_KEYS.SCANS) || '';
      const currentScan = localStorage.getItem(STORAGE_KEYS.CURRENT_SCAN) || '';
      const totalSize = new Blob([scans + currentScan]).size;
      
      if (totalSize < 1024) return `${totalSize} B`;
      if (totalSize < 1048576) return `${(totalSize / 1024).toFixed(1)} KB`;
      return `${(totalSize / 1048576).toFixed(1)} MB`;
    } catch {
      return 'Unknown';
    }
  }
}