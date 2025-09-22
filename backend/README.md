# Nature Asia Backend

A comprehensive backend system for disaster monitoring, V2V communication, and AI-powered analysis for the Asia region.

## Features

### 🔥 Core Features
- **Real-time Disaster Monitoring**: Integration with USGS, NOAA, and OpenWeatherMap APIs
- **AI-Powered Analysis**: Gemini AI integration for disaster analysis and recommendations
- **V2V Communication**: Vehicle-to-vehicle text communication system with AI enhancement
- **Analytics Dashboard**: Comprehensive analytics and trend analysis
- **Firebase Authentication**: Google OAuth integration
- **Real-time Updates**: Socket.IO for live data streaming

### 🌍 Disaster Types Supported
- Earthquakes (USGS API)
- Weather Alerts (OpenWeatherMap API)
- Tsunami Warnings (USGS Tsunami data)
- Volcanic Activity (USGS Volcano data)

### 🤖 AI Capabilities
- Disaster analysis and risk assessment
- Emergency response planning
- Safety recommendations
- Chat assistance for disaster-related queries
- Trend analysis and predictions
- **AI-enhanced V2V text communication**
- **Intelligent message enhancement and response generation**

### 🚗 V2V Communication
- Vehicle registration and tracking
- Real-time location updates
- **AI-enhanced text messaging**
- Emergency message broadcasting
- Nearby vehicle detection
- Message history and status tracking
- **Intelligent message processing with Gemini AI**

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: Google Gemini API
- **Real-time**: Socket.IO
- **Scheduling**: node-cron
- **Logging**: Winston
- **Validation**: express-validator

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nature-asia/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Fill in the required environment variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_CLIENT_ID=your-client-id

   # Gemini AI Configuration
   GEMINI_API_KEY=your_gemini_api_key

   # External APIs
   OPENWEATHER_API_KEY=your_openweather_api_key

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase ID token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `DELETE /api/auth/account` - Delete user account

### Disaster Monitoring
- `GET /api/disasters` - Get all disaster data
- `GET /api/disasters/stats` - Get disaster statistics
- `GET /api/disasters/earthquakes` - Get earthquake data
- `GET /api/disasters/weather` - Get weather alerts
- `GET /api/disasters/tsunami` - Get tsunami warnings
- `GET /api/disasters/volcanic` - Get volcanic activity

### AI Chat & Analysis
- `POST /api/chat/message` - Send message to AI
- `POST /api/chat/analyze-disaster` - Analyze specific disaster
- `POST /api/chat/emergency-plan` - Generate emergency plan
- `POST /api/chat/safety-recommendations` - Get safety recommendations
- `GET /api/chat/history` - Get chat history

### V2V Communication (Text-based with AI)
- `POST /api/v2v/register` - Register vehicle
- `PUT /api/v2v/:vehicleId/location` - Update vehicle location
- `POST /api/v2v/:vehicleId/message` - Send AI-enhanced V2V message
- `POST /api/v2v/:vehicleId/ai-response` - Generate AI response for V2V message
- `POST /api/v2v/:vehicleId/emergency` - Broadcast emergency message
- `GET /api/v2v/:vehicleId/nearby` - Get nearby vehicles
- `GET /api/v2v/:vehicleId/messages` - Get V2V messages
- `GET /api/v2v/:vehicleId/status` - Get vehicle status
- `GET /api/v2v/stats` - Get V2V statistics

### Analytics
- `GET /api/analytics/disasters` - Get disaster analytics
- `GET /api/analytics/historical` - Get historical analytics
- `GET /api/analytics/dashboard` - Get dashboard summary
- `GET /api/analytics/trends` - Get trend analysis
- `GET /api/analytics/geographic` - Get geographic analysis
- `GET /api/analytics/predictions` - Get disaster predictions

## AI-Enhanced V2V Communication

The system now features intelligent text-based communication between vehicles:

### Features
- **AI Message Enhancement**: Messages are automatically enhanced with context and clarity
- **Intelligent Responses**: AI generates appropriate responses to V2V messages
- **Context Awareness**: AI considers vehicle types, locations, and emergency situations
- **Professional Communication**: Messages are formatted for emergency communication standards

### Usage
```javascript
// Send AI-enhanced message
POST /api/v2v/:vehicleId/message
{
  "targetVehicleId": "target-vehicle-id",
  "message": "Help needed at location",
  "useAI": true,
  "type": "emergency",
  "priority": "high"
}

// Generate AI response
POST /api/v2v/:vehicleId/ai-response
{
  "message": "Emergency vehicle requesting assistance",
  "context": {
    "situation": "disaster_response"
  }
}
```

## Real-time Features

The system uses Socket.IO for real-time communication:

- **Disaster Alerts**: Real-time disaster notifications
- **V2V Messages**: Instant vehicle-to-vehicle text communication
- **Location Updates**: Live vehicle tracking
- **Emergency Broadcasts**: Immediate emergency alerts

## Background Jobs

Automated background jobs run on schedule:

- **Disaster Data Update**: Every 5 minutes
- **Analytics Generation**: Every hour
- **Data Cleanup**: Daily at 2 AM
- **Vehicle Status Update**: Every minute

## Data Sources

### External APIs
- **USGS Earthquake API**: Real-time earthquake data
- **OpenWeatherMap API**: Weather alerts and conditions
- **USGS Volcano API**: Volcanic activity monitoring

### AI Services
- **Google Gemini**: AI analysis, chat functionality, and V2V message enhancement

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Comprehensive request validation
- **Authentication**: Firebase JWT token verification
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers

## Monitoring & Logging

- **Winston Logger**: Structured logging with different levels
- **Error Handling**: Comprehensive error tracking
- **Health Checks**: `/health` endpoint for monitoring
- **Request Logging**: Morgan HTTP request logger

## Development

### Project Structure
```
src/
├── config/          # Configuration files
├── jobs/            # Background jobs
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
└── server.js        # Main server file
```

### Environment Variables
See `env.example` for all required environment variables.

### Testing
```bash
# Run all tests
npm test

# Test AI text system
npm run test:text

# Test system setup
npm run test:setup
```

## Deployment

1. **Environment Setup**: Configure production environment variables
2. **Firebase Setup**: Ensure Firebase project is properly configured
3. **API Keys**: Obtain and configure all required API keys
4. **Database**: Firebase Firestore will be automatically configured
5. **Monitoring**: Set up logging and monitoring for production

## Changes from Previous Version

### Removed Features
- ❌ Voice-to-voice communication system
- ❌ Speech-to-text and text-to-speech APIs
- ❌ Audio file processing and storage
- ❌ Voice cleanup jobs

### Added Features
- ✅ AI-enhanced text communication
- ✅ Intelligent message processing
- ✅ Context-aware V2V messaging
- ✅ Professional emergency communication standards

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
