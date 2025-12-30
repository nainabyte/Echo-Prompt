const fetch = require('http').get;

const url = 'http://localhost:3000/api/auth-debug';

fetch(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
    });
}).on('error', (err) => {
    console.log('Error:', err.message);
});
