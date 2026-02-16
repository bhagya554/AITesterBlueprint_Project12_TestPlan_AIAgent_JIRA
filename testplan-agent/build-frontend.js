const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building for Vercel...');

// Build frontend
try {
  console.log('📦 Installing frontend dependencies...');
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  
  console.log('🏗️  Building frontend...');
  execSync('cd frontend && npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Frontend build failed:', error);
  process.exit(1);
}

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy dist files to public
try {
  const distDir = path.join(__dirname, 'frontend', 'dist');
  const files = fs.readdirSync(distDir);
  
  for (const file of files) {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(publicDir, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  console.log('✅ Frontend files copied to public/');
} catch (error) {
  console.error('❌ Copy failed:', error);
  process.exit(1);
}

// Copy backend files to api directory for Python function
try {
  const apiDir = path.join(__dirname, 'api');
  const backendDir = path.join(__dirname, 'backend');
  
  // Copy config.py
  fs.copyFileSync(
    path.join(backendDir, 'config.py'),
    path.join(apiDir, 'config.py')
  );
  
  // Copy database.py
  fs.copyFileSync(
    path.join(backendDir, 'database.py'),
    path.join(apiDir, 'database.py')
  );
  
  // Copy main.py
  fs.copyFileSync(
    path.join(backendDir, 'main.py'),
    path.join(apiDir, 'main.py')
  );
  
  // Copy routers
  const routersSrcDir = path.join(backendDir, 'routers');
  const routersDestDir = path.join(apiDir, 'routers');
  if (!fs.existsSync(routersDestDir)) {
    fs.mkdirSync(routersDestDir, { recursive: true });
  }
  fs.cpSync(routersSrcDir, routersDestDir, { recursive: true });
  
  // Copy services
  const servicesSrcDir = path.join(backendDir, 'services');
  const servicesDestDir = path.join(apiDir, 'services');
  if (!fs.existsSync(servicesDestDir)) {
    fs.mkdirSync(servicesDestDir, { recursive: true });
  }
  fs.cpSync(servicesSrcDir, servicesDestDir, { recursive: true });
  
  console.log('✅ Backend files copied to api/');
} catch (error) {
  console.error('❌ Backend copy failed:', error);
  // Continue anyway - might already exist
}

console.log('✅ Build complete!');
