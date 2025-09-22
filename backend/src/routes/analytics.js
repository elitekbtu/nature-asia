const express = require('express');
const { query, validationResult } = require('express-validator');
const analyticsService = require('../services/analyticsService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/analytics/disasters:
 *   get:
 *     summary: Get disaster analytics
 *     description: Retrieves comprehensive disaster analytics and statistics
 *     tags: [Analytics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d, 90d]
 *           default: 7d
 *         description: Time range for analytics
 *         example: 7d
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached data
 *         example: false
 *     responses:
 *       200:
 *         description: Disaster analytics retrieved successfully
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
router.get('/disasters', [
  query('timeRange').optional().isIn(['24h', '7d', '30d', '90d']).withMessage('Invalid time range'),
  query('forceRefresh').optional().isBoolean().withMessage('Force refresh must be boolean')
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

    const { timeRange = '7d', forceRefresh = false } = req.query;

    const analytics = await analyticsService.generateDisasterAnalytics(timeRange);

    if (!analytics.success) {
      return res.status(500).json({
        success: false,
        error: analytics.error
      });
    }

    res.json({
      success: true,
      data: analytics.data,
      lastUpdated: analytics.lastUpdated
    });

  } catch (error) {
    logger.error('Error getting disaster analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate disaster analytics'
    });
  }
});

