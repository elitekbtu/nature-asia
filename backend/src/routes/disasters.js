const express = require('express');
const { query, validationResult } = require('express-validator');
const disasterService = require('../services/disasterService');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/disasters:
 *   get:
 *     summary: Get all disaster data
 *     description: Retrieves disaster data with optional filtering by type, severity, and time range
 *     tags: [Disasters]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [earthquake, weather, tsunami, volcanic]
 *         description: Filter by disaster type
 *         example: earthquake
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity level
 *         example: high
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of results to return
 *         example: 25
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *         description: Number of days to look back for data
 *         example: 7
 *     responses:
 *       200:
 *         description: Disaster data retrieved successfully
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
 *                     $ref: '#/components/schemas/Disaster'
 *                 count:
 *                   type: integer
 *                   example: 25
 *                 filters:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     severity:
 *                       type: string
 *                     limit:
 *                       type: integer
 *                     days:
 *                       type: integer
 *                 lastUpdated:
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
router.get('/', [
  query('type').optional().isIn(['earthquake', 'weather', 'tsunami', 'volcanic']).withMessage('Invalid disaster type'),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { type, severity, limit = 50, days = 7 } = req.query;
    
    let disasters;
    
    if (type === 'earthquake') {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);
      disasters = await disasterService.getEarthquakes(
        startTime.toISOString(),
        endTime.toISOString()
      );
    } else if (type === 'weather') {
      disasters = await disasterService.getWeatherAlerts();
    } else if (type === 'tsunami') {
      disasters = await disasterService.getTsunamiWarnings();
    } else if (type === 'volcanic') {
      disasters = await disasterService.getVolcanicActivity();
    } else {
      disasters = await disasterService.getAllDisasters();
    }

    if (!disasters.success) {
      return res.status(500).json({
        success: false,
        error: disasters.error
      });
    }

    let filteredData = disasters.data;

    // Apply severity filter
    if (severity) {
      filteredData = filteredData.filter(disaster => disaster.severity === severity);
    }

    // Apply limit
    filteredData = filteredData.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: filteredData,
      count: filteredData.length,
      filters: { type, severity, limit, days },
      lastUpdated: disasters.lastUpdated
    });

  } catch (error) {
    logger.error('Error fetching disasters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch disaster data'
    });
  }
});

/**
 * @swagger
 * /api/disasters/stats:
 *   get:
 *     summary: Get disaster statistics
 *     description: Retrieves comprehensive disaster statistics and analytics
 *     tags: [Disasters]
 *     security: []
 *     responses:
 *       200:
 *         description: Disaster statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Analytics'
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const stats = await disasterService.getDisasterStats();

    if (!stats.success) {
      return res.status(500).json({
        success: false,
        error: stats.error
      });
    }

    res.json({
      success: true,
      data: stats.data,
      lastUpdated: stats.lastUpdated
    });

  } catch (error) {
    logger.error('Error fetching disaster stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch disaster statistics'
    });
  }
});

/**
 * @swagger
 * /api/disasters/earthquakes:
 *   get:
 *     summary: Get earthquake data specifically
 *     description: Retrieves earthquake data with optional filtering by magnitude and time range
 *     tags: [Disasters]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: minMagnitude
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 10
 *           default: 4.0
 *         description: Minimum earthquake magnitude to include
 *         example: 5.0
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 30
 *           default: 7
 *         description: Number of days to look back for data
 *         example: 7
 *     responses:
 *       200:
 *         description: Earthquake data retrieved successfully
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
 *                     $ref: '#/components/schemas/Disaster'
 *                 count:
 *                   type: integer
 *                   example: 15
 *                 filters:
 *                   type: object
 *                   properties:
 *                     minMagnitude:
 *                       type: number
 *                       example: 5.0
 *                     days:
 *                       type: integer
 *                       example: 7
 *                 lastUpdated:
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
router.get('/earthquakes', [
  query('minMagnitude').optional().isFloat({ min: 0, max: 10 }).withMessage('Min magnitude must be between 0 and 10'),
  query('days').optional().isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30')
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { minMagnitude = 4.0, days = 7 } = req.query;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

    const earthquakes = await disasterService.getEarthquakes(
      startTime.toISOString(),
      endTime.toISOString(),
      parseFloat(minMagnitude)
    );

    if (!earthquakes.success) {
      return res.status(500).json({
        success: false,
        error: earthquakes.error
      });
    }

    res.json({
      success: true,
      data: earthquakes.data,
      count: earthquakes.data.length,
      filters: { minMagnitude, days },
      lastUpdated: new Date()
    });

  } catch (error) {
    logger.error('Error fetching earthquakes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch earthquake data'
    });
  }
});

/**
 * @swagger
 * /api/disasters/weather:
 *   get:
 *     summary: Get weather alerts
 *     description: Retrieves current weather alerts and warnings
 *     tags: [Disasters]
 *     security: []
 *     responses:
 *       200:
 *         description: Weather alerts retrieved successfully
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
 *                     $ref: '#/components/schemas/Disaster'
 *                 count:
 *                   type: integer
 *                   example: 8
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/weather', optionalAuth, async (req, res) => {
  try {
    const weatherAlerts = await disasterService.getWeatherAlerts();

    if (!weatherAlerts.success) {
      return res.status(500).json({
        success: false,
        error: weatherAlerts.error
      });
    }

    res.json({
      success: true,
      data: weatherAlerts.data,
      count: weatherAlerts.data.length,
      lastUpdated: new Date()
    });

  } catch (error) {
    logger.error('Error fetching weather alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather alerts'
    });
  }
});

/**
 * @swagger
 * /api/disasters/tsunami:
 *   get:
 *     summary: Get tsunami warnings
 *     description: Retrieves current tsunami warnings and alerts
 *     tags: [Disasters]
 *     security: []
 *     responses:
 *       200:
 *         description: Tsunami warnings retrieved successfully
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
 *                     $ref: '#/components/schemas/Disaster'
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/tsunami', optionalAuth, async (req, res) => {
  try {
    const tsunamiWarnings = await disasterService.getTsunamiWarnings();

    if (!tsunamiWarnings.success) {
      return res.status(500).json({
        success: false,
        error: tsunamiWarnings.error
      });
    }

    res.json({
      success: true,
      data: tsunamiWarnings.data,
      count: tsunamiWarnings.data.length,
      lastUpdated: new Date()
    });

  } catch (error) {
    logger.error('Error fetching tsunami warnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tsunami warnings'
    });
  }
});

/**
 * @swagger
 * /api/disasters/volcanic:
 *   get:
 *     summary: Get volcanic activity
 *     description: Retrieves current volcanic activity and alerts
 *     tags: [Disasters]
 *     security: []
 *     responses:
 *       200:
 *         description: Volcanic activity retrieved successfully
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
 *                     $ref: '#/components/schemas/Disaster'
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/volcanic', optionalAuth, async (req, res) => {
  try {
    const volcanicActivity = await disasterService.getVolcanicActivity();

    if (!volcanicActivity.success) {
      return res.status(500).json({
        success: false,
        error: volcanicActivity.error
      });
    }

    res.json({
      success: true,
      data: volcanicActivity.data,
      count: volcanicActivity.data.length,
      lastUpdated: new Date()
    });

  } catch (error) {
    logger.error('Error fetching volcanic activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch volcanic activity'
    });
  }
});

module.exports = router;

