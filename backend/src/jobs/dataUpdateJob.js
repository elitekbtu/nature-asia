const cron = require('node-cron');
const disasterService = require('../services/disasterService');
const analyticsService = require('../services/analyticsService');
const { getFirestore } = require('../config/firebase');
const logger = require('../utils/logger');

class DataUpdateJob {
  constructor() {
    this._firestore = null;
    this.isRunning = false;
  }

  get firestore() {
    if (!this._firestore) {
      this._firestore = getFirestore();
    }
    return this._firestore;
  }

  // Start all scheduled jobs
  start() {
    logger.info('Starting data update jobs...');

    // Update disaster data every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.updateDisasterData();
    });

    // Generate analytics every hour
    cron.schedule('0 * * * *', async () => {
      await this.generateAnalytics();
    });

    // Clean up old data daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldData();
    });

    // Update V2V vehicle status every minute
    cron.schedule('* * * * *', async () => {
      await this.updateVehicleStatus();
    });

    logger.info('Data update jobs started successfully');
  }

  // Update disaster data
  async updateDisasterData() {
    if (this.isRunning) {
      logger.warn('Data update already running, skipping...');
      return;
    }

    this.isRunning = true;
    try {
      logger.info('Starting disaster data update...');

      const disasterData = await disasterService.getAllDisasters();
      
      if (disasterData.success) {
        // Store latest disaster data
        await this.firestore.collection('disaster_updates').add({
          data: disasterData.data,
          count: disasterData.count,
          timestamp: new Date(),
          type: 'disaster_update'
        });

        // Update real-time disaster cache
        await this.firestore.collection('cache').doc('disasters').set({
          data: disasterData.data,
          lastUpdated: new Date(),
          count: disasterData.count
        });

        logger.info(`Disaster data updated: ${disasterData.count} events`);
      } else {
        logger.error('Failed to update disaster data:', disasterData.error);
      }
    } catch (error) {
      logger.error('Error in disaster data update job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Generate analytics
  async generateAnalytics() {
    try {
      logger.info('Generating analytics...');

      const analytics = await analyticsService.generateDisasterAnalytics('7d');
      
      if (analytics.success) {
        // Store analytics
        await this.firestore.collection('analytics').add({
          ...analytics.data,
          createdAt: new Date(),
          type: 'scheduled_analytics'
        });

        // Update analytics cache
        await this.firestore.collection('cache').doc('analytics').set({
          data: analytics.data,
          lastUpdated: new Date()
        });

        logger.info('Analytics generated successfully');
      } else {
        logger.error('Failed to generate analytics:', analytics.error);
      }
    } catch (error) {
      logger.error('Error in analytics generation job:', error);
    }
  }

  // Clean up old data
  async cleanupOldData() {
    try {
      logger.info('Starting data cleanup...');

      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      // Clean up old disaster updates
      const disasterUpdatesSnapshot = await this.firestore.collection('disaster_updates')
        .where('timestamp', '<', cutoffDate)
        .get();

      const batch = this.firestore.batch();
      disasterUpdatesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Clean up old chat history (keep only 90 days)
      const chatCutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const chatHistorySnapshot = await this.firestore.collection('chat_history')
        .where('timestamp', '<', chatCutoffDate)
        .get();

      chatHistorySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Clean up old V2V messages (keep only 7 days)
      const v2vCutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const v2vMessagesSnapshot = await this.firestore.collection('v2v_messages')
        .where('timestamp', '<', v2vCutoffDate)
        .get();

      v2vMessagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.info(`Data cleanup completed: ${disasterUpdatesSnapshot.size} disaster updates, ${chatHistorySnapshot.size} chat messages, ${v2vMessagesSnapshot.size} V2V messages cleaned`);
    } catch (error) {
      logger.error('Error in data cleanup job:', error);
    }
  }

  // Update vehicle status
  async updateVehicleStatus() {
    try {
      const vehiclesSnapshot = await this.firestore.collection('vehicles')
        .where('status', '==', 'active')
        .get();

      const now = new Date();
      const batch = this.firestore.batch();
      let updatedCount = 0;

      vehiclesSnapshot.docs.forEach(doc => {
        const vehicleData = doc.data();
        const lastSeen = vehicleData.lastSeen.toDate();
        const timeDiff = (now - lastSeen) / 1000 / 60; // minutes

        let newStatus = 'active';
        if (timeDiff > 30) {
          newStatus = 'inactive';
        } else if (timeDiff > 10) {
          newStatus = 'warning';
        }

        if (newStatus !== vehicleData.status) {
          batch.update(doc.ref, {
            status: newStatus,
            updatedAt: now
          });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        logger.info(`Updated ${updatedCount} vehicle statuses`);
      }
    } catch (error) {
      logger.error('Error updating vehicle status:', error);
    }
  }

  // Manual data refresh
  async refreshAllData() {
    logger.info('Manual data refresh initiated...');
    await this.updateDisasterData();
    await this.generateAnalytics();
    logger.info('Manual data refresh completed');
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: new Date(),
      jobs: {
        disasterData: '*/5 * * * *',
        analytics: '0 * * * *',
        cleanup: '0 2 * * *',
        vehicleStatus: '* * * * *'
      }
    };
  }
}

module.exports = new DataUpdateJob();

