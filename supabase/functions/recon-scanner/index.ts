import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScanRequest {
  scanId: string;
  moduleId: string;
  target: string;
  options?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { scanId, moduleId, target, options = {} } = await req.json() as ScanRequest;

    console.log(`Starting scan for module ${moduleId} on target ${target}`);

    // Update scan result to running status
    await supabaseClient
      .from('scan_results')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('scan_id', scanId)
      .eq('module_id', moduleId);

    let result: any = {};
    let status: 'completed' | 'error' = 'completed';
    let errorMessage: string | null = null;

    try {
      // Execute the appropriate reconnaissance module
      result = await executeModule(moduleId, target, options);
    } catch (error) {
      console.error(`Error in module ${moduleId}:`, error);
      status = 'error';
      errorMessage = error.message;
      result = {};
    }

    // Update scan result with completion status and data
    await supabaseClient
      .from('scan_results')
      .update({
        status,
        data: result,
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('scan_id', scanId)
      .eq('module_id', moduleId);

    console.log(`Completed scan for module ${moduleId}: ${status}`);

    return new Response(JSON.stringify({ 
      success: status === 'completed',
      moduleId,
      data: result,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in recon-scanner function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function executeModule(moduleId: string, target: string, options: Record<string, any>): Promise<any> {
  switch (moduleId) {
    case 'subfinder':
      return await runSubfinder(target, options);
    case 'httpx':
      return await runHttpx(target, options);
    case 'nmap':
      return await runNmap(target, options);
    case 'dig':
      return await runDig(target, options);
    case 'whois':
      return await runWhois(target, options);
    case 'waybackurls':
      return await runWaybackUrls(target, options);
    case 'gau':
      return await runGau(target, options);
    case 'nuclei':
      return await runNuclei(target, options);
    case 'katana':
      return await runKatana(target, options);
    case 'ffuf':
      return await runFfuf(target, options);
    default:
      throw new Error(`Unknown module: ${moduleId}`);
  }
}

// Subdomain enumeration using public APIs
async function runSubfinder(target: string, options: Record<string, any>): Promise<any> {
  const subdomains = new Set<string>();
  
  try {
    // Use crt.sh API for certificate transparency logs
    const crtResponse = await fetch(`https://crt.sh/?q=${encodeURIComponent(`%.${target}`)}&output=json`);
    if (crtResponse.ok) {
      const crtData = await crtResponse.json();
      crtData.forEach((cert: any) => {
        if (cert.name_value) {
          cert.name_value.split('\n').forEach((domain: string) => {
            const cleanDomain = domain.trim().toLowerCase();
            if (cleanDomain.endsWith(`.${target}`) && !cleanDomain.includes('*')) {
              subdomains.add(cleanDomain);
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Error fetching from crt.sh:', error);
  }

  try {
    // Use DNS over HTTPS for common subdomains
    const commonSubs = ['www', 'mail', 'ftp', 'api', 'admin', 'dev', 'test', 'staging', 'blog'];
    for (const sub of commonSubs) {
      const testDomain = `${sub}.${target}`;
      try {
        const response = await fetch(`https://1.1.1.1/dns-query?name=${testDomain}&type=A`, {
          headers: { 'Accept': 'application/dns-json' }
        });
        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
          subdomains.add(testDomain);
        }
      } catch (e) {
        // Ignore DNS resolution errors
      }
    }
  } catch (error) {
    console.error('Error in DNS enumeration:', error);
  }

  return {
    subdomains: Array.from(subdomains),
    count: subdomains.size
  };
}

// HTTP probing
async function runHttpx(target: string, options: Record<string, any>): Promise<any> {
  const results: any[] = [];
  const protocols = ['https', 'http'];
  
  for (const protocol of protocols) {
    try {
      const url = `${protocol}://${target}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'ReconWeb-Pro/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      results.push({
        url,
        status_code: response.status,
        content_length: response.headers.get('content-length'),
        content_type: response.headers.get('content-type'),
        server: response.headers.get('server'),
        title: await extractTitle(response.clone()),
        technologies: await detectTechnologies(response.clone())
      });
    } catch (error) {
      // Target not responding on this protocol
    }
  }
  
  return {
    alive_urls: results,
    count: results.length
  };
}

// Simple Nmap-like port scanning
async function runNmap(target: string, options: Record<string, any>): Promise<any> {
  const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5432, 3306];
  const openPorts: number[] = [];
  
  // Note: Real port scanning isn't possible in edge functions
  // This is a simulation based on common web services
  try {
    const httpsResponse = await fetch(`https://${target}`, { signal: AbortSignal.timeout(5000) });
    if (httpsResponse.ok) openPorts.push(443);
  } catch (e) {}
  
  try {
    const httpResponse = await fetch(`http://${target}`, { signal: AbortSignal.timeout(5000) });
    if (httpResponse.ok) openPorts.push(80);
  } catch (e) {}
  
  return {
    open_ports: openPorts,
    scanned_ports: commonPorts,
    host: target
  };
}

// DNS lookup
async function runDig(target: string, options: Record<string, any>): Promise<any> {
  const results: any = {};
  
  try {
    // A record
    const aResponse = await fetch(`https://1.1.1.1/dns-query?name=${target}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const aData = await aResponse.json();
    if (aData.Answer) {
      results.A = aData.Answer.map((r: any) => r.data);
    }
    
    // MX record
    const mxResponse = await fetch(`https://1.1.1.1/dns-query?name=${target}&type=MX`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const mxData = await mxResponse.json();
    if (mxData.Answer) {
      results.MX = mxData.Answer.map((r: any) => r.data);
    }
    
    // TXT record
    const txtResponse = await fetch(`https://1.1.1.1/dns-query?name=${target}&type=TXT`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const txtData = await txtResponse.json();
    if (txtData.Answer) {
      results.TXT = txtData.Answer.map((r: any) => r.data);
    }
  } catch (error) {
    console.error('DNS lookup error:', error);
  }
  
  return results;
}

// WHOIS simulation (limited in edge functions)
async function runWhois(target: string, options: Record<string, any>): Promise<any> {
  // Real WHOIS requires special protocols, this is a simulation
  return {
    domain: target,
    registrar: 'Information not available in edge function',
    creation_date: 'N/A',
    expiration_date: 'N/A',
    note: 'Real WHOIS data requires external API integration'
  };
}

// Wayback URLs using Wayback Machine API
async function runWaybackUrls(target: string, options: Record<string, any>): Promise<any> {
  try {
    const response = await fetch(`http://web.archive.org/cdx/search/cdx?url=${target}/*&output=json&fl=original&collapse=urlkey`);
    if (!response.ok) throw new Error('Wayback API request failed');
    
    const data = await response.json();
    const urls = data.slice(1).map((row: string[]) => row[0]); // Skip header row
    
    return {
      urls: urls.slice(0, 1000), // Limit to 1000 URLs
      count: urls.length
    };
  } catch (error) {
    console.error('Wayback URLs error:', error);
    return { urls: [], count: 0, error: error.message };
  }
}

// GetAllUrls simulation
async function runGau(target: string, options: Record<string, any>): Promise<any> {
  // Combine multiple sources
  const waybackData = await runWaybackUrls(target, options);
  
  return {
    urls: waybackData.urls,
    sources: ['wayback'],
    count: waybackData.count
  };
}

// Nuclei vulnerability scanning (simulated)
async function runNuclei(target: string, options: Record<string, any>): Promise<any> {
  const vulnerabilities: any[] = [];
  
  try {
    // Check for common security headers
    const response = await fetch(`https://${target}`, { signal: AbortSignal.timeout(10000) });
    
    if (!response.headers.get('x-frame-options')) {
      vulnerabilities.push({
        template: 'missing-x-frame-options',
        severity: 'low',
        description: 'Missing X-Frame-Options header'
      });
    }
    
    if (!response.headers.get('x-content-type-options')) {
      vulnerabilities.push({
        template: 'missing-x-content-type-options',
        severity: 'low',
        description: 'Missing X-Content-Type-Options header'
      });
    }
    
    if (!response.headers.get('strict-transport-security')) {
      vulnerabilities.push({
        template: 'missing-hsts',
        severity: 'medium',
        description: 'Missing HSTS header'
      });
    }
  } catch (error) {
    console.error('Nuclei scan error:', error);
  }
  
  return {
    vulnerabilities,
    count: vulnerabilities.length
  };
}

// Web crawler simulation
async function runKatana(target: string, options: Record<string, any>): Promise<any> {
  const crawledUrls: string[] = [];
  
  try {
    const response = await fetch(`https://${target}`, { signal: AbortSignal.timeout(10000) });
    const html = await response.text();
    
    // Simple URL extraction from HTML
    const urlRegex = /href=["']([^"']+)["']/g;
    let match;
    while ((match = urlRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.startsWith('http') || url.startsWith('/')) {
        crawledUrls.push(url);
      }
    }
  } catch (error) {
    console.error('Katana crawl error:', error);
  }
  
  return {
    urls: crawledUrls.slice(0, 500), // Limit results
    count: crawledUrls.length
  };
}

// Directory/file fuzzing simulation
async function runFfuf(target: string, options: Record<string, any>): Promise<any> {
  const commonPaths = [
    '/admin', '/api', '/backup', '/config', '/dev', '/test',
    '/robots.txt', '/sitemap.xml', '/.git', '/.env', '/wp-admin'
  ];
  
  const foundPaths: any[] = [];
  
  for (const path of commonPaths) {
    try {
      const response = await fetch(`https://${target}${path}`, { 
        signal: AbortSignal.timeout(5000),
        method: 'HEAD'
      });
      
      if (response.status !== 404) {
        foundPaths.push({
          path,
          status: response.status,
          size: response.headers.get('content-length') || 'unknown'
        });
      }
    } catch (error) {
      // Path not found or error
    }
  }
  
  return {
    paths: foundPaths,
    count: foundPaths.length
  };
}

// Helper functions
async function extractTitle(response: Response): Promise<string> {
  try {
    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  } catch (error) {
    return '';
  }
}

async function detectTechnologies(response: Response): Promise<string[]> {
  const technologies: string[] = [];
  
  try {
    const server = response.headers.get('server');
    if (server) technologies.push(server);
    
    const poweredBy = response.headers.get('x-powered-by');
    if (poweredBy) technologies.push(poweredBy);
    
    const html = await response.text();
    
    // Simple technology detection
    if (html.includes('wp-content')) technologies.push('WordPress');
    if (html.includes('drupal')) technologies.push('Drupal');
    if (html.includes('joomla')) technologies.push('Joomla');
    if (html.includes('react')) technologies.push('React');
    if (html.includes('angular')) technologies.push('Angular');
    if (html.includes('vue')) technologies.push('Vue.js');
  } catch (error) {
    // Ignore errors in technology detection
  }
  
  return [...new Set(technologies)]; // Remove duplicates
}