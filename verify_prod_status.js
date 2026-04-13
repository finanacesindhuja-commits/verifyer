const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const apps = [
  'admin panal',
  'calloction cantroll',
  'Disbursed',
  'hr att',
  'Hr desh',
  'LOAN APLICATION',
  'loan aplication verifiyear',
  'maneger cantrol',
  'pd',
  'staff join'
];

apps.forEach(app => {
  const appPath = path.join(rootDir, app);
  
  if (!fs.existsSync(appPath)) return;

  const result = {
    app,
    hasRootPackageJson: fs.existsSync(path.join(appPath, 'package.json')),
    hasBackend: fs.existsSync(path.join(appPath, 'backend')),
    hasFrontend: fs.existsSync(path.join(appPath, 'frontend')),
    hasStaticServe: false,
    hasFrontendLocalhostFallback: false,
  };

  if (result.hasBackend) {
    const indexPath = path.join(appPath, 'backend', 'index.js');
    if (fs.existsSync(indexPath)) {
      const code = fs.readFileSync(indexPath, 'utf8');
      result.hasStaticServe = code.includes('express.static') && code.includes('frontend');
    }
  }

  if (result.hasFrontend) {
    // Just a basic check for Vite env or hardcoded localhost
    const srcPath = path.join(appPath, 'frontend', 'src');
    if (fs.existsSync(srcPath)) {
      const grepLocalhost = (dir) => {
        let found = false;
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            if (grepLocalhost(fullPath)) return true;
          } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('http://localhost:5000')) {
                // If it uses import.meta.env.VITE_API_URL or similar, we consider it "configured" (even if localhost is a fallback). 
                // Wait, if localhost is hardcoded WITHOUT env fallback, that's bad.
                if (!content.includes('import.meta.env') && !content.includes('process.env')) {
                    return true;
                }
            }
          }
        }
        return false;
      };
      
      try {
        result.hasFrontendLocalhostFallback = grepLocalhost(srcPath);
      } catch (e) {}
    }
  }

  console.log(`\n=== ${app} ===`);
  console.log(`Root package.json: ${result.hasRootPackageJson ? '✅' : '❌'}`);
  console.log(`Express Static Serving: ${result.hasStaticServe ? '✅' : '❌'}`);
  console.log(`Frontend Hardcoded Localhost: ${result.hasFrontendLocalhostFallback ? '❌ (Needs Env)' : '✅ (Clean or uses Env)'}`);
  
});
