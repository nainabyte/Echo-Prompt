const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');

try {
    let content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);

    // Find the line
    const uriLineIdx = lines.findIndex(l => l.trim().startsWith('MONGODB_URI='));

    if (uriLineIdx !== -1) {
        let line = lines[uriLineIdx];
        let [key, val] = line.split('=');
        // Handle value potentially having = in it
        val = line.substring(key.length + 1).trim();
        val = val.replace(/['"]/g, ''); // Unquote

        // Split base and query
        const parts = val.split('?');
        const baseUrl = parts[0];
        let queryStr = parts[1] || "";

        console.log("Original Query:", queryStr);

        // Filter params manually
        const params = queryStr.split('&').filter(p => p && p.trim() !== "");
        const cleanParams = [];

        for (const p of params) {
            // Check if it looks like "appName" or "appName="
            if (p === 'appName' || p.startsWith('appName=')) {
                console.log("Dropping bad param:", p);
                continue;
            }
            cleanParams.push(p);
        }

        // Add valid appName
        cleanParams.push('appName=EchoPrompt');

        const newUri = `${baseUrl}?${cleanParams.join('&')}`;

        lines[uriLineIdx] = `MONGODB_URI=${newUri}`;

        // Remove duplicates
        const uniqueLines = [];
        let seen = false;
        for (const l of lines) {
            if (l.trim().startsWith('MONGODB_URI=')) {
                if (!seen) {
                    uniqueLines.push(l); // Keep the modified one
                    seen = true;
                }
            } else {
                uniqueLines.push(l);
            }
        }

        fs.writeFileSync(envPath, uniqueLines.join('\n'));
        console.log("Fixed URI. New Query:", cleanParams.join('&'));

    } else {
        console.log("No MONGODB_URI found.");
    }

} catch (e) {
    console.error("Fix failed:", e);
}
