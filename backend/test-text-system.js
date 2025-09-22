#!/usr/bin/env node

/**
 * Text-to-Text System Test Script
 * 
 * This script tests the AI-enhanced text communication system
 * Run with: node test-text-system.js
 */

// Load environment variables
require('dotenv').config();

const geminiService = require('./src/services/geminiService');
const v2vService = require('./src/services/v2vService');

async function testTextSystem() {
  console.log('💬 Testing Text-to-Text AI System...\n');

  try {
    // Test 1: V2V Message Enhancement
    console.log('1. Testing V2V message enhancement...');
    const testMessage = 'Help needed at location';
    const context = {
      senderVehicle: {
        vehicleType: 'emergency',
        make: 'Toyota',
        model: 'Ambulance',
        location: { latitude: 35.6762, longitude: 139.6503 }
      },
      targetVehicle: {
        vehicleType: 'emergency',
        make: 'Honda',
        model: 'Fire Truck',
        location: { latitude: 35.6800, longitude: 139.6900 }
      },
      messageType: 'emergency',
      region: 'Asia',
      userId: 'test-user-123'
    };

    const enhanceResult = await geminiService.enhanceV2VMessage(testMessage, context);
    if (enhanceResult.success) {
      console.log('✅ V2V message enhancement successful');
      console.log(`   Original: "${testMessage}"`);
      console.log(`   Enhanced: "${enhanceResult.enhancedMessage}"`);
      console.log(`   Insights: "${enhanceResult.insights}"`);
      console.log(`   Urgency: ${enhanceResult.urgency}`);
      console.log(`   Type: ${enhanceResult.messageType}`);
    } else {
      console.log(`❌ V2V enhancement failed: ${enhanceResult.error}`);
    }

    // Test 2: V2V Response Generation
    console.log('\n2. Testing V2V response generation...');
    const responseMessage = 'Emergency vehicle requesting assistance';
    const responseContext = {
      region: 'Asia',
      messageType: 'v2v_communication',
      senderContext: 'Emergency vehicle communication'
    };

    const responseResult = await geminiService.generateV2VResponse(responseMessage, responseContext);
    if (responseResult.success) {
      console.log('✅ V2V response generation successful');
      console.log(`   Input: "${responseMessage}"`);
      console.log(`   AI Response: "${responseResult.response}"`);
    } else {
      console.log(`❌ V2V response generation failed: ${responseResult.error}`);
    }

    // Test 3: Disaster Analysis
    console.log('\n3. Testing disaster analysis...');
    const disasterData = {
      type: 'earthquake',
      location: 'Tokyo, Japan',
      magnitude: 6.5,
      time: new Date(),
      coordinates: { latitude: 35.6762, longitude: 139.6503 }
    };

    const analysisResult = await geminiService.analyzeDisaster(disasterData);
    if (analysisResult.success) {
      console.log('✅ Disaster analysis successful');
      console.log(`   Analysis length: ${analysisResult.analysis.length} characters`);
      console.log(`   Preview: "${analysisResult.analysis.substring(0, 100)}..."`);
    } else {
      console.log(`❌ Disaster analysis failed: ${analysisResult.error}`);
    }

    // Test 4: Safety Recommendations
    console.log('\n4. Testing safety recommendations...');
    const safetyResult = await geminiService.generateSafetyRecommendations('earthquake', 'Tokyo, Japan');
    if (safetyResult.success) {
      console.log('✅ Safety recommendations generated');
      console.log(`   Recommendations length: ${safetyResult.recommendations.length} characters`);
      console.log(`   Preview: "${safetyResult.recommendations.substring(0, 100)}..."`);
    } else {
      console.log(`❌ Safety recommendations failed: ${safetyResult.error}`);
    }

    console.log('\n🎉 Text-to-text AI system test completed!');
    console.log('\nNote: These tests require a valid GEMINI_API_KEY in your environment variables.');
    console.log('Make sure to set up your Gemini API key before running these tests.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testTextSystem().catch(console.error);
}

module.exports = { testTextSystem };