/**
 * @swagger
 * /api/analytics/historical:
 *   get:
 *     summary: Get historical analytics
 *     description: Retrieves historical disaster analytics data
 *     tags: [Analytics]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of historical records to return
 *         example: 5
 *     responses:
 *       200:
 *         description: Historical analytics retrieved successfully
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
 *                     $ref: '#/components/schemas/Analytics'
 *                 count:
 *                   type: integer
 *                   description: Number of historical records returned
 *                   example: 5
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
router.get('/historical', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
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

    const { limit = 10 } = req.query;

    const analytics = await analyticsService.getHistoricalAnalytics(parseInt(limit));

    if (!analytics.success) {
      return res.status(500).json({
        success: false,
        error: analytics.error
      });
    }

    res.json({
      success: true,
      data: analytics.data,
      count: analytics.data.length
    });

  } catch (error) {
    logger.error('Error getting historical analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get historical analytics'
    });
  }
});

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics summary
 *     description: Retrieves a comprehensive dashboard summary with current and historical analytics
 *     tags: [Analytics]
 *     security: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
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
 *                     current:
 *                       $ref: '#/components/schemas/Analytics'
 *                     historical:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Analytics'
 *                     alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             example: "high_activity"
 *                           severity:
 *                             type: string
 *                             enum: [low, medium, high, critical]
 *                             example: "high"
 *                           message:
 *                             type: string
 *                             example: "High disaster activity detected"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/dashboard', optionalAuth, async (req, res) => {
  try {
    // Get multiple analytics in parallel
    const [disasterAnalytics, historicalAnalytics] = await Promise.all([
      analyticsService.generateDisasterAnalytics('7d'),
      analyticsService.getHistoricalAnalytics(5)
    ]);

    if (!disasterAnalytics.success) {
      return res.status(500).json({
        success: false,
        error: disasterAnalytics.error
      });
    }

    const dashboard = {
      current: disasterAnalytics.data,
      historical: historicalAnalytics.success ? historicalAnalytics.data : [],
      alerts: generateAlerts(disasterAnalytics.data),
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Error getting dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard analytics'
    });
  }
});

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get trend analysis
 *     description: Retrieves disaster trend analysis for different time periods
 *     tags: [Analytics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [disasters, earthquakes, weather, volcanic]
 *           default: disasters
 *         description: Type of trend to analyze
 *         example: earthquakes
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Time period for trend analysis
 *         example: 30d
 *     responses:
 *       200:
 *         description: Trend analysis retrieved successfully
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
 *                     type:
 *                       type: string
 *                       example: earthquakes
 *                     period:
 *                       type: string
 *                       example: 30d
 *                     trends:
 *                       type: object
 *                       properties:
 *                         daily:
 *                           type: object
 *                           additionalProperties:
 *                             type: object
 *                             properties:
 *                               total:
 *                                 type: integer
 *                               byType:
 *                                 type: object
 *                     summary:
 *                       $ref: '#/components/schemas/Analytics'
 *                     predictions:
 *                       type: object
 *                       properties:
 *                         next24h:
 *                           type: object
 *                           properties:
 *                             probability:
 *                               type: number
 *                             confidence:
 *                               type: string
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
router.get('/trends', [
  query('type').optional().isIn(['disasters', 'earthquakes', 'weather', 'volcanic']).withMessage('Invalid trend type'),
  query('period').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid period')
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

    const { type = 'disasters', period = '30d' } = req.query;

    const analytics = await analyticsService.generateDisasterAnalytics(period);

    if (!analytics.success) {
      return res.status(500).json({
        success: false,
        error: analytics.error
      });
    }

    let trendData = analytics.data;

    // Filter by type if specified
    if (type !== 'disasters') {
      trendData = {
        ...trendData,
        summary: {
          ...trendData.summary,
          byType: { [type]: trendData.summary.byType[type] || 0 }
        },
        trends: {
          ...trendData.trends,
          daily: Object.fromEntries(
            Object.entries(trendData.trends.daily).map(([date, data]) => [
              date,
              { total: data.byType[type] || 0, byType: { [type]: data.byType[type] || 0 } }
            ])
          )
        }
      };
    }

    res.json({
      success: true,
      data: {
        type,
        period,
        trends: trendData.trends,
        summary: trendData.summary,
        predictions: trendData.predictions
      },
      lastUpdated: analytics.lastUpdated
    });

  } catch (error) {
    logger.error('Error getting trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend analysis'
    });
  }
});

/**
 * @swagger
 * /api/analytics/geographic:
 *   get:
 *     summary: Get geographic analysis
 *     description: Retrieves geographic distribution analysis of disasters
 *     tags: [Analytics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *         description: Filter by specific region
 *         example: "Japan"
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [country, state, city]
 *           default: country
 *         description: Geographic analysis level
 *         example: country
 *     responses:
 *       200:
 *         description: Geographic analysis retrieved successfully
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
 *                     level:
 *                       type: string
 *                       example: country
 *                     region:
 *                       type: string
 *                       example: Japan
 *                     geographic:
 *                       type: object
 *                       properties:
 *                         regions:
 *                           type: object
 *                           additionalProperties:
 *                             type: integer
 *                         hotspots:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               location:
 *                                 type: string
 *                                 example: "Tokyo, Japan"
 *                               count:
 *                                 type: integer
 *                                 example: 15
 *                               severity:
 *                                 type: string
 *                                 example: "high"
 *                     distribution:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
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
router.get('/geographic', [
  query('region').optional().isString().withMessage('Region must be a string'),
  query('level').optional().isIn(['country', 'state', 'city']).withMessage('Invalid geographic level')
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

    const { region, level = 'country' } = req.query;

    const analytics = await analyticsService.generateDisasterAnalytics('30d');

    if (!analytics.success) {
      return res.status(500).json({
        success: false,
        error: analytics.error
      });
    }

    let geographicData = analytics.data.geographic;

    // Filter by region if specified
    if (region) {
      geographicData = {
        ...geographicData,
        regions: Object.fromEntries(
          Object.entries(geographicData.regions).filter(([key]) => 
            key.toLowerCase().includes(region.toLowerCase())
          )
        )
      };
    }

    res.json({
      success: true,
      data: {
        level,
        region,
        geographic: geographicData,
        hotspots: geographicData.hotspots,
        distribution: geographicData.distribution
      },
      lastUpdated: analytics.lastUpdated
    });

  } catch (error) {
    logger.error('Error getting geographic analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get geographic analysis'
    });
  }
});

/**
 * @swagger
 * /api/analytics/predictions:
 *   get:
 *     summary: Get disaster predictions
 *     description: Retrieves AI-powered disaster predictions for different time horizons
 *     tags: [Analytics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: horizon
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *           default: 7d
 *         description: Prediction time horizon
 *         example: 7d
 *     responses:
 *       200:
 *         description: Disaster predictions retrieved successfully
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
 *                     horizon:
 *                       type: string
 *                       example: 7d
 *                     predictions:
 *                       type: object
 *                       properties:
 *                         next24h:
 *                           type: object
 *                           properties:
 *                             probability:
 *                               type: number
 *                               example: 0.75
 *                             confidence:
 *                               type: string
 *                               enum: [low, medium, high]
 *                               example: medium
 *                         next7d:
 *                           type: object
 *                           properties:
 *                             probability:
 *                               type: number
 *                               example: 0.85
 *                             confidence:
 *                               type: string
 *                               enum: [low, medium, high]
 *                               example: high
 *                         next30d:
 *                           type: object
 *                           properties:
 *                             probability:
 *                               type: number
 *                               example: 0.90
 *                             confidence:
 *                               type: string
 *                               enum: [low, medium, high]
 *                               example: high
 *                     confidence:
 *                       type: string
 *                       enum: [low, medium, high]
 *                       example: high
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
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
router.get('/predictions', [
  query('horizon').optional().isIn(['24h', '7d', '30d']).withMessage('Invalid prediction horizon')
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

    const { horizon = '7d' } = req.query;

    const analytics = await analyticsService.generateDisasterAnalytics('30d');

    if (!analytics.success) {
      return res.status(500).json({
        success: false,
        error: analytics.error
      });
    }

    const predictions = analytics.data.predictions;

    res.json({
      success: true,
      data: {
        horizon,
        predictions,
        confidence: calculateConfidence(predictions),
        lastUpdated: analytics.lastUpdated
      }
    });

  } catch (error) {
    logger.error('Error getting predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get predictions'
    });
  }
});

// Helper methods
function generateAlerts(analytics) {
  const alerts = [];

  // High activity alert
  if (analytics.summary.recent24h > 10) {
    alerts.push({
      type: 'high_activity',
      severity: 'high',
      message: `High disaster activity: ${analytics.summary.recent24h} events in last 24 hours`,
      timestamp: new Date()
    });
  }

  // Critical severity alert
  if (analytics.severity.overall.critical > 0) {
    alerts.push({
      type: 'critical_severity',
      severity: 'critical',
      message: `${analytics.severity.overall.critical} critical severity events detected`,
      timestamp: new Date()
    });
  }

  // Geographic hotspot alert
  if (analytics.geographic.hotspots.length > 0) {
    alerts.push({
      type: 'geographic_hotspot',
      severity: 'medium',
      message: `${analytics.geographic.hotspots.length} geographic hotspots identified`,
      timestamp: new Date()
    });
  }

  return alerts;
}

function calculateConfidence(predictions) {
  const confidences = [];
  
  if (predictions.next24h) confidences.push(predictions.next24h.confidence);
  if (predictions.next7d) confidences.push(predictions.next7d.confidence);
  if (predictions.seasonal) confidences.push(predictions.seasonal.confidence);

  const confidenceMap = { low: 1, medium: 2, high: 3 };
  const avgConfidence = confidences.reduce((sum, conf) => 
    sum + (confidenceMap[conf] || 1), 0) / confidences.length;

  if (avgConfidence >= 2.5) return 'high';
  if (avgConfidence >= 1.5) return 'medium';
  return 'low';
}

module.exports = router;

