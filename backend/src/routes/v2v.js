const express = require('express');
const { body, query, validationResult } = require('express-validator');
const v2vService = require('../services/v2vService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/v2v/register:
 *   post:
 *     summary: Register a new vehicle
 *     description: Registers a new vehicle for V2V communication in the system
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleType
 *               - make
 *               - model
 *               - year
 *               - location
 *             properties:
 *               vehicleType:
 *                 type: string
 *                 enum: [car, truck, motorcycle, bus, emergency]
 *                 description: Type of vehicle
 *                 example: car
 *               make:
 *                 type: string
 *                 description: Vehicle manufacturer
 *                 example: Toyota
 *               model:
 *                 type: string
 *                 description: Vehicle model
 *                 example: Camry
 *               year:
 *                 type: integer
 *                 minimum: 1900
 *                 maximum: 2025
 *                 description: Manufacturing year
 *                 example: 2023
 *               location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     description: Latitude coordinate
 *                     example: 35.6762
 *                   longitude:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     description: Longitude coordinate
 *                     example: 139.6503
 *                   heading:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 360
 *                     description: Vehicle heading in degrees
 *                     example: 45
 *                   speed:
 *                     type: number
 *                     minimum: 0
 *                     description: Vehicle speed in km/h
 *                     example: 60
 *     responses:
 *       201:
 *         description: Vehicle registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 vehicleId:
 *                   type: string
 *                   example: "vehicle-123"
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
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
router.post('/register', [
  authenticateToken,
  body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('make').notEmpty().withMessage('Vehicle make is required'),
  body('model').notEmpty().withMessage('Vehicle model is required'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  body('location.latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
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

    const vehicleData = {
      ...req.body,
      userId: req.user.uid,
      ownerEmail: req.user.email
    };

    const result = await v2vService.registerVehicle(vehicleData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      vehicleId: result.vehicleId,
      data: result.data
    });

  } catch (error) {
    logger.error('Error registering vehicle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register vehicle'
    });
  }
});

