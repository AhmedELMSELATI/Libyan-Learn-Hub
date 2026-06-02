const fs = require('fs');
const filePath = 'C:\\Users\\almes\\Downloads\\Libyan-Learn-Hub ・ Web Service ・ Render Dashboard (1).mht';

let content = fs.readFileSync(filePath, 'utf8');

// decode quoted-printable
// remove newline after =
content = content.replace(/=\r?\n/g, '');
// replace =XX with hex
content = content.replace(/=([0-9A-Fa-f]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
});

// extract text between tags
const text = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, '\n');

const lines = text.split('\n');
let lastFewLines = [];
let errorFound = false;

lines.forEach(l => {
    const line = l.trim();
    if (!line) return;
    
    lastFewLines.push(line);
    if (lastFewLines.length > 5) lastFewLines.shift();
    
    const lower = line.toLowerCase();
    if ((lower.includes('npm err') || lower.includes('error:') || lower.includes('build failed') || lower.includes('failed at')) && !lower.includes('var(--') && !lower.includes('.theme')) {
        console.log('--- ERROR FOUND ---');
        console.log(lastFewLines.join('\n'));
        errorFound = true;
    }
});

if (!errorFound) {
    console.log("No obvious errors found. Here are the last 30 non-empty lines of the log:");
    const nonEmpty = lines.map(l => l.trim()).filter(l => l.length > 0);
    console.log(nonEmpty.slice(Math.max(nonEmpty.length - 30, 0)).join('\n'));
}
