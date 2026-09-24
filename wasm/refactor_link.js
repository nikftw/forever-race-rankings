const fs = require('fs');

let code = fs.readFileSync('link.go', 'utf8');

const imports = `import (
	"strings"
	"github.com/wowsims/classic/sim/core"
	"github.com/wowsims/classic/sim/core/proto"
)
`;

code = code.replace(/import \([\s\S]*?\)/, imports);

function removeFunc(name) {
    const start = code.indexOf('func ' + name);
    if (start !== -1) {
        let openBraces = 0;
        let end = -1;
        for (let i = start; i < code.length; i++) {
            if (code[i] === '{') openBraces++;
            if (code[i] === '}') {
                openBraces--;
                if (openBraces === 0) {
                    end = i + 1;
                    break;
                }
            }
        }
        if (end !== -1) {
            code = code.slice(0, start) + code.slice(end);
        }
    }
}
removeFunc('simUIPath');

fs.writeFileSync('link.go', code);
