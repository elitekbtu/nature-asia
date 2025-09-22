#!/usr/bin/env node

// Simple setup test for Nature Asia Backend
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Nature Asia Backend Setup...\n');

// Check required files
const requiredFiles = [
    'package.json',
    'src/server.js',
    'src/config/firebase.js',
    'src/services/disasterService.js',
    'src/services/geminiService.js',
    'src/services/v2vService.js',
    'src/services/analyticsService.js',
    'firebase.config.json'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

// Check environment variables
console.log('\n🔧 Checking environment setup...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['GEMINI_API_KEY', 'OPENWEATHER_API_KEY'];
    
    requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
            console.log(`✅ ${varName} configured`);
        } else {
            console.log(`⚠️  ${varName} not configured`);
        }
    });
} else {
    console.log('❌ .env file not found - run: cp env.example .env');
    allFilesExist = false;
}

// Check Firebase config
console.log('\n🔥 Checking Firebase configuration...');
const firebaseConfigPath = path.join(__dirname, 'firebase.config.json');
if (fs.existsSync(firebaseConfigPath)) {
    try {
        const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
        if (firebaseConfig.project_id && firebaseConfig.private_key) {
            console.log('✅ Firebase configuration valid');
        } else {
            console.log('❌ Firebase configuration incomplete');
            allFilesExist = false;
        }
    } catch (error) {
        console.log('❌ Firebase configuration invalid JSON');
        allFilesExist = false;
    }
} else {
    console.log('❌ firebase.config.json not found');
    allFilesExist = false;
}

// Check logs directory
console.log('\n📝 Checking logs directory...');
const logsDir = path.join(__dirname, 'logs');
if (fs.existsSync(logsDir)) {
    console.log('✅ Logs directory exists');
} else {
    console.log('⚠️  Logs directory will be created on first run');
}

// Summary
console.log('\n📊 Setup Summary:');
if (allFilesExist) {
    console.log('🎉 All required files are present!');
    console.log('\n🚀 To start the server:');
    console.log('   Development: npm run dev');
    console.log('   Production:  npm start');
    console.log('   Or use:      ./start.sh');
} else {
    console.log('❌ Some files are missing. Please check the errors above.');
    console.log('\n🔧 Quick setup:');
    console.log('   1. cp env.example .env');
    console.log('   2. Update .env with your API keys');
    console.log('   3. npm install');
    console.log('   4. npm run dev');
}

console.log('\n📚 For more information, see README.md');

