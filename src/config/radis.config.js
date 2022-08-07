const { createClient } = require("redis");
require('dotenv').config();

try {
    const client = createClient({
        url: process.env.RADIS
    });

    client.connect()
        .then(_ => console.log("✅ Redis is connected!"))
        .catch(e => console.log("⚠️ Redis Error: ", e.message));

    module.exports = client

} catch (e) {
    console.log(e)
}

/*
    const s = await client.setEx('key', 60, 'value')
    const s = await client.set('key', 'value')
    const s = await client.get('key')
*/