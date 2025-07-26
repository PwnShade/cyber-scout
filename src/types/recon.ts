import { LucideIcon } from "lucide-react";

export interface ReconModule {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: string;
  requires: string[];
  produces: string[];
  enabled: boolean;
  options?: ModuleOption[];
  executionTime?: number; // seconds
}

export interface ModuleOption {
  id: string;
  name: string;
  type: 'text' | 'select' | 'number' | 'boolean' | 'file';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // for select type
  description?: string;
}

export interface ScanResult {
  id: string;
  moduleId: string;
  moduleName: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  data: any;
  error?: string;
  dependsOn: string[];
}

export interface Scan {
  id: string;
  target: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'paused';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  selectedModules: string[];
  moduleOptions: Record<string, any>;
  results: ScanResult[];
  executionOrder: string[];
  progress: number;
  totalModules: number;
  completedModules: number;
}

export interface DependencyChain {
  moduleId: string;
  dependencies: string[];
  level: number;
}

export type DataType = 
  | 'domain'
  | 'subdomains' 
  | 'urls'
  | 'alive-urls'
  | 'resolved-ips'
  | 'discovered-paths'
  | 'historical-urls'
  | 'parameters'
  | 'js-urls'
  | 'endpoints'
  | 'secrets'
  | 'virtual-hosts'
  | 'technologies'
  | 'headers'
  | 'ssl-details'
  | 'cors-findings'
  | 'vulnerabilities'
  | 'js-vulnerabilities'
  | 'screenshots'
  | 'csp-details';