const fs = require('fs');
let code = fs.readFileSync('link.go', 'utf8');
code = code.replace(/"strings"\n/g, '');
fs.writeFileSync('link.go', code);
