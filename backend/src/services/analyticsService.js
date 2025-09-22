const { getFirestore } = require('../config/firebase');
const disasterService = require('./disasterService');
const logger = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this._firestore = null;
  }

  get firestore() {
    if (!this._firestore) {
      this._firestore = getFirestore();
    }
    return this._firestore;
  }

  // Generate comprehensive disaster analytics
  async generateDisasterAnalytics(timeRange = '7d') {
    try {
      const endTime = new Date();
      let startTime;
      
      switch (timeRange) {
        case '24h':
          startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startTime = new Date(endTime.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Get disaster data
      const disasterData = await disasterService.getAllDisasters();
      
      if (!disasterData.success) {
        return {
          success: false,
          error: disasterData.error
        };
      }

      // Filter data by time range
      const filteredDisasters = disasterData.data.filter(disaster => 
        new Date(disaster.time) >= startTime
      );

      // Generate analytics
      const analytics = {
        timeRange,
        period: {
          start: startTime,
          end: endTime
        },
        summary: this.generateSummary(filteredDisasters),
        trends: this.analyzeTrends(filteredDisasters, timeRange),
        geographic: this.analyzeGeographicDistribution(filteredDisasters),
        severity: this.analyzeSeverityDistribution(filteredDisasters),
        temporal: this.analyzeTemporalPatterns(filteredDisasters),
        predictions: await this.generatePredictions(filteredDisasters),
        recommendations: this.generateRecommendations(filteredDisasters)
      };

      // Save analytics to database
      await this.saveAnalytics(analytics);

      return {
        success: true,
        data: analytics,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error generating disaster analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate summary statistics
  generateSummary(disasters) {
    const total = disasters.length;
    const byType = {};
    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    const recent24h = disasters.filter(d => 
      new Date(d.time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    disasters.forEach(disaster => {
      // Count by type
      byType[disaster.type] = (byType[disaster.type] || 0) + 1;
      
      // Count by severity
      if (disaster.severity) {
        bySeverity[disaster.severity] = (bySeverity[disaster.severity] || 0) + 1;
      }
    });

    return {
      total,
      recent24h,
      byType,
      bySeverity,
      averagePerDay: total / Math.max(1, Math.ceil((Date.now() - new Date(disasters[0]?.time || Date.now()).getTime()) / (24 * 60 * 60 * 1000)))
    };
  }

  // Analyze trends
  analyzeTrends(disasters, timeRange) {
    const dailyData = {};
    const hourlyData = {};

    disasters.forEach(disaster => {
      const date = new Date(disaster.time).toISOString().split('T')[0];
      const hour = new Date(disaster.time).getHours();

      // Daily trends
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, byType: {} };
      }
      dailyData[date].total++;
      dailyData[date].byType[disaster.type] = (dailyData[date].byType[disaster.type] || 0) + 1;

      // Hourly trends
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return {
      daily: dailyData,
      hourly: hourlyData,
      trend: this.calculateTrend(Object.values(dailyData).map(d => d.total))
    };
  }

  // Analyze geographic distribution
  analyzeGeographicDistribution(disasters) {
    const regions = {};
    const coordinates = disasters.map(d => ({
      lat: d.coordinates?.latitude,
      lng: d.coordinates?.longitude,
      type: d.type,
      severity: d.severity
    })).filter(c => c.lat && c.lng);

    // Group by regions (simplified)
    coordinates.forEach(coord => {
      const region = this.getRegion(coord.lat, coord.lng);
      if (!regions[region]) {
        regions[region] = { total: 0, byType: {}, coordinates: [] };
      }
      regions[region].total++;
      regions[region].byType[coord.type] = (regions[region].byType[coord.type] || 0) + 1;
      regions[region].coordinates.push(coord);
    });

    return {
      regions,
      hotspots: this.identifyHotspots(coordinates),
      distribution: this.calculateDistribution(coordinates)
    };
  }

  // Analyze severity distribution
  analyzeSeverityDistribution(disasters) {
    const severity = { low: 0, medium: 0, high: 0, critical: 0 };
    const severityByType = {};

    disasters.forEach(disaster => {
      if (disaster.severity) {
        severity[disaster.severity]++;
        
        if (!severityByType[disaster.type]) {
          severityByType[disaster.type] = { low: 0, medium: 0, high: 0, critical: 0 };
        }
        severityByType[disaster.type][disaster.severity]++;
      }
    });

    return {
      overall: severity,
      byType: severityByType,
      riskLevel: this.calculateRiskLevel(severity)
    };
  }

  // Analyze temporal patterns
  analyzeTemporalPatterns(disasters) {
    const patterns = {
      byDayOfWeek: {},
      byHour: {},
      byMonth: {},
      seasonality: {}
    };

    disasters.forEach(disaster => {
      const date = new Date(disaster.time);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const month = date.getMonth();

      patterns.byDayOfWeek[dayOfWeek] = (patterns.byDayOfWeek[dayOfWeek] || 0) + 1;
      patterns.byHour[hour] = (patterns.byHour[hour] || 0) + 1;
      patterns.byMonth[month] = (patterns.byMonth[month] || 0) + 1;
    });

    return patterns;
  }

  // Generate predictions
  async generatePredictions(disasters) {
    try {
      // Simple prediction based on historical patterns
      const predictions = {
        next24h: this.predictNext24h(disasters),
        next7d: this.predictNext7d(disasters),
        riskAreas: this.predictRiskAreas(disasters),
        seasonal: this.predictSeasonal(disasters)
      };

      return predictions;
    } catch (error) {
      logger.error('Error generating predictions:', error);
      return { error: 'Failed to generate predictions' };
    }
  }

  // Generate recommendations
  generateRecommendations(disasters) {
    const recommendations = [];

    // High activity recommendations
    const recentDisasters = disasters.filter(d => 
      new Date(d.time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (recentDisasters.length > 10) {
      recommendations.push({
        type: 'high_activity',
        priority: 'high',
        message: 'High disaster activity detected. Consider increasing monitoring and preparedness measures.',
        actions: ['Increase monitoring frequency', 'Alert emergency services', 'Review evacuation plans']
      });
    }

    // Geographic recommendations
    const hotspots = this.identifyHotspots(disasters.map(d => ({
      lat: d.coordinates?.latitude,
      lng: d.coordinates?.longitude,
      type: d.type
    })).filter(c => c.lat && c.lng));

    if (hotspots.length > 0) {
      recommendations.push({
        type: 'geographic_hotspot',
        priority: 'medium',
        message: `High activity detected in ${hotspots.length} geographic areas.`,
        actions: ['Focus monitoring on hotspot areas', 'Deploy additional resources', 'Issue area-specific alerts']
      });
    }

    // Type-specific recommendations
    const earthquakeCount = disasters.filter(d => d.type === 'earthquake').length;
    if (earthquakeCount > 5) {
      recommendations.push({
        type: 'earthquake_cluster',
        priority: 'high',
        message: 'Multiple earthquakes detected. Monitor for potential aftershocks.',
        actions: ['Monitor seismic activity', 'Check infrastructure', 'Prepare for aftershocks']
      });
    }

    return recommendations;
  }

  // Helper methods
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  getRegion(lat, lng) {
    if (lat >= 35 && lat <= 50 && lng >= 60 && lng <= 100) return 'Central Asia';
    if (lat >= 20 && lat <= 35 && lng >= 100 && lng <= 140) return 'East Asia';
    if (lat >= 0 && lat <= 20 && lng >= 100 && lng <= 140) return 'Southeast Asia';
    if (lat >= 20 && lat <= 40 && lng >= 40 && lng <= 60) return 'West Asia';
    return 'Other';
  }

  identifyHotspots(coordinates) {
    // Simple hotspot identification based on density
    const hotspots = [];
    const gridSize = 1; // 1 degree grid
    
    const grid = {};
    coordinates.forEach(coord => {
      const gridLat = Math.floor(coord.lat / gridSize) * gridSize;
      const gridLng = Math.floor(coord.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;
      
      if (!grid[key]) {
        grid[key] = { lat: gridLat, lng: gridLng, count: 0, disasters: [] };
      }
      grid[key].count++;
      grid[key].disasters.push(coord);
    });

    Object.values(grid).forEach(cell => {
      if (cell.count >= 3) { // Threshold for hotspot
        hotspots.push({
          lat: cell.lat,
          lng: cell.lng,
          count: cell.count,
          severity: this.calculateCellSeverity(cell.disasters)
        });
      }
    });

    return hotspots;
  }

  calculateCellSeverity(disasters) {
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const totalScore = disasters.reduce((sum, d) => sum + (severityScores[d.severity] || 1), 0);
    const avgScore = totalScore / disasters.length;
    
    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  calculateDistribution(coordinates) {
    const bounds = {
      north: Math.max(...coordinates.map(c => c.lat)),
      south: Math.min(...coordinates.map(c => c.lat)),
      east: Math.max(...coordinates.map(c => c.lng)),
      west: Math.min(...coordinates.map(c => c.lng))
    };

    return {
      bounds,
      center: {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2
      },
      spread: {
        lat: bounds.north - bounds.south,
        lng: bounds.east - bounds.west
      }
    };
  }

  calculateRiskLevel(severity) {
    const total = Object.values(severity).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 'low';
    
    const criticalRatio = severity.critical / total;
    const highRatio = severity.high / total;
    
    if (criticalRatio > 0.2) return 'critical';
    if (criticalRatio > 0.1 || highRatio > 0.3) return 'high';
    if (highRatio > 0.1) return 'medium';
    return 'low';
  }

  predictNext24h(disasters) {
    const recent = disasters.filter(d => 
      new Date(d.time) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    return {
      expected: Math.ceil(recent.length * 1.1), // 10% increase
      confidence: 'medium',
      factors: ['Historical patterns', 'Recent activity']
    };
  }

  predictNext7d(disasters) {
    const weekly = disasters.filter(d => 
      new Date(d.time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    return {
      expected: Math.ceil(weekly.length * 1.05), // 5% increase
      confidence: 'low',
      factors: ['Weekly patterns', 'Seasonal trends']
    };
  }

  predictRiskAreas(disasters) {
    const hotspots = this.identifyHotspots(disasters.map(d => ({
      lat: d.coordinates?.latitude,
      lng: d.coordinates?.longitude,
      type: d.type
    })).filter(c => c.lat && c.lng));

    return hotspots.map(hotspot => ({
      ...hotspot,
      riskLevel: hotspot.severity,
      probability: hotspot.count > 5 ? 'high' : 'medium'
    }));
  }

  predictSeasonal(disasters) {
    const monthly = {};
    disasters.forEach(d => {
      const month = new Date(d.time).getMonth();
      monthly[month] = (monthly[month] || 0) + 1;
    });

    return {
      peakMonth: Object.keys(monthly).reduce((a, b) => monthly[a] > monthly[b] ? a : b),
      seasonalPattern: Object.values(monthly),
      confidence: 'low'
    };
  }

  // Save analytics to database
  async saveAnalytics(analytics) {
    try {
      await this.firestore.collection('analytics').add({
        ...analytics,
        createdAt: new Date(),
        type: 'disaster_analytics'
      });
    } catch (error) {
      logger.error('Error saving analytics:', error);
    }
  }

  // Get historical analytics
  async getHistoricalAnalytics(limit = 10) {
    try {
      const snapshot = await this.firestore.collection('analytics')
        .where('type', '==', 'disaster_analytics')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const analytics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      logger.error('Error getting historical analytics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AnalyticsService();

