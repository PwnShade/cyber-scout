export class MockDataGenerator {
  static generateSubdomains(domain: string, count = 15): string[] {
    const prefixes = [
      'www', 'api', 'admin', 'mail', 'ftp', 'cdn', 'blog', 'shop', 'dev', 'test',
      'staging', 'beta', 'assets', 'static', 'images', 'js', 'css', 'media',
      'support', 'help', 'docs', 'portal', 'app', 'mobile', 'old', 'new',
      'secure', 'vpn', 'remote', 'db', 'mysql', 'postgres', 'redis'
    ];
    
    return prefixes
      .slice(0, count)
      .map(prefix => `${prefix}.${domain}`)
      .concat([domain]); // Include root domain
  }

  static generateAliveUrls(subdomains: string[], ratio = 0.7): string[] {
    const protocols = ['https', 'http'];
    const alive = subdomains.slice(0, Math.floor(subdomains.length * ratio));
    
    return alive.flatMap(subdomain => 
      protocols.map(protocol => `${protocol}://${subdomain}`)
    ).slice(0, Math.floor(subdomains.length * ratio * 1.5));
  }

  static generatePorts(count = 8) {
    const commonPorts = [
      { port: 80, service: 'HTTP', state: 'open' },
      { port: 443, service: 'HTTPS', state: 'open' },
      { port: 22, service: 'SSH', state: 'filtered' },
      { port: 25, service: 'SMTP', state: 'closed' },
      { port: 53, service: 'DNS', state: 'open' },
      { port: 21, service: 'FTP', state: 'closed' },
      { port: 3306, service: 'MySQL', state: 'filtered' },
      { port: 5432, service: 'PostgreSQL', state: 'closed' },
      { port: 6379, service: 'Redis', state: 'filtered' },
      { port: 8080, service: 'HTTP-Alt', state: 'open' },
      { port: 8443, service: 'HTTPS-Alt', state: 'open' },
      { port: 9000, service: 'SonarQube', state: 'closed' }
    ];
    
    return commonPorts.slice(0, count);
  }

  static generateDirectories(count = 12): string[] {
    const dirs = [
      '/admin', '/api', '/login', '/dashboard', '/uploads', '/assets',
      '/static', '/images', '/js', '/css', '/includes', '/config',
      '/backup', '/old', '/temp', '/cache', '/logs', '/db', '/test',
      '/dev', '/staging', '/beta', '/v1', '/v2', '/docs', '/help'
    ];
    
    return dirs.slice(0, count);
  }

  static generateFiles(count = 8): string[] {
    const files = [
      'robots.txt', 'sitemap.xml', '.htaccess', 'config.php', 'wp-config.php',
      'readme.txt', 'changelog.txt', 'license.txt', 'composer.json',
      'package.json', '.env', '.git', 'debug.log', 'error.log'
    ];
    
    return files.slice(0, count);
  }

  static generateTechnologies() {
    const stacks = [
      { name: 'Nginx', version: '1.18.0', category: 'Web Server' },
      { name: 'Apache', version: '2.4.41', category: 'Web Server' },
      { name: 'React', version: '18.2.0', category: 'JavaScript Framework' },
      { name: 'Next.js', version: '13.4.0', category: 'React Framework' },
      { name: 'Node.js', version: '18.17.0', category: 'Runtime' },
      { name: 'PHP', version: '8.1.0', category: 'Programming Language' },
      { name: 'MySQL', version: '8.0.30', category: 'Database' },
      { name: 'CloudFlare', version: null, category: 'CDN' },
      { name: 'WordPress', version: '6.2.0', category: 'CMS' },
      { name: 'jQuery', version: '3.6.0', category: 'JavaScript Library' }
    ];
    
    return stacks.slice(0, Math.floor(Math.random() * 5) + 3);
  }

  static generateVulnerabilities(domain: string) {
    const vulns = [
      {
        id: 'CVE-2023-1234',
        title: 'Cross-Site Scripting (XSS)',
        severity: 'Medium',
        url: `https://api.${domain}/search`,
        description: 'Reflected XSS in search parameter',
        impact: 'Client-side code execution'
      },
      {
        id: 'CVE-2023-5678',
        title: 'SQL Injection',
        severity: 'High',
        url: `https://admin.${domain}/login`,
        description: 'SQL injection in login form',
        impact: 'Database access and manipulation'
      },
      {
        id: 'CORS-MISC-001',
        title: 'CORS Misconfiguration',
        severity: 'Low',
        url: `https://api.${domain}/*`,
        description: 'Wildcard CORS policy allows any origin',
        impact: 'Cross-origin resource access'
      }
    ];
    
    return vulns.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  static generateSSLInfo(domain: string) {
    return {
      certificate: {
        issuer: 'Let\'s Encrypt Authority X3',
        subject: `CN=${domain}`,
        validFrom: '2024-01-15T00:00:00Z',
        validTo: '2024-10-15T23:59:59Z',
        serialNumber: 'ABC123DEF456789',
        algorithm: 'RSA 2048 bits',
        san: [`*.${domain}`, domain],
        grade: ['A+', 'A', 'B', 'C'][Math.floor(Math.random() * 4)]
      },
      protocols: ['TLSv1.2', 'TLSv1.3'],
      ciphers: ['ECDHE-RSA-AES256-GCM-SHA384', 'ECDHE-RSA-CHACHA20-POLY1305'],
      vulnerabilities: []
    };
  }

  static generateSecurityHeaders(url: string) {
    const hasSecurityHeaders = Math.random() > 0.3;
    
    return {
      url,
      headers: hasSecurityHeaders ? {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      } : {
        'Server': 'Apache/2.4.41'
      },
      missingHeaders: hasSecurityHeaders ? [] : [
        'Strict-Transport-Security',
        'Content-Security-Policy', 
        'X-Frame-Options',
        'X-Content-Type-Options'
      ],
      score: hasSecurityHeaders ? 'A' : 'F'
    };
  }

  static generateParameters(url: string) {
    const params = [
      'id', 'user', 'search', 'q', 'query', 'filter', 'sort', 'page',
      'limit', 'offset', 'token', 'key', 'callback', 'format', 'type'
    ];
    
    const found = params.slice(0, Math.floor(Math.random() * 8) + 2);
    
    return {
      url,
      parameters: found.map(param => ({
        name: param,
        type: 'GET',
        example: `${url}?${param}=value`
      }))
    };
  }

  static generateEndpoints(jsUrl: string) {
    const endpoints = [
      '/api/users', '/api/auth/login', '/api/auth/logout', '/api/profile',
      '/api/settings', '/api/data', '/api/upload', '/api/search',
      '/admin/panel', '/admin/users', '/internal/debug', '/internal/health'
    ];
    
    return {
      source: jsUrl,
      endpoints: endpoints.slice(0, Math.floor(Math.random() * 6) + 3)
    };
  }

  static generateSecrets(jsUrl: string) {
    const secrets = [
      {
        type: 'API Key',
        value: 'sk_test_4eC39HqLyjWDarjtT1zdp7dc',
        file: jsUrl,
        line: 42
      },
      {
        type: 'Database URL',
        value: 'postgres://user:pass@localhost:5432/db',
        file: jsUrl,
        line: 156
      },
      {
        type: 'AWS Access Key',
        value: 'AKIAIOSFODNN7EXAMPLE',
        file: jsUrl,
        line: 203
      }
    ];
    
    return secrets.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  static generateScreenshots(urls: string[]) {
    return urls.slice(0, 10).map(url => ({
      url,
      screenshot: `data:image/svg+xml;base64,${btoa(`
        <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#1a1a1a"/>
          <text x="50%" y="50%" fill="#00ff00" text-anchor="middle" dy=".3em" font-family="monospace" font-size="12">
            Screenshot: ${new URL(url).hostname}
          </text>
          <rect x="10" y="10" width="280" height="30" fill="#333" rx="5"/>
          <circle cx="25" cy="25" r="5" fill="#ff5f56"/>
          <circle cx="45" cy="25" r="5" fill="#ffbd2e"/>
          <circle cx="65" cy="25" r="5" fill="#27ca3f"/>
        </svg>
      `)}`,
      title: `${new URL(url).hostname} - Screenshot`,
      timestamp: new Date().toISOString()
    }));
  }
}