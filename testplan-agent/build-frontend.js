const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building frontend for Vercel...');

// Build frontend
try {
  execSync('cd frontend && npm install && npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error);
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
  
  console.log('✅ Frontend built and copied to public/');
} catch (error) {
  console.error('❌ Copy failed:', error);
  process.exit(1);
}
