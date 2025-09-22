const express = require('express');
const { body, query, validationResult } = require('express-validator');
const geminiService = require('../services/geminiService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Send a message to AI chat
 *     description: Sends a message to the AI chat system and receives an AI-generated response
 *     tags: [AI Chat]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message to send to the AI
 *                 example: "What should I do if there's an earthquake?"
 *               context:
 *                 type: object
 *                 description: Additional context for the AI response
 *                 properties:
 *                   location:
 *                     type: string
 *                     example: "Tokyo, Japan"
 *                   disasterType:
 *                     type: string
 *                     example: "earthquake"
 *                   severity:
 *                     type: string
 *                     example: "medium"
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 response:
 *                   type: string
 *                   description: AI-generated response
 *                   example: "During an earthquake, drop, cover, and hold on. Stay away from windows and heavy objects that could fall."
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/message', [
  authenticateToken,
  body('message').notEmpty().withMessage('Message is required'),
  body('context').optional().isObject().withMessage('Context must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, context = {} } = req.body;
    const firestore = getFirestore();

    // Get user context
    const userDoc = await firestore.collection('users').doc(req.user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    const chatContext = {
      ...context,
      userRole: userData.role || 'General public',
      userLocation: userData.location || 'Asia',
      preferences: userData.preferences || {}
    };

    const aiResponse = await geminiService.chatWithAI(message, chatContext);

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        error: aiResponse.error
      });
    }

    // Save chat history
    const chatData = {
      userId: req.user.uid,
      message,
      response: aiResponse.response,
      context: chatContext,
      timestamp: new Date(),
      type: 'chat'
    };

    await firestore.collection('chat_history').add(chatData);

    res.json({
      success: true,
      response: aiResponse.response,
      timestamp: aiResponse.timestamp
    });

  } catch (error) {
    logger.error('Error in chat message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

/**
 * @swagger
 * /api/chat/analyze-disaster:
 *   post:
 *     summary: Analyze a specific disaster
 *     description: Uses AI to analyze disaster data and provide insights
 *     tags: [AI Chat]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - disasterData
 *             properties:
 *               disasterData:
 *                 type: object
 *                 description: Disaster data to analyze
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "earthquake"
 *                   magnitude:
 *                     type: number
 *                     example: 6.5
 *                   location:
 *                     type: object
 *                     properties:
 *                       latitude:
 *                         type: number
 *                         example: 35.6762
 *                       longitude:
 *                         type: number
 *                         example: 139.6503
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T10:30:00.000Z"
 *     responses:
 *       200:
 *         description: Disaster analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analysis:
 *                   type: object
 *                   properties:
 *                     severity:
 *                       type: string
 *                       example: "high"
 *                     impact:
 *                       type: string
 *                       example: "Moderate to severe damage expected in affected areas"
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Evacuate low-lying areas", "Avoid damaged buildings"]
 *                     affectedArea:
 *                       type: object
 *                       properties:
 *                         radius:
 *                           type: number
 *                           example: 50
 *                         population:
 *                           type: integer
 *                           example: 100000
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/analyze-disaster', [
  authenticateToken,
  body('disasterData').isObject().withMessage('Disaster data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { disasterData } = req.body;
    const firestore = getFirestore();

    const analysis = await geminiService.analyzeDisaster(disasterData);

    if (!analysis.success) {
      return res.status(500).json({
        success: false,
        error: analysis.error
      });
    }

    // Save analysis
    const analysisData = {
      userId: req.user.uid,
      disasterData,
      analysis: analysis.analysis,
      timestamp: new Date(),
      type: 'disaster_analysis'
    };

    await firestore.collection('ai_analyses').add(analysisData);

    res.json({
      success: true,
      analysis: analysis.analysis,
      timestamp: analysis.timestamp
    });

  } catch (error) {
    logger.error('Error analyzing disaster:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze disaster'
    });
  }
});

/**
 * @swagger
 * /api/chat/emergency-plan:
 *   post:
 *     summary: Generate emergency response plan
 *     description: Generates a comprehensive emergency response plan for a specific disaster scenario
 *     tags: [AI Chat]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - disasterType
 *               - location
 *               - severity
 *             properties:
 *               disasterType:
 *                 type: string
 *                 enum: [earthquake, tsunami, volcanic, weather]
 *                 description: Type of disaster
 *                 example: "earthquake"
 *               location:
 *                 type: string
 *                 description: Location of the disaster
 *                 example: "Tokyo, Japan"
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Severity level of the disaster
 *                 example: "high"
 *     responses:
 *       200:
 *         description: Emergency plan generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 plan:
 *                   type: object
 *                   properties:
 *                     immediateActions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Evacuate to designated safe zones", "Activate emergency services"]
 *                     shortTermActions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Assess damage", "Set up emergency shelters"]
 *                     longTermActions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Rebuild infrastructure", "Provide psychological support"]
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Emergency medical teams", "Heavy machinery", "Food supplies"]
 *                     timeline:
 *                       type: object
 *                       properties:
 *                         immediate:
 *                           type: string
 *                           example: "0-2 hours"
 *                         shortTerm:
 *                           type: string
 *                           example: "2-48 hours"
 *                         longTerm:
 *                           type: string
 *                           example: "48+ hours"
 *                 disasterType:
 *                   type: string
 *                   example: "earthquake"
 *                 location:
 *                   type: string
 *                   example: "Tokyo, Japan"
 *                 severity:
 *                   type: string
 *                   example: "high"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/emergency-plan', [
  authenticateToken,
  body('disasterType').notEmpty().withMessage('Disaster type is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('severity').notEmpty().withMessage('Severity is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { disasterType, location, severity } = req.body;
    const firestore = getFirestore();

    const plan = await geminiService.generateEmergencyPlan(disasterType, location, severity);

    if (!plan.success) {
      return res.status(500).json({
        success: false,
        error: plan.error
      });
    }

    // Save emergency plan
    const planData = {
      userId: req.user.uid,
      disasterType,
      location,
      severity,
      plan: plan.plan,
      timestamp: new Date(),
      type: 'emergency_plan'
    };

    await firestore.collection('emergency_plans').add(planData);

    res.json({
      success: true,
      plan: plan.plan,
      disasterType,
      location,
      severity,
      timestamp: plan.timestamp
    });

  } catch (error) {
    logger.error('Error generating emergency plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate emergency plan'
    });
  }
});

/**
 * @swagger
 * /api/chat/safety-recommendations:
 *   post:
 *     summary: Get safety recommendations
 *     description: Generates personalized safety recommendations based on disaster type and user location
 *     tags: [AI Chat]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - disasterType
 *               - userLocation
 *             properties:
 *               disasterType:
 *                 type: string
 *                 enum: [earthquake, tsunami, volcanic, weather]
 *                 description: Type of disaster
 *                 example: "earthquake"
 *               userLocation:
 *                 type: string
 *                 description: User's current location
 *                 example: "Tokyo, Japan"
 *     responses:
 *       200:
 *         description: Safety recommendations generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         example: "immediate"
 *                       action:
 *                         type: string
 *                         example: "Drop, cover, and hold on"
 *                       priority:
 *                         type: string
 *                         enum: [low, medium, high, critical]
 *                         example: "high"
 *                       description:
 *                         type: string
 *                         example: "Get under a sturdy table and hold on until shaking stops"
 *                 disasterType:
 *                   type: string
 *                   example: "earthquake"
 *                 userLocation:
 *                   type: string
 *                   example: "Tokyo, Japan"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/safety-recommendations', [
  authenticateToken,
  body('disasterType').notEmpty().withMessage('Disaster type is required'),
  body('userLocation').notEmpty().withMessage('User location is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { disasterType, userLocation } = req.body;

    const recommendations = await geminiService.generateSafetyRecommendations(disasterType, userLocation);

    if (!recommendations.success) {
      return res.status(500).json({
        success: false,
        error: recommendations.error
      });
    }

    res.json({
      success: true,
      recommendations: recommendations.recommendations,
      disasterType,
      userLocation,
      timestamp: recommendations.timestamp
    });

  } catch (error) {
    logger.error('Error generating safety recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate safety recommendations'
    });
  }
});

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Get user's chat history
 *     description: Retrieves the user's chat history with optional filtering by type
 *     tags: [AI Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of history entries to return
 *         example: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [chat, disaster_analysis, emergency_plan]
 *         description: Filter by chat type
 *         example: "chat"
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "chat-history-123"
 *                       userId:
 *                         type: string
 *                         example: "firebase-user-id"
 *                       message:
 *                         type: string
 *                         example: "What should I do during an earthquake?"
 *                       response:
 *                         type: string
 *                         example: "During an earthquake, drop, cover, and hold on..."
 *                       type:
 *                         type: string
 *                         example: "chat"
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *                   description: Number of history entries returned
 *                   example: 10
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/history', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['chat', 'disaster_analysis', 'emergency_plan']).withMessage('Invalid type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { limit = 20, type } = req.query;
    const firestore = getFirestore();

    let query = firestore.collection('chat_history')
      .where('userId', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: history,
      count: history.length
    });

  } catch (error) {
    logger.error('Error fetching chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history'
    });
  }
});

/**
 * @swagger
 * /api/chat/history/{id}:
 *   delete:
 *     summary: Delete a specific chat history entry
 *     description: Deletes a specific chat history entry for the authenticated user
 *     tags: [AI Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat history entry to delete
 *         example: "chat-history-123"
 *     responses:
 *       200:
 *         description: Chat history entry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       403:
 *         description: Unauthorized to delete this entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat history entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/history/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const firestore = getFirestore();

    const doc = await firestore.collection('chat_history').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Chat history entry not found'
      });
    }

    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this entry'
      });
    }

    await firestore.collection('chat_history').doc(id).delete();

    res.json({
      success: true,
      message: 'Chat history entry deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting chat history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete chat history entry'
    });
  }
});

module.exports = router;