/**
 * @swagger
 * /api/v2v/{vehicleId}/location:
 *   put:
 *     summary: Update vehicle location
 *     description: Updates the current location, heading, and speed of a registered vehicle
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vehicle to update
 *         example: "vehicle-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: New latitude coordinate
 *                 example: 35.6762
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: New longitude coordinate
 *                 example: 139.6503
 *               heading:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 360
 *                 description: Vehicle heading in degrees
 *                 example: 45
 *               speed:
 *                 type: number
 *                 minimum: 0
 *                 description: Vehicle speed in km/h
 *                 example: 60
 *     responses:
 *       200:
 *         description: Vehicle location updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehicle not found
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
router.put('/:vehicleId/location', [
  authenticateToken,
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('Invalid heading'),
  body('speed').optional().isFloat({ min: 0 }).withMessage('Invalid speed')
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

    const { vehicleId } = req.params;
    const locationData = {
      location: {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        heading: req.body.heading || 0,
        speed: req.body.speed || 0
      }
    };

    const result = await v2vService.updateVehicleLocation(vehicleId, locationData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    logger.error('Error updating vehicle location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vehicle location'
    });
  }
});

/**
 * @swagger
 * /api/v2v/{vehicleId}/message:
 *   post:
 *     summary: Send V2V message with AI enhancement
 *     description: Sends a message from one vehicle to another with optional AI enhancement
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the sending vehicle
 *         example: "vehicle-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetVehicleId
 *               - message
 *             properties:
 *               targetVehicleId:
 *                 type: string
 *                 description: ID of the target vehicle
 *                 example: "vehicle-456"
 *               message:
 *                 type: string
 *                 description: Message content
 *                 example: "Traffic jam ahead, consider alternative route"
 *               type:
 *                 type: string
 *                 enum: [info, warning, emergency]
 *                 default: info
 *                 description: Type of message
 *                 example: info
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: Message priority
 *                 example: medium
 *               useAI:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to use AI enhancement
 *                 example: true
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messageId:
 *                   type: string
 *                   example: "msg-123"
 *                 data:
 *                   $ref: '#/components/schemas/V2VMessage'
 *                 aiEnhanced:
 *                   type: boolean
 *                   example: true
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
router.post('/:vehicleId/message', [
  authenticateToken,
  body('targetVehicleId').notEmpty().withMessage('Target vehicle ID is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['info', 'warning', 'emergency']).withMessage('Invalid message type'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('useAI').optional().isBoolean().withMessage('Use AI must be boolean')
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

    const { vehicleId } = req.params;
    const { targetVehicleId, message, type = 'info', priority = 'medium', useAI = true } = req.body;

    let result;

    if (useAI) {
      // Use AI-enhanced text messaging
      result = await v2vService.processTextMessageWithAI(vehicleId, targetVehicleId, message, {
        userId: req.user.uid,
        messageType: type,
        priority: priority
      });
    } else {
      // Send regular text message
      const messageData = {
        targetVehicleId,
        message,
        type,
        priority,
        aiEnhanced: false,
        senderInfo: {
          vehicleId,
          userId: req.user.uid
        }
      };
      result = await v2vService.sendV2VMessage(vehicleId, messageData);
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      data: result.data,
      aiEnhanced: useAI
    });

  } catch (error) {
    logger.error('Error sending V2V message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send V2V message'
    });
  }
});

/**
 * @swagger
 * /api/v2v/{vehicleId}/emergency:
 *   post:
 *     summary: Broadcast emergency message
 *     description: Broadcasts an emergency message to all nearby vehicles
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vehicle broadcasting the emergency
 *         example: "vehicle-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emergencyType
 *               - description
 *               - severity
 *             properties:
 *               emergencyType:
 *                 type: string
 *                 description: Type of emergency
 *                 example: "accident"
 *               description:
 *                 type: string
 *                 description: Detailed description of the emergency
 *                 example: "Multi-vehicle accident on highway, avoid area"
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Severity level of the emergency
 *                 example: "high"
 *               location:
 *                 type: object
 *                 description: Emergency location (optional, uses vehicle location if not provided)
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 35.6762
 *                   longitude:
 *                     type: number
 *                     example: 139.6503
 *     responses:
 *       200:
 *         description: Emergency message broadcast successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messageId:
 *                   type: string
 *                   example: "emergency-msg-123"
 *                 broadcastCount:
 *                   type: integer
 *                   description: Number of vehicles that received the message
 *                   example: 15
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
router.post('/:vehicleId/emergency', [
  authenticateToken,
  body('emergencyType').notEmpty().withMessage('Emergency type is required'),
  body('description').notEmpty().withMessage('Emergency description is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level')
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

    const { vehicleId } = req.params;
    const emergencyData = {
      emergencyType: req.body.emergencyType,
      description: req.body.description,
      severity: req.body.severity,
      location: req.body.location,
      senderInfo: {
        vehicleId,
        userId: req.user.uid
      }
    };

    const result = await v2vService.broadcastEmergencyMessage(vehicleId, emergencyData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      messageId: result.messageId,
      broadcastCount: result.broadcastCount
    });

  } catch (error) {
    logger.error('Error broadcasting emergency message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast emergency message'
    });
  }
});

/**
 * @swagger
 * /api/v2v/{vehicleId}/nearby:
 *   get:
 *     summary: Get nearby vehicles
 *     description: Retrieves a list of vehicles within a specified radius of the given vehicle
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vehicle to find nearby vehicles for
 *         example: "vehicle-123"
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           minimum: 0.1
 *           maximum: 100
 *           default: 10
 *         description: Search radius in kilometers
 *         example: 5
 *     responses:
 *       200:
 *         description: Nearby vehicles retrieved successfully
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
 *                     $ref: '#/components/schemas/Vehicle'
 *                 count:
 *                   type: integer
 *                   description: Number of nearby vehicles found
 *                   example: 5
 *                 radius:
 *                   type: number
 *                   description: Search radius used
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
router.get('/:vehicleId/nearby', [
  query('radius').optional().isFloat({ min: 0.1, max: 100 }).withMessage('Radius must be between 0.1 and 100 km')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { vehicleId } = req.params;
    const radius = parseFloat(req.query.radius) || 10;

    const result = await v2vService.getNearbyVehicles(vehicleId, radius);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      count: result.count,
      radius: result.radius
    });

  } catch (error) {
    logger.error('Error getting nearby vehicles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby vehicles'
    });
  }
});

/**
 * @swagger
 * /api/v2v/{vehicleId}/messages:
 *   get:
 *     summary: Get V2V messages for vehicle
 *     description: Retrieves recent V2V messages for a specific vehicle
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vehicle to get messages for
 *         example: "vehicle-123"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of messages to return
 *         example: 25
 *     responses:
 *       200:
 *         description: V2V messages retrieved successfully
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
 *                     $ref: '#/components/schemas/V2VMessage'
 *                 count:
 *                   type: integer
 *                   description: Number of messages returned
 *                   example: 25
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
router.get('/:vehicleId/messages', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { vehicleId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const result = await v2vService.getV2VMessages(vehicleId, limit);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      count: result.count
    });

  } catch (error) {
    logger.error('Error getting V2V messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get V2V messages'
    });
  }
});

/**
 * @swagger
 * /api/v2v/{vehicleId}/status:
 *   get:
 *     summary: Get vehicle status
 *     description: Retrieves the current status and information of a specific vehicle
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vehicle to get status for
 *         example: "vehicle-123"
 *     responses:
 *       200:
 *         description: Vehicle status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
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
router.get('/:vehicleId/status', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const result = await v2vService.getVehicleStatus(vehicleId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    logger.error('Error getting vehicle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get vehicle status'
    });
  }
});

/**
 * @swagger
 * /api/v2v/{vehicleId}/ai-response:
 *   post:
 *     summary: Generate AI response for V2V message
 *     description: Generates an AI-enhanced response for a V2V message
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the vehicle generating the response
 *         example: "vehicle-123"
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
 *                 description: The message to generate a response for
 *                 example: "Traffic jam ahead on highway"
 *               context:
 *                 type: object
 *                 description: Additional context for the AI response
 *                 properties:
 *                   location:
 *                     type: string
 *                     example: "Tokyo, Japan"
 *                   weather:
 *                     type: string
 *                     example: "rainy"
 *                   traffic:
 *                     type: string
 *                     example: "heavy"
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
 *                   example: "Thank you for the update. I'll take the alternative route via Route 1."
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
router.post('/:vehicleId/ai-response', [
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

    const { vehicleId } = req.params;
    const { message, context = {} } = req.body;

    const geminiService = require('../services/geminiService');
    const aiResponse = await geminiService.generateV2VResponse(message, {
      ...context,
      vehicleId,
      userId: req.user.uid,
      region: 'Asia'
    });

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        error: aiResponse.error
      });
    }

    res.json({
      success: true,
      response: aiResponse.response,
      timestamp: aiResponse.timestamp
    });

  } catch (error) {
    logger.error('Error generating AI response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI response'
    });
  }
});

/**
 * @swagger
 * /api/v2v/stats:
 *   get:
 *     summary: Get V2V system statistics
 *     description: Retrieves comprehensive statistics about the V2V communication system
 *     tags: [V2V Communication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: V2V statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVehicles:
 *                       type: integer
 *                       description: Total number of registered vehicles
 *                       example: 1250
 *                     activeVehicles:
 *                       type: integer
 *                       description: Number of currently active vehicles
 *                       example: 890
 *                     totalMessages:
 *                       type: integer
 *                       description: Total number of V2V messages sent
 *                       example: 15600
 *                     messagesLast24h:
 *                       type: integer
 *                       description: Messages sent in the last 24 hours
 *                       example: 450
 *                     emergencyMessages:
 *                       type: integer
 *                       description: Number of emergency messages broadcast
 *                       example: 12
 *                     averageResponseTime:
 *                       type: number
 *                       description: Average response time in milliseconds
 *                       example: 150.5
 *                     byVehicleType:
 *                       type: object
 *                       properties:
 *                         car:
 *                           type: integer
 *                           example: 800
 *                         truck:
 *                           type: integer
 *                           example: 200
 *                         emergency:
 *                           type: integer
 *                           example: 50
 *                     geographicDistribution:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                       example:
 *                         "Tokyo": 300
 *                         "Osaka": 250
 *                         "Kyoto": 150
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await v2vService.getV2VStats();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    logger.error('Error getting V2V stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get V2V statistics'
    });
  }
});

module.exports = router;

