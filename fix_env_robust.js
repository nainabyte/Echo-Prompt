const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Find the MONGODB_URI line
    const match = content.match(/^MONGODB_URI=(.*)$/m);
    if (match) {
        let uriStr = match[1].trim().replace(/['"]/g, ''); // Unquote if needed

        try {
            // "mongodb+srv" protocol might not be supported by standard URL object?
            // Node's URL supports custom schemes mostly.
            // But let's handle "mongodb+srv://" manually if URL throws.

            // Workaround: Treat it as a string for the query part
            const parts = uriStr.split('?');
            const baseUrl = parts[0];
            const queryStr = parts[1] || "";

            // Parse query params manually to be safe against Mongo specifics
            const newParams = [];
            const queryParts = queryStr.split('&').filter(p => p);

            let found = false;
            for (const p of queryParts) {
                if (p.startsWith('appName=')) {
                    // Skip the bad one
                    found = true;
                } else if (p === 'appName') {
                    // Skip bad key-only
                    found = true;
                } else {
                    newParams.push(p);
                }
            }

            // Append good one
            newParams.push('appName=EchoPrompt');

            const newUri = baseUrl + '?' + newParams.join('&');

            // Replace in content
            const newContent = content.replace(match[0], `MONGODB_URI=${newUri}`);

            fs.writeFileSync(envPath, newContent);
            console.log("Fixed URI via parsing.");
            console.log("Old Query:", queryStr);
            console.log("New Query:", newParams.join('&'));

        } catch (e) {
            console.error("URI Parse Error:", e);
        }
    } else {
        console.error("MONGODB_URI not found");
    }

} catch (e) {
    console.error("Failed to fix env:", e);
}
