const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const logFile = path.join(__dirname, '../dry_run_report.md');

let report = '# Responsive Transformation Dry-Run Report\n\n';
report += 'This report flags all the responsive changes the script intends to make.\n\n';

let totalFilesScanned = 0;
let totalFilesModified = 0;
let ambiguousFlexContainers = 0;

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  }
}

function processFile(filepath) {
  if (filepath.toLowerCase().includes('coaching')) return;
  if (!filepath.endsWith('.tsx') && !filepath.endsWith('.jsx')) return;

  totalFilesScanned++;
  
  const content = fs.readFileSync(filepath, 'utf-8');
  let newContent = content;
  const changes = [];
  const flexWarnings = [];

  // 1. Hardcoded widths: w-[Xpx] -> w-full max-w-[Xpx]
  newContent = newContent.replace(/\b(w-\[\d+px\])\b/g, (match) => {
    changes.push(`Replaced \`${match}\` with \`w-full max-w-${match.replace('w-', '')}\``);
    return `w-full max-w-${match.replace('w-', '')}`;
  });

  // 2. Hardcoded heights: h-[Xpx] -> min-h-[Xpx] h-auto
  newContent = newContent.replace(/\b(h-\[\d+px\])\b/g, (match) => {
    changes.push(`Replaced \`${match}\` with \`min-h-${match.replace('h-', '')} h-auto\``);
    return `min-h-${match.replace('h-', '')} h-auto`;
  });

  // 3. Ambiguous flex containers missing wrap/stacking
  const lines = newContent.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('flex ') && (!line.includes('flex-wrap') && !line.includes('flex-col') && !line.includes('md:flex-col') && !line.includes('sm:flex-col'))) {
      if (line.includes('gap-')) { // Often a sign it might overflow if items are large
        flexWarnings.push(`Line ${i+1}: \`${line.trim()}\``);
      }
    }
  });

  if (changes.length > 0 || flexWarnings.length > 0) {
    totalFilesModified++;
    report += `### \`${path.relative(path.join(__dirname, '..'), filepath)}\`\n`;
    
    if (changes.length > 0) {
      report += '**Modifications:**\n';
      changes.forEach(c => report += `- ${c}\n`);
    }

    if (flexWarnings.length > 0) {
      ambiguousFlexContainers += flexWarnings.length;
      report += '**Ambiguous Flex Containers (Requires Manual Review):**\n';
      flexWarnings.forEach(w => report += `- ${w}\n`);
    }
    
    report += '\n';
  }
}

console.log('Starting dry run...');
['pages', 'components'].forEach(dir => {
  const targetPath = path.join(srcDir, dir);
  if (fs.existsSync(targetPath)) {
    walk(targetPath, processFile);
  }
});

report = `## Summary\n- **Files Scanned:** ${totalFilesScanned}\n- **Files to Modify:** ${totalFilesModified}\n- **Ambiguous Flex Containers:** ${ambiguousFlexContainers}\n\n` + report;

fs.writeFileSync(logFile, report, 'utf-8');
console.log('Dry run complete. Report written to dry_run_report.md');
