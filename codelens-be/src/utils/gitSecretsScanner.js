const fs = require('fs');
const path = require('path');

class GitSecretsScanner {
  constructor() {
    // Common secret patterns
    this.secretPatterns = [
      // AWS keys
      /AKIA[0-9A-Z]{16}/g,
      /aws_secret_access_key\s*=\s*['"]?[A-Za-z0-9+/]{40}['"]?/gi,
      // API keys
      /api[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}['"]?/gi,
      /secret[_-]?key\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}['"]?/gi,
      // Database URLs
      /mongodb:\/\/[^:]+:[^@]+@/g,
      /mysql:\/\/[^:]+:[^@]+@/g,
      /postgres:\/\/[^:]+:[^@]+@/g,
      // Tokens
      /token\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}['"]?/gi,
      /bearer\s+[A-Za-z0-9_-]{20,}/gi,
      // Private keys
      /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
      /-----BEGIN\s+EC\s+PRIVATE\s+KEY-----/g,
      // Passwords in code
      /password\s*[:=]\s*['"]?[^'"]{8,}['"]?/gi,
      // GitHub tokens
      /ghp_[A-Za-z0-9]{36}/g,
      /gho_[A-Za-z0-9]{36}/g,
      /ghu_[A-Za-z0-9]{36}/g,
      // JWT tokens
      /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
      // Slack tokens
      /xoxb-[0-9]{10}-[0-9]{10}-[A-Za-z0-9]{24}/g,
      // Generic base64 encoded secrets (likely)
      /[A-Za-z0-9+/]{40,}={0,2}/g
    ];
  }

  async scanRepository(repoPath, projectKey) {
    try {
      console.log(`🔍 Fast scanning repository: ${repoPath}`);

      const findings = [];
      const startTime = Date.now();

      // Scan all files in the repository
      await this.scanDirectory(repoPath, findings, repoPath);

      const scanTime = Date.now() - startTime;
      console.log(`✅ Fast scan completed in ${scanTime}ms for ${projectKey}`);

      const report = {
        projectKey,
        scanTime: new Date().toISOString(),
        totalFindings: findings.length,
        findings,
        status: findings.length > 0 ? 'FAILED' : 'PASSED',
        scanDuration: scanTime
      };
      
      // Don't save separate report file - data is in sonar.json
      
      return report;

    } catch (error) {
      console.error(`❌ Fast scan failed:`, error.message);
      
      const report = {
        projectKey,
        scanTime: new Date().toISOString(),
        totalFindings: 0,
        findings: [],
        status: 'ERROR',
        error: error.message || 'Unknown error'
      };
      
      return report;
    }
  }

  async scanDirectory(dirPath, findings, basePath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip common non-source directories
          if (!['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt', 'vendor', 'target', 'bin', 'obj'].includes(item)) {
            await this.scanDirectory(fullPath, findings, basePath);
          }
        } else if (stat.isFile()) {
          // Only scan text files that are not lock/dependency files
          if (this.isTextFile(fullPath) && !this.shouldSkipFile(fullPath)) {
            await this.scanFile(fullPath, findings, basePath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}:`, error.message);
    }
  }

  shouldSkipFile(filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    
    // Skip lock files and dependency files across different languages
    const skipFiles = [
      // JavaScript/Node.js
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'npm-shrinkwrap.json',
      
      // Python
      'poetry.lock',
      'pipfile.lock',
      'requirements.txt',
      'requirements-dev.txt',
      'pipfile',
      'setup.py',
      'pyproject.toml',
      
      // PHP
      'composer.lock',
      'composer.json',
      
      // Go
      'go.sum',
      'go.mod',
      
      // Ruby
      'gemfile.lock',
      'gemfile',
      
      // Java/Kotlin
      'gradle-wrapper.properties',
      'gradlew',
      'gradlew.bat',
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      
      // Rust
      'cargo.lock',
      'cargo.toml',
      
      // .NET
      'packages.config',
      '*.csproj',
      '*.vbproj',
      '*.fsproj',
      
      // General dependency directories
      'vendor',
      'node_modules',
      
      // Build artifacts
      'dist',
      'build',
      'target',
      'bin',
      'obj',
      'out',
      
      // IDE files
      '.vscode',
      '.idea',
      '*.swp',
      '*.swo',
      
      // OS files
      '.ds_store',
      'thumbs.db',
      
      // Log files
      '*.log',
      
      // Temporary files
      '*.tmp',
      '*.temp',
      '*.bak',
      '*.backup'
    ];
    
    // Check exact filename matches
    if (skipFiles.includes(fileName)) {
      return true;
    }
    
    // Check pattern matches
    const skipPatterns = [
      /\.lock$/,
      /\.sum$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
      /composer\.(lock|json)$/,
      /go\.(sum|mod)$/,
      /gemfile(\.lock)?$/,
      /cargo\.(lock|toml)$/,
      /requirements(-dev)?\.txt$/,
      /poetry\.lock$/,
      /pipfile(\.lock)?$/,
      /\.csproj$/,
      /\.vbproj$/,
      /\.fsproj$/,
      /pom\.xml$/,
      /build\.gradle(\.kts)?$/,
      /gradle-wrapper\.properties$/,
      /packages\.config$/,
      /\.log$/,
      /\.tmp$/,
      /\.temp$/,
      /\.bak$/,
      /\.backup$/
    ];
    
    return skipPatterns.some(pattern => pattern.test(fileName));
  }

  isTextFile(filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    const ext = path.extname(filePath).toLowerCase();
    
    // Always scan source code files
    const sourceExtensions = [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.php', '.java', '.go', '.rb', '.cs', '.cpp', '.c', '.h',
      '.html', '.htm', '.css', '.scss', '.sass', '.less', '.vue', '.svelte'
    ];
    
    if (sourceExtensions.includes(ext)) {
      return true;
    }
    
    // Selectively scan configuration files (but not dependency files)
    const configFiles = [
      '.env', '.env.local', '.env.development', '.env.production', '.env.test',
      'docker-compose.yml', 'docker-compose.yaml', 'dockerfile',
      '.babelrc', '.eslintrc.js', '.eslintrc.json', 'tsconfig.json',
      'webpack.config.js', 'vite.config.js', 'rollup.config.js',
      '.gitignore', '.dockerignore',
      'makefile', 'cmakelists.txt'
    ];
    
    if (configFiles.includes(fileName) || configFiles.some(cf => fileName.endsWith(cf))) {
      return true;
    }
    
    // Scan documentation and text files
    const docExtensions = ['.md', '.txt', '.rst'];
    if (docExtensions.includes(ext)) {
      return true;
    }
    
    // Scan shell scripts
    const scriptExtensions = ['.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd'];
    if (scriptExtensions.includes(ext)) {
      return true;
    }
    
    // Scan SQL files
    if (ext === '.sql') {
      return true;
    }
    
    // For JSON files, be selective - only scan specific config JSON files
    if (ext === '.json') {
      const allowedJsonFiles = [
        'config.json', 'settings.json', 'secrets.json', 'credentials.json',
        'database.json', 'redis.json', 'aws.json', 'azure.json', 'gcp.json',
        'firebase.json', 'netlify.json', 'vercel.json', 'app.json',
        '.firebaserc', 'tsconfig.json', 'babel.config.json'
      ];
      
      return allowedJsonFiles.includes(fileName);
    }
    
    // For YAML files, be selective
    if (ext === '.yaml' || ext === '.yml') {
      const allowedYamlFiles = [
        'config.yml', 'config.yaml', 'settings.yml', 'settings.yaml',
        'secrets.yml', 'secrets.yaml', 'credentials.yml', 'credentials.yaml',
        'docker-compose.yml', 'docker-compose.yaml'
      ];
      
      return allowedYamlFiles.includes(fileName);
    }
    
    // For other config formats
    if (['.toml', '.ini', '.cfg', '.conf'].includes(ext)) {
      return true;
    }
    
    // Include files without extension (like Makefile, Dockerfile)
    if (!ext) {
      const allowedNoExt = ['makefile', 'dockerfile', 'rakefile', 'gemfile'];
      return allowedNoExt.includes(fileName);
    }
    
    return false;
  }

  async scanFile(filePath, findings, basePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const relativePath = path.relative(basePath, filePath);

      lines.forEach((line, lineNumber) => {
        this.secretPatterns.forEach((pattern, patternIndex) => {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Skip common false positives
              if (!this.isFalsePositive(match, line)) {
                findings.push({
                  file: relativePath,
                  line: lineNumber + 1,
                  content: this.maskSecret(match),
                  severity: 'HIGH',
                  rule: this.getRuleName(patternIndex),
                  pattern: pattern.toString()
                });
              }
            });
          }
        });
      });
    } catch (error) {
      // Skip files that can't be read as text
    }
  }

  isFalsePositive(match, line) {
    // Common false positive patterns
    const falsePositives = [
      /example/i,
      /test/i,
      /sample/i,
      /demo/i,
      /placeholder/i,
      /xxx/i,
      /yyy/i,
      /zzz/i,
      /fake/i,
      /mock/i
    ];
    
    return falsePositives.some(fp => fp.test(match) || fp.test(line));
  }

  maskSecret(secret) {
    // Show first 4 and last 4 characters, mask the rest
    if (secret.length <= 8) {
      return '*'.repeat(secret.length);
    }
    return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
  }

  getRuleName(patternIndex) {
    const ruleNames = [
      'AWS Access Key',
      'AWS Secret Key',
      'API Key',
      'Secret Key',
      'MongoDB URL',
      'MySQL URL', 
      'PostgreSQL URL',
      'Bearer Token',
      'Bearer Token',
      'RSA Private Key',
      'EC Private Key',
      'Password',
      'GitHub Personal Token',
      'GitHub OAuth Token',
      'GitHub User Token',
      'JWT Token',
      'Slack Bot Token',
      'Base64 Encoded Secret'
    ];
    
    return ruleNames[patternIndex] || 'Unknown Pattern';
  }

}

module.exports = new GitSecretsScanner();
