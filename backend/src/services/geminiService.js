const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      logger.warn('GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  // Generate disaster analysis
  async analyzeDisaster(disasterData) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `
        Analyze the following disaster data and provide insights:
        
        Disaster Type: ${disasterData.type}
        Location: ${disasterData.location}
        Magnitude/Severity: ${disasterData.magnitude || disasterData.severity}
        Time: ${disasterData.time}
        Coordinates: ${disasterData.coordinates?.latitude}, ${disasterData.coordinates?.longitude}
        
        Please provide:
        1. Risk assessment for the region
        2. Potential impact on nearby areas
        3. Safety recommendations
        4. Emergency response suggestions
        5. Long-term monitoring advice
        
        Keep the response concise and actionable for emergency responders and the general public.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        analysis: text,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error in disaster analysis:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Chat with AI about disasters
  async chatWithAI(message, context = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const systemPrompt = `
        You are an AI assistant specialized in disaster management and emergency response for the Asia region. 
        You help users understand natural disasters, provide safety advice, and offer guidance on emergency preparedness.
        
        Current context:
        - Region: Asia
        - Focus: Natural disasters (earthquakes, storms, tsunamis, volcanic activity)
        - User role: ${context.userRole || 'General public'}
        - Recent disasters: ${context.recentDisasters || 'None specified'}
        
        Guidelines:
        1. Provide accurate, science-based information
        2. Always prioritize safety and emergency protocols
        3. Be clear about immediate actions vs. long-term planning
        4. Include relevant contact information for emergency services when appropriate
        5. If you're unsure about something, say so and recommend consulting official sources
        6. Keep responses concise but comprehensive
      `;

      const fullPrompt = `${systemPrompt}\n\nUser question: ${message}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error in AI chat:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate emergency response plan
  async generateEmergencyPlan(disasterType, location, severity) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `
        Generate a comprehensive emergency response plan for:
        
        Disaster Type: ${disasterType}
        Location: ${location}
        Severity Level: ${severity}
        
        Please provide:
        1. Immediate actions (first 24 hours)
        2. Short-term response (1-7 days)
        3. Medium-term recovery (1-4 weeks)
        4. Long-term planning (1+ months)
        5. Resource requirements
        6. Communication protocols
        7. Evacuation procedures (if applicable)
        8. Safety checklists
        
        Format the response as a structured emergency response plan suitable for emergency management teams.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        plan: text,
        disasterType,
        location,
        severity,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error generating emergency plan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analyze disaster trends
  async analyzeTrends(disasterData) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `
        Analyze the following disaster data for trends and patterns:
        
        ${JSON.stringify(disasterData, null, 2)}
        
        Please provide:
        1. Key trends observed
        2. Seasonal patterns (if any)
        3. Geographic hotspots
        4. Severity patterns
        5. Predictions for the next 30 days
        6. Recommendations for preparedness
        7. Areas of concern
        
        Focus on actionable insights for disaster preparedness and response planning.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        analysis: text,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error analyzing trends:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate safety recommendations
  async generateSafetyRecommendations(disasterType, userLocation) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `
        Generate personalized safety recommendations for:
        
        Disaster Type: ${disasterType}
        User Location: ${userLocation}
        
        Please provide:
        1. Immediate safety measures
        2. Emergency kit recommendations
        3. Evacuation planning
        4. Communication strategies
        5. Home/office safety preparations
        6. Community resources
        7. Warning signs to watch for
        8. Recovery planning
        
        Make the recommendations specific to the user's location and the disaster type.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        recommendations: text,
        disasterType,
        userLocation,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error generating safety recommendations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enhance V2V message with AI
  async enhanceV2VMessage(originalMessage, context = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `
        You are an AI assistant specialized in Vehicle-to-Vehicle (V2V) communication for disaster response and emergency coordination in Asia.
        
        Original Message: "${originalMessage}"
        
        Context:
        - Sender Vehicle: ${context.senderVehicle ? JSON.stringify(context.senderVehicle, null, 2) : 'Unknown'}
        - Target Vehicle: ${context.targetVehicle ? JSON.stringify(context.targetVehicle, null, 2) : 'Unknown'}
        - Message Type: ${context.messageType || 'v2v_communication'}
        - Region: ${context.region || 'Asia'}
        - User ID: ${context.userId || 'Unknown'}
        
        Please enhance this V2V message by:
        1. Making it more clear and professional for emergency communication
        2. Adding relevant context about the current situation if applicable
        3. Including appropriate urgency indicators
        4. Ensuring it follows V2V communication protocols
        5. Making it concise but informative
        6. Adding any relevant safety information
        
        Respond with a JSON object containing:
        {
          "enhancedMessage": "The improved message text",
          "insights": "Brief insights about the message context or recommendations",
          "urgency": "low|medium|high|critical",
          "messageType": "info|warning|emergency|coordination"
        }
        
        Keep the enhanced message concise (under 200 characters) and professional.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            enhancedMessage: parsed.enhancedMessage || originalMessage,
            insights: parsed.insights || '',
            urgency: parsed.urgency || 'medium',
            messageType: parsed.messageType || 'info',
            timestamp: new Date()
          };
        }
      } catch (parseError) {
        logger.warn('Failed to parse AI response as JSON:', parseError);
      }

      // Fallback: return the text as enhanced message
      return {
        success: true,
        enhancedMessage: text.trim(),
        insights: 'AI-enhanced message',
        urgency: 'medium',
        messageType: 'info',
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Error enhancing V2V message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate AI response for V2V conversation
  async generateV2VResponse(originalMessage, context = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const prompt = `
        You are an AI assistant for Vehicle-to-Vehicle communication in disaster response scenarios.
        
        Original Message: "${originalMessage}"
        
        Context:
        - Region: ${context.region || 'Asia'}
        - Message Type: ${context.messageType || 'v2v_communication'}
        - Sender Context: ${context.senderContext || 'Emergency vehicle communication'}
        
        Generate an appropriate AI response that:
        1. Acknowledges the message
        2. Provides relevant information or assistance
        3. Maintains professional emergency communication standards
        4. Is concise and clear
        5. Includes any relevant safety or coordination information
        
        Keep the response under 150 characters and professional.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        response: text.trim(),
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Error generating V2V response:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new GeminiService();

