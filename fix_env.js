const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    console.log("Original content length:", content.length);

    // Robust Fix: Find ?appName=... or &appName=... and replace with EchoPrompt
    // Handle cases:
    // 1. &appName=  (empty, followed by end or newline)
    // 2. &appName=& (empty, followed by other param)
    // 3. ?appName=

    let newContent = content;

    // Case 1: Start with ? or &
    newContent = newContent.replace(/([?&])appName=[^&\n\r]*/g, '$1appName=EchoPrompt');

    // Safety check: if it replaced it with EchoPromptEchoPrompt or something weird, we can rely on standard connection string parsers ignoring extras, but let's be clean.

    if (newContent !== content) {
        fs.writeFileSync(envPath, newContent);
        console.log("Fixed .env.local with regex.");
    } else {
        console.log("No appName pattern match found. Appending it.");
        // If not found, maybe it's not there at all?
        // But the error says it IS "specified with no value".
        // Maybe it's `appName` without `=`?
        // e.g. `mongodb://...?foo&appName` 

        if (content.match(/([?&])appName(?![=])/)) {
            newContent = content.replace(/([?&])appName(?![=])/g, '$1appName=EchoPrompt');
            fs.writeFileSync(envPath, newContent);
            console.log("Fixed 'appName' without equals sign.");
        }
    }

} catch (e) {
    console.error("Failed to fix env:", e);
}
