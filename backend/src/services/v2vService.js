const { getFirestore } = require('../config/firebase');
const geminiService = require('./geminiService');
const logger = require('../utils/logger');

class V2VService {
  constructor() {
    this._firestore = null;
  }

  get firestore() {
    if (!this._firestore) {
      this._firestore = getFirestore();
    }
    return this._firestore;
  }

  // Register a vehicle
  async registerVehicle(vehicleData) {
    try {
      const vehicle = {
        ...vehicleData,
        status: 'active',
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await this.firestore.collection('vehicles').add(vehicle);
      
      return {
        success: true,
        vehicleId: docRef.id,
        data: vehicle
      };
    } catch (error) {
      logger.error('Error registering vehicle:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update vehicle location and status
  async updateVehicleLocation(vehicleId, locationData) {
    try {
      const updateData = {
        ...locationData,
        lastSeen: new Date(),
        updatedAt: new Date()
      };

      await this.firestore.collection('vehicles').doc(vehicleId).update(updateData);

      return {
        success: true,
        message: 'Vehicle location updated successfully'
      };
    } catch (error) {
      logger.error('Error updating vehicle location:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send V2V message
  async sendV2VMessage(senderVehicleId, messageData) {
    try {
      const message = {
        senderVehicleId,
        ...messageData,
        timestamp: new Date(),
        status: 'sent'
      };

      const docRef = await this.firestore.collection('v2v_messages').add(message);

      // Update sender's last activity
      await this.firestore.collection('vehicles').doc(senderVehicleId).update({
        lastActivity: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        messageId: docRef.id,
        data: message
      };
    } catch (error) {
      logger.error('Error sending V2V message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send V2V text message with AI enhancement
  async sendV2VTextMessage(senderVehicleId, messageData) {
    try {
      const message = {
        senderVehicleId,
        ...messageData,
        timestamp: new Date(),
        status: 'sent',
        type: 'text'
      };

      const docRef = await this.firestore.collection('v2v_messages').add(message);

      // Update sender's last activity
      await this.firestore.collection('vehicles').doc(senderVehicleId).update({
        lastActivity: new Date(),
        updatedAt: new Date()
      });

      return {
        success: true,
        messageId: docRef.id,
        data: message
      };
    } catch (error) {
      logger.error('Error sending V2V text message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process text message with AI enhancement
  async processTextMessageWithAI(senderVehicleId, targetVehicleId, originalMessage, context = {}) {
    try {
      // Get vehicle information for context
      const senderVehicle = await this.getVehicleInfo(senderVehicleId);
      const targetVehicle = await this.getVehicleInfo(targetVehicleId);

      // Create AI context for message enhancement
      const aiContext = {
        ...context,
        senderVehicle: senderVehicle.success ? senderVehicle.data : null,
        targetVehicle: targetVehicle.success ? targetVehicle.data : null,
        messageType: 'v2v_communication',
        region: 'asia'
      };

      // Enhance message with AI
      const aiResponse = await geminiService.enhanceV2VMessage(originalMessage, aiContext);

      if (!aiResponse.success) {
        // If AI enhancement fails, send original message
        logger.warn('AI enhancement failed, sending original message:', aiResponse.error);
        return await this.sendV2VTextMessage(senderVehicleId, {
          targetVehicleId,
          message: originalMessage,
          type: 'text',
          priority: 'medium',
          aiEnhanced: false,
          originalMessage: originalMessage,
          senderInfo: {
            vehicleId: senderVehicleId,
            userId: context.userId
          }
        });
      }

      // Send enhanced message
      return await this.sendV2VTextMessage(senderVehicleId, {
        targetVehicleId,
        message: aiResponse.enhancedMessage,
        type: 'text',
        priority: 'medium',
        aiEnhanced: true,
        originalMessage: originalMessage,
        aiInsights: aiResponse.insights,
        senderInfo: {
          vehicleId: senderVehicleId,
          userId: context.userId
        }
      });

    } catch (error) {
      logger.error('Error processing text message with AI:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get vehicle information
  async getVehicleInfo(vehicleId) {
    try {
      const vehicleDoc = await this.firestore.collection('vehicles').doc(vehicleId).get();
      
      if (!vehicleDoc.exists) {
        return {
          success: false,
          error: 'Vehicle not found'
        };
      }

      return {
        success: true,
        data: vehicleDoc.data()
      };
    } catch (error) {
      logger.error('Error getting vehicle info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get nearby vehicles
  async getNearbyVehicles(vehicleId, radiusKm = 10) {
    try {
      const vehicleDoc = await this.firestore.collection('vehicles').doc(vehicleId).get();
      
      if (!vehicleDoc.exists) {
        return {
          success: false,
          error: 'Vehicle not found'
        };
      }

      const vehicleData = vehicleDoc.data();
      const { latitude, longitude } = vehicleData.location;

      // Calculate bounding box for radius search
      const latRange = radiusKm / 111; // Approximate km per degree latitude
      const lngRange = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

      const minLat = latitude - latRange;
      const maxLat = latitude + latRange;
      const minLng = longitude - lngRange;
      const maxLng = longitude + lngRange;

      const snapshot = await this.firestore.collection('vehicles')
        .where('location.latitude', '>=', minLat)
        .where('location.latitude', '<=', maxLat)
        .where('location.longitude', '>=', minLng)
        .where('location.longitude', '<=', maxLng)
        .where('status', '==', 'active')
        .get();

      const nearbyVehicles = [];
      snapshot.forEach(doc => {
        if (doc.id !== vehicleId) {
          const data = doc.data();
          const distance = this.calculateDistance(
            latitude, longitude,
            data.location.latitude, data.location.longitude
          );
          
          if (distance <= radiusKm) {
            nearbyVehicles.push({
              vehicleId: doc.id,
              ...data,
              distance: Math.round(distance * 100) / 100
            });
          }
        }
      });

      return {
        success: true,
        data: nearbyVehicles,
        count: nearbyVehicles.length,
        radius: radiusKm
      };
    } catch (error) {
      logger.error('Error getting nearby vehicles:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get V2V messages for a vehicle
  async getV2VMessages(vehicleId, limit = 50) {
    try {
      const snapshot = await this.firestore.collection('v2v_messages')
        .where('targetVehicleId', '==', vehicleId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: messages,
        count: messages.length
      };
    } catch (error) {
      logger.error('Error getting V2V messages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Broadcast emergency message
  async broadcastEmergencyMessage(senderVehicleId, emergencyData) {
    try {
      const message = {
        senderVehicleId,
        type: 'emergency',
        priority: 'high',
        ...emergencyData,
        timestamp: new Date(),
        status: 'broadcast'
      };

      const docRef = await this.firestore.collection('v2v_messages').add(message);

      // Get all active vehicles in a larger radius for emergency broadcast
      const nearbyVehicles = await this.getNearbyVehicles(senderVehicleId, 50);
      
      if (nearbyVehicles.success) {
        // Create individual messages for each nearby vehicle
        const batch = this.firestore.batch();
        
        nearbyVehicles.data.forEach(vehicle => {
          const emergencyMessageRef = this.firestore.collection('v2v_messages').doc();
          batch.set(emergencyMessageRef, {
            ...message,
            targetVehicleId: vehicle.vehicleId,
            id: emergencyMessageRef.id
          });
        });

        await batch.commit();
      }

      return {
        success: true,
        messageId: docRef.id,
        broadcastCount: nearbyVehicles.success ? nearbyVehicles.count : 0
      };
    } catch (error) {
      logger.error('Error broadcasting emergency message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get vehicle status
  async getVehicleStatus(vehicleId) {
    try {
      const vehicleDoc = await this.firestore.collection('vehicles').doc(vehicleId).get();
      
      if (!vehicleDoc.exists) {
        return {
          success: false,
          error: 'Vehicle not found'
        };
      }

      const vehicleData = vehicleDoc.data();
      const now = new Date();
      const lastSeen = vehicleData.lastSeen.toDate();
      const timeDiff = (now - lastSeen) / 1000 / 60; // minutes

      let status = 'active';
      if (timeDiff > 30) {
        status = 'inactive';
      } else if (timeDiff > 10) {
        status = 'warning';
      }

      return {
        success: true,
        data: {
          ...vehicleData,
          status,
          timeSinceLastSeen: Math.round(timeDiff)
        }
      };
    } catch (error) {
      logger.error('Error getting vehicle status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calculate distance between two coordinates
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Get V2V statistics
  async getV2VStats() {
    try {
      const vehiclesSnapshot = await this.firestore.collection('vehicles').get();
      const messagesSnapshot = await this.firestore.collection('v2v_messages')
        .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
        .get();

      const totalVehicles = vehiclesSnapshot.size;
      const activeVehicles = vehiclesSnapshot.docs.filter(doc => {
        const data = doc.data();
        const now = new Date();
        const lastSeen = data.lastSeen.toDate();
        const timeDiff = (now - lastSeen) / 1000 / 60;
        return timeDiff <= 30;
      }).length;

      const totalMessages = messagesSnapshot.size;
      const emergencyMessages = messagesSnapshot.docs.filter(doc => 
        doc.data().type === 'emergency'
      ).length;

      return {
        success: true,
        data: {
          totalVehicles,
          activeVehicles,
          inactiveVehicles: totalVehicles - activeVehicles,
          totalMessages24h: totalMessages,
          emergencyMessages24h: emergencyMessages,
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      logger.error('Error getting V2V stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new V2VService();

