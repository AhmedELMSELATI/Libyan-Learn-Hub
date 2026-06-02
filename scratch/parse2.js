const fs = require('fs');
const filePath = 'C:\\Users\\almes\\Downloads\\Libyan-Learn-Hub ・ Web Service ・ Render Dashboard (1).mht';
let content = fs.readFileSync(filePath, 'utf8');

// remove quoted printable newlines
content = content.replace(/=\r?\n/g, '');

// decode quoted-printable =XX
content = content.replace(/=([0-9A-Fa-f]{2})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
});

// extract text between tags
const text = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ');

// Find "error" or "fail"
const keywords = ['error', 'fail', 'err!', 'exception', 'warn'];
const matches = [];

let searchStart = 0;
while (true) {
    let foundIndex = -1;
    let foundKeyword = '';
    
    for (const kw of keywords) {
        const idx = text.toLowerCase().indexOf(kw, searchStart);
        if (idx !== -1 && (foundIndex === -1 || idx < foundIndex)) {
            foundIndex = idx;
            foundKeyword = kw;
        }
    }
    
    if (foundIndex === -1) break;
    
    const start = Math.max(0, foundIndex - 100);
    const end = Math.min(text.length, foundIndex + 200);
    matches.push(text.substring(start, end));
    
    searchStart = foundIndex + foundKeyword.length;
}

if (matches.length > 0) {
    console.log(`Found ${matches.length} potential error occurrences:`);
    matches.slice(0, 10).forEach((m, i) => {
        console.log(`\n--- Match ${i + 1} ---`);
        console.log(m);
    });
} else {
    console.log("No error/fail keywords found in the plain text of the document.");
}
