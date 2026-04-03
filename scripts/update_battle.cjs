const fs = require('fs');

const path = 'd:\\edtech\\eddva_frontend\\src\\pages\\student\\BattleArena.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert the constants
if (!content.includes('const BLUE')) {
  content = content.replace(
    /import \{ toast \} from "sonner";/,
    `import { toast } from "sonner";\n\nconst BLUE   = "#013889";\nconst BLUE_M = "#0257c8";\nconst BLUE_L = "#E6EEF8";\n`
  );
}

// Replace generic shadcn classes with premium light mode variants
content = content.replace(/bg-background/g, 'bg-[#F5F7FB]');
content = content.replace(/bg-card/g, 'bg-white shadow-sm');
content = content.replace(/border-border/g, 'border-gray-100');
content = content.replace(/text-foreground/g, 'text-gray-900');
content = content.replace(/text-muted-foreground/g, 'text-gray-500');
content = content.replace(/bg-secondary/g, 'bg-gray-50');

// Replace primary with BLUE equivalent
content = content.replace(/text-primary-foreground/g, 'text-white');
content = content.replace(/bg-primary(\/[0-9]+)?/g, (match, op) => op ? `bg-blue-600${op}` : 'bg-blue-600');
content = content.replace(/text-primary(\/[0-9]+)?/g, (match, op) => op ? `text-blue-600${op}` : 'text-blue-600');
content = content.replace(/border-primary(\/[0-9]+)?/g, (match, op) => op ? `border-blue-600${op}` : 'border-blue-600');
content = content.replace(/ring-primary(\/[0-9]+)?/g, (match, op) => op ? `ring-blue-600${op}` : 'ring-blue-600');
content = content.replace(/shadow-primary(\/[0-9]+)?/g, (match, op) => op ? `shadow-blue-600${op}` : 'shadow-blue-600');

// Some specific tweaks to make it beautiful
content = content.replace(/rounded-2xl/g, 'rounded-3xl');
content = content.replace(/rounded-xl/g, 'rounded-2xl');
content = content.replace(/rounded-md/g, 'rounded-xl');

// Tweak font weights
content = content.replace(/font-semibold/g, 'font-bold');
content = content.replace(/text-xl font-bold/g, 'text-xl font-black');
content = content.replace(/text-2xl font-bold/g, 'text-2xl font-black');
content = content.replace(/text-3xl font-bold/g, 'text-3xl font-black');

fs.writeFileSync(path, content, 'utf8');

console.log("BattleArena updated!");
