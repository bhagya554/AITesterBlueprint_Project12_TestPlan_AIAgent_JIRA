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

// Copy Python API to .vercel/output/api for serverless
try {
  const vercelOutputDir = path.join(__dirname, '.vercel', 'output', 'api');
  if (!fs.existsSync(vercelOutputDir)) {
    fs.mkdirSync(vercelOutputDir, { recursive: true });
  }
  
  // Copy api directory contents
  const apiSrcDir = path.join(__dirname, 'api');
  fs.cpSync(apiSrcDir, vercelOutputDir, { recursive: true });
  
  console.log('✅ API files prepared');
} catch (error) {
  console.error('❌ API preparation failed:', error);
  // Non-critical, Vercel will handle this
}

console.log('✅ Build complete!');
