const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');

try {
    const content = fs.readFileSync(envPath, 'utf8');

    // Extract JUST the mongo connection string base (protocol + user + pass + host + path)
    // Ignore everything after ?
    const mongoMatch = content.match(/(mongodb\+srv:\/\/[^?]+)/);

    if (!mongoMatch) {
        console.error("Could not find base MongoDB URI");
        process.exit(1);
    }

    const baseUri = mongoMatch[1].trim();
    const cleanUri = `${baseUri}?appName=EchoPrompt`;

    // Filter out old MONGODB_URI lines entirely
    const lines = content.split(/\r?\n/).filter(l => !l.trim().startsWith('MONGODB_URI='));

    // Add new one
    lines.push(`MONGODB_URI=${cleanUri}`);

    const newContent = lines.join('\n');
    fs.writeFileSync(envPath, newContent);

    console.log("Rewrite successful.");
    console.log("New URI Base:", baseUri.replace(/:([^@]+)@/, ':***@'));

} catch (e) {
    console.error("Rewrite failed:", e);
    process.exit(1);
}
