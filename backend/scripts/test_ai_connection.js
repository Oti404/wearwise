'use strict';

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const aiService = require('../services/aiService');
const fs = require('fs');

async function testConnection() {
    console.log('🧪 Testing connection to Hugging Face AI Engine...');
    console.log(`🔗 URL: ${process.env.AI_ENGINE_URL}`);
    console.log(`🔑 Token: ${process.env.HF_TOKEN ? 'Present (Hidden)' : 'MISSING'}\n`);

    if (!process.env.AI_ENGINE_URL) {
        console.error('❌ Error: AI_ENGINE_URL is not set in .env');
        process.exit(1);
    }

    // Use a valid 10x10 white pixel PNG to ensure PIL can load it
    const pixelBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAYSURBVHgB7cEBDQAAAMKg909tDwcUAAAAfAMUBAAEST9L0AAAAAElFTkSuQmCC"; 
    const buffer = Buffer.from(pixelBase64, 'base64');

    try {
        console.log('🏥 Checking AI Engine health...');
        const healthHeaders = process.env.HF_TOKEN ? { 'Authorization': `Bearer ${process.env.HF_TOKEN}` } : {};
        const health = await axios.get(`${process.env.AI_ENGINE_URL}/health`, { headers: healthHeaders });
        console.log('✅ Health check passed!', health.data);

        console.log('\n📡 Sending test classification request...');
        // Sending the buffer to aiService to test the bridge
        const result = await aiService.analyzeImage(buffer, 'test-pixel.png', 'image/png');
        
        console.log('✅ Response received!');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('❌ Connection failed!');
        console.error(`Error: ${err.message}`);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response headers:', JSON.stringify(err.response.headers, null, 2));
            console.error('Response body:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testConnection();
