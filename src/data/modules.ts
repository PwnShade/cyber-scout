import { ReconModule } from "@/types/recon";
import {
  Globe,
  Server,
  Search,
  FileText,
  Code,
  Shield,
  Lock,
  Camera,
  Activity,
  Database,
  Network,
  AlertTriangle,
  Eye,
  Layers,
  MapPin,
  Zap,
  Bug,
  Key,
  Settings,
  Monitor,
  Link,
  Fingerprint,
  Wifi,
  Cookie
} from "lucide-react";

export const reconModules: ReconModule[] = [
  // Subdomain Enumeration
  {
    id: "subfinder",
    name: "Subfinder",
    description: "Fast subdomain discovery using passive sources",
    icon: Globe,
    category: "Discovery",
    requires: ["domain"],
    produces: ["subdomains"],
    enabled: true,
    executionTime: 30,
    options: [
      {
        id: "silent",
        name: "Silent Mode",
        type: "boolean",
        required: false,
        defaultValue: false,
        description: "Run in silent mode"
      }
    ]
  },
  {
    id: "amass",
    name: "Amass",
    description: "Comprehensive subdomain enumeration and network mapping",
    icon: Network,
    category: "Discovery", 
    requires: ["domain"],
    produces: ["subdomains"],
    enabled: true,
    executionTime: 120,
    options: [
      {
        id: "passive",
        name: "Passive Mode",
        type: "boolean",
        required: false,
        defaultValue: true,
        description: "Use only passive techniques"
      }
    ]
  },

  // DNS & Probing
  {
    id: "dnsx",
    name: "DNSx",
    description: "Fast DNS toolkit for subdomain resolution",
    icon: Database,
    category: "Network",
    requires: ["subdomains"],
    produces: ["resolved-ips"],
    enabled: true,
    executionTime: 15
  },
  {
    id: "httpx",
    name: "HTTPx",
    description: "HTTP toolkit for probing alive hosts",
    icon: Activity,
    category: "Network",
    requires: ["subdomains"],
    produces: ["alive-urls"],
    enabled: true,
    executionTime: 45
  },

  // Content Discovery
  {
    id: "robots-sitemap",
    name: "Robots & Sitemap",
    description: "Parse robots.txt and sitemap.xml files",
    icon: FileText,
    category: "Discovery",
    requires: ["alive-urls"],
    produces: ["discovered-paths"],
    enabled: true,
    executionTime: 10
  },
  {
    id: "ffuf",
    name: "FFuF",
    description: "Fast web fuzzer for directory and file discovery",
    icon: Search,
    category: "Discovery",
    requires: ["alive-urls"],
    produces: ["discovered-paths"],
    enabled: true,
    executionTime: 180,
    options: [
      {
        id: "wordlist",
        name: "Wordlist",
        type: "select",
        required: true,
        defaultValue: "common.txt",
        options: ["common.txt", "medium.txt", "big.txt", "raft-large.txt"],
        description: "Choose wordlist for fuzzing"
      },
      {
        id: "extensions",
        name: "Extensions",
        type: "text",
        required: false,
        defaultValue: "php,html,js,txt,xml",
        description: "File extensions to fuzz (comma-separated)"
      }
    ]
  },
  {
    id: "dirsearch",
    name: "Dirsearch",
    description: "Web path scanner with advanced features",
    icon: Layers,
    category: "Discovery",
    requires: ["alive-urls"],
    produces: ["discovered-paths"],
    enabled: false,
    executionTime: 120
  },

  // URL Collection
  {
    id: "gau",
    name: "GetAllUrls (GAU)",
    description: "Fetch known URLs from web archives",
    icon: Link,
    category: "Discovery",
    requires: ["domain"],
    produces: ["historical-urls"],
    enabled: true,
    executionTime: 60
  },
  {
    id: "waybackurls",
    name: "Wayback URLs",
    description: "Extract URLs from Wayback Machine",
    icon: Eye,
    category: "Discovery",
    requires: ["domain"],
    produces: ["historical-urls"],
    enabled: true,
    executionTime: 45
  },

  // Parameter & JS Analysis
  {
    id: "arjun",
    name: "Arjun",
    description: "HTTP parameter discovery suite",
    icon: Key,
    category: "Analysis",
    requires: ["alive-urls"],
    produces: ["parameters"],
    enabled: true,
    executionTime: 90
  },
  {
    id: "linkfinder",
    name: "LinkFinder",
    description: "Discover endpoints in JavaScript files",
    icon: Code,
    category: "Analysis",
    requires: ["js-urls"],
    produces: ["endpoints"],
    enabled: true,
    executionTime: 30
  },
  {
    id: "secretfinder",
    name: "SecretFinder",
    description: "Find secrets in JavaScript files",
    icon: AlertTriangle,
    category: "Analysis",
    requires: ["js-urls"],
    produces: ["secrets"],
    enabled: true,
    executionTime: 25
  },

  // Virtual Host & Tech
  {
    id: "gobuster-vhost",
    name: "Gobuster VHost",
    description: "Virtual host enumeration",
    icon: Server,
    category: "Discovery",
    requires: ["domain"],
    produces: ["virtual-hosts"],
    enabled: true,
    executionTime: 60
  },
  {
    id: "wappalyzer",
    name: "Wappalyzer",
    description: "Technology stack identification",
    icon: Fingerprint,
    category: "Analysis",
    requires: ["alive-urls"],
    produces: ["technologies"],
    enabled: true,
    executionTime: 20
  },
  {
    id: "builtwith",
    name: "BuiltWith",
    description: "Comprehensive technology profiling",
    icon: Settings,
    category: "Analysis",
    requires: ["alive-urls"],
    produces: ["technologies"],
    enabled: false,
    executionTime: 15
  },

  // Security Analysis
  {
    id: "security-headers",
    name: "Security Headers",
    description: "Analyze HTTP security headers and CSP",
    icon: Shield,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["headers", "csp-details"],
    enabled: true,
    executionTime: 20
  },
  {
    id: "cookie-flags",
    name: "Cookie Analysis",
    description: "Analyze cookie security flags",
    icon: Cookie,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["headers"],
    enabled: true,
    executionTime: 15
  },
  {
    id: "sslyze",
    name: "SSLyze",
    description: "Fast SSL/TLS configuration analyzer",
    icon: Lock,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["ssl-details"],
    enabled: true,
    executionTime: 40
  },
  {
    id: "testssl",
    name: "testssl.sh",
    description: "Comprehensive SSL/TLS testing",
    icon: Lock,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["ssl-details"],
    enabled: false,
    executionTime: 90
  },

  // Vulnerability Scanning
  {
    id: "corsy",
    name: "Corsy",
    description: "CORS misconfiguration scanner",
    icon: Wifi,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["cors-findings"],
    enabled: true,
    executionTime: 30
  },
  {
    id: "nuclei-cors",
    name: "Nuclei CORS",
    description: "CORS vulnerability detection with Nuclei",
    icon: Zap,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["vulnerabilities"],
    enabled: false,
    executionTime: 45
  },
  {
    id: "nuclei-redirect",
    name: "Nuclei Open Redirect",
    description: "Open redirect vulnerability scanner",
    icon: Zap,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["vulnerabilities"],
    enabled: true,
    executionTime: 35
  },
  {
    id: "nuclei-host-header",
    name: "Nuclei Host Header",
    description: "Host header injection detection",
    icon: Zap,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["vulnerabilities"],
    enabled: true,
    executionTime: 25
  },
  {
    id: "retire-js",
    name: "Retire.js",
    description: "Detect vulnerable JavaScript libraries",
    icon: Bug,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["js-vulnerabilities"],
    enabled: true,
    executionTime: 20
  },
  {
    id: "nuclei-js-vuln",
    name: "Nuclei JS Vulnerabilities",
    description: "JavaScript vulnerability scanner",
    icon: Bug,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["js-vulnerabilities"],
    enabled: false,
    executionTime: 40
  },
  {
    id: "favicon-hash",
    name: "Favicon Hash",
    description: "Generate favicon hashes for fingerprinting",
    icon: Fingerprint,
    category: "Analysis",
    requires: ["alive-urls"],
    produces: ["technologies"],
    enabled: true,
    executionTime: 10
  },
  {
    id: "nuclei-general",
    name: "Nuclei Scanner",
    description: "Comprehensive vulnerability scanner",
    icon: Zap,
    category: "Security",
    requires: ["alive-urls"],
    produces: ["vulnerabilities"],
    enabled: true,
    executionTime: 300
  },

  // Screenshots
  {
    id: "gowitness",
    name: "GoWitness",
    description: "Web screenshot utility using Chrome",
    icon: Camera,
    category: "Visual",
    requires: ["alive-urls"],
    produces: ["screenshots"],
    enabled: true,
    executionTime: 120
  },
  {
    id: "aquatone",
    name: "Aquatone",
    description: "Visual domain inspection tool",
    icon: Monitor,
    category: "Visual",
    requires: ["alive-urls"],
    produces: ["screenshots"],
    enabled: false,
    executionTime: 150
  }
];

export const moduleCategories = [
  "Discovery",
  "Network", 
  "Analysis",
  "Security",
  "Visual"
] as const;

export const dataTypes = [
  "domain",
  "subdomains",
  "urls", 
  "alive-urls",
  "resolved-ips",
  "discovered-paths",
  "historical-urls",
  "parameters",
  "js-urls",
  "endpoints",
  "secrets",
  "virtual-hosts",
  "technologies",
  "headers",
  "ssl-details",
  "cors-findings",
  "vulnerabilities",
  "js-vulnerabilities",
  "screenshots",
  "csp-details"
] as const;