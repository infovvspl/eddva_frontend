const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/school/admin/ClassForm.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/bg-brand-600/g, 'bg-primary');
content = content.replace(/hover:bg-brand-700/g, 'hover:bg-primary-dark');
content = content.replace(/focus:border-brand-400/g, 'focus:border-primary');
content = content.replace(/focus:ring-brand-100/g, 'focus:ring-primary/20');
content = content.replace(/focus:ring-brand-500/g, 'focus:ring-primary');
content = content.replace(/text-brand-700/g, 'text-primary-dark');
content = content.replace(/from-brand-600/g, 'from-primary');

fs.writeFileSync(file, content, 'utf8');
console.log('Replaced brand classes with primary classes');
