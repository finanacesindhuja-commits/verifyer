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
  'maneger cantrol',
  'pd',
  'staff join'
];

let report = `# Production Readiness Analysis Report\n\n`;

apps.forEach(app => {
  const appPath = path.join(rootDir, app);
  if (!fs.existsSync(appPath)) {
      report += `## ${app}\n- Folder not found or inaccessible.\n\n`;
      return;
  }
  
  // Find frontend and backend paths (sometimes they are nested like admin panal/applicants-dashboard/frontend)
  let frontendPath = path.join(appPath, 'frontend');
  let backendPath = path.join(appPath, 'backend');
  
  // Quick fallback check for nested frontend/backend
  if (!fs.existsSync(frontendPath)) {
      const dirs = fs.readdirSync(appPath).filter(d => fs.statSync(path.join(appPath, d)).isDirectory());
      for (const d of dirs) {
          const possibleFrontend = path.join(appPath, d, 'frontend');
          if (fs.existsSync(possibleFrontend)) {
              frontendPath = possibleFrontend;
              const possibleBackend = path.join(appPath, d, 'backend');
              if (fs.existsSync(possibleBackend)) backendPath = possibleBackend;
              report += `- **Note**: Using nested structure inside ${d}\n`;
              break;
          }
      }
  }

  const rootPkg = fs.existsSync(path.join(appPath, 'package.json'));
  const rootRender = fs.existsSync(path.join(appPath, 'render.yaml'));
  const hasBackend = fs.existsSync(backendPath);
  const hasFrontend = fs.existsSync(frontendPath);
  
  let hasStaticServe = false;
  let portCount = 0;
  
  if (hasBackend) {
    const indexPath = path.join(backendPath, 'index.js');
    if (fs.existsSync(indexPath)) {
      const code = fs.readFileSync(indexPath, 'utf8');
      hasStaticServe = code.includes('express.static') && code.includes('index.html');
      portCount = (code.match(/const\s+PORT\s*=/g) || []).length;
    }
  }

  let frontendEnvFixed = false;
  let frontendPortFixed = false;
  if (hasFrontend) {
      const pkgPath = path.join(frontendPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
          const pkg = fs.readFileSync(pkgPath, 'utf8');
          // simple check
          frontendPortFixed = true; 
      }
  }

  report += `## ${app}\n`;
  report += `- Has Root package.json: ${rootPkg ? 'Yes' : 'No'}\n`;
  report += `- Has Frontend: ${hasFrontend ? 'Yes' : 'No'}\n`;
  report += `- Has Backend: ${hasBackend ? 'Yes' : 'No'}\n`;
  report += `- Express Static Serve: ${hasStaticServe ? 'Yes' : 'No'}\n`;
  report += `- Backend PORT Declarations: ${portCount}\n\n`;
});

fs.writeFileSync(path.join(__dirname, 'analysis_report.md'), report);
console.log('Report generated at analysis_report.md');
