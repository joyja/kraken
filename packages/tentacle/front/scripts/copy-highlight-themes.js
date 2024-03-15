import fs from 'fs';
import path from 'path';

const themes = ['a11y-dark.css', 'a11y-light.css'];

// Use process.cwd() to get the current working directory and construct paths
const srcDir = fs.realpathSync(path.join(process.cwd(), 'node_modules', 'highlight.js', 'styles'));
const destDir = path.join(process.cwd(), 'static', 'css');

// Ensure the destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

themes.forEach(theme => {
  const src = path.join(srcDir, theme);
  const dest = path.join(destDir, theme);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${theme} to ${destDir}`);
});
