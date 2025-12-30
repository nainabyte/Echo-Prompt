const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');

try {
    let content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);

    const newLines = [];
    let uriFound = false;

    for (const line of lines) {
        if (line.trim().startsWith('MONGODB_URI=')) {
            if (uriFound) {
                console.log("Removing duplicate MONGODB_URI line.");
                continue;
            }

            // Fix this line
            let [key, val] = line.split('=');
            // Re-join val in case it had = in it
            val = line.substring(key.length + 1).trim();
            val = val.replace(/['"]/g, ''); // Unquote

            // Remove appName entirely
            // Split by ?
            const parts = val.split('?');
            const baseUrl = parts[0];
            const queryStr = parts[1] || "";

            const newParams = [];
            const queryParts = queryStr.split('&').filter(p => p);

            for (const p of queryParts) {
                if (!p.startsWith('appName')) {
                    newParams.push(p);
                }
            }

            // Reconstruct
            let newUri = baseUrl;
            if (newParams.length > 0) {
                newUri += '?' + newParams.join('&');
            }

            newLines.push(`MONGODB_URI=${newUri}`);
            uriFound = true;
            console.log("Fixed main MONGODB_URI line (removed appName).");

        } else {
            newLines.push(line);
        }
    }

    fs.writeFileSync(envPath, newLines.join('\n'));

} catch (e) {
    console.error("Failed to fix env:", e);
}
