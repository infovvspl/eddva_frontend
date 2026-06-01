const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js'))
        results.push(file);
    }
  });
  return results;
}

const files = [...walk('src/pages/school'), ...walk('src/components/school')];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content;
  
  // Only replace if it doesn't already have /school/ in front
  // So we replace quotes followed by /admin with quote followed by /school/admin
  newContent = newContent.replace(/(['"`])\/admin\b/g, '$1/school/admin');
  newContent = newContent.replace(/(['"`])\/teacher\b/g, '$1/school/teacher');
  newContent = newContent.replace(/(['"`])\/student\b/g, '$1/school/student');
  
  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    console.log('Updated ' + f);
  }
});
