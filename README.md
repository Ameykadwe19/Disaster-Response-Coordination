# Disaster Response Coordination Platform

A full-stack MERN application for disaster management with real-time data aggregation, geospatial queries, and AI-powered location extraction.

## 🚀 Live Demo

- **Frontend:** https://disaster-response-coordination-nine.vercel.app
- **Backend API:** https://disaster-response-coordination-jd4y.onrender.com
- **Database:** Supabase PostgreSQL with PostGIS

## 📋 Features

### Core Functionality
- **Disaster CRUD Operations** - Create, read, update, delete disaster records
- **Location Extraction** - Google Gemini API extracts locations from descriptions
- **Geocoding** - Convert location names to coordinates using Nominatim
- **Geospatial Queries** - PostGIS ST_DWithin for nearby resource searches
- **Real-time Updates** - WebSocket integration with Socket.IO
- **Image Verification** - Gemini API analyzes disaster images for authenticity

### External Integrations
- **Google Gemini API** - Location extraction and image verification
- **Nominatim API** - Geocoding service for coordinates
- **Supabase** - Database with geospatial capabilities
- **Mock Social Media** - Simulated Twitter-like disaster reports

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** (PostgreSQL + PostGIS)
- **Socket.IO** for real-time updates
- **Google Gemini API** integration
- **Structured logging** and caching

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **Lucide React** icons
- **Real-time WebSocket** connections

### Deployment
- **Backend:** Render.com
- **Frontend:** Vercel
- **Database:** Supabase Cloud

## 🗄️ Database Schema

```sql
-- Disasters table with geospatial support
disasters (
  id UUID PRIMARY KEY,
  title TEXT,
  location_name TEXT,
  location GEOGRAPHY(POINT),
  description TEXT,
  tags TEXT[],
  owner_id TEXT,
  audit_trail JSONB,
  created_at TIMESTAMP
)

-- Resources with spatial indexing
resources (
  id UUID PRIMARY KEY,
  disaster_id UUID,
  name TEXT,
  location_name TEXT,
  location GEOGRAPHY(POINT),
  type TEXT,
  created_at TIMESTAMP
)

-- Caching table for API responses
cache (
  key TEXT PRIMARY KEY,
  value JSONB,
  expires_at TIMESTAMP
)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add your API keys to .env
npm start
```

### Frontend Setup
```bash
cd frontend/vite-project
npm install
npm run dev
```

### Environment Variables

**Backend (.env):**
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:3000
PORT=5000
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 📡 API Endpoints

### Disasters
- `GET /api/disasters` - Get all disasters
- `POST /api/disasters` - Create new disaster
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster
- `GET /api/disasters/:id/coordinates` - Get disaster coordinates

### Resources & Data
- `GET /api/disasters/:id/resources` - Get nearby resources
- `GET /api/disasters/:id/social-media` - Get social media reports
- `GET /api/disasters/:id/official-updates` - Get official updates
- `POST /api/disasters/:id/verify-image` - Verify disaster image

### Utilities
- `POST /api/disasters/geocode` - Extract location from description

## 🌍 Geospatial Features

### PostGIS Functions
- **ST_DWithin** - Find resources within radius
- **ST_Distance** - Calculate distances
- **Geography columns** - Efficient spatial indexing

### Sample Spatial Query
```sql
SELECT name, type, location_name,
       ST_Distance(location, ST_Point(-73.9857, 40.7484)) / 1000 as distance_km
FROM resources 
WHERE ST_DWithin(location, ST_Point(-73.9857, 40.7484), 10000)
ORDER BY distance_km;
```

## 🤖 AI Integration

### Google Gemini API Usage
- **Location Extraction:** Extract location names from disaster descriptions
- **Image Verification:** Analyze uploaded images for disaster authenticity
- **Caching:** API responses cached for 1 hour to optimize performance

### Example Gemini Prompts
```javascript
// Location extraction
"Extract the location name from this disaster description: 'Heavy flooding reported in downtown Manhattan area'"

// Image verification  
"Analyze this image for signs of disaster or emergency situation. Determine if it's authentic disaster-related content."
```

## 📊 Sample Data

The application includes sample disasters for testing:
- NYC Flood (Manhattan)
- Mumbai Flooding (Maharashtra)
- Pune Flood (Maharashtra)  
- Bangalore Landslide (Karnataka)

## 🔧 Development Notes

### AI Tool Usage
This project was developed with significant AI assistance (70-80%):
- **Amazon Q Assistant** generated API routes, controllers, and React components
- **AI-generated** PostGIS spatial queries and Gemini API integration
- **Manual contributions** included architecture decisions, testing, and deployment

### Performance Optimizations
- **Supabase caching** for external API responses
- **Geospatial indexing** for fast location-based queries
- **WebSocket connections** for real-time updates
- **Rate limiting** for API protection

## 📝 Assignment Requirements Met

✅ **Disaster Data Management** - Full CRUD with audit trails  
✅ **Location Extraction** - Gemini API integration  
✅ **Geocoding** - Nominatim service  
✅ **Geospatial Queries** - PostGIS ST_DWithin  
✅ **Real-time Updates** - WebSocket implementation  
✅ **Image Verification** - Gemini API analysis  
✅ **Caching System** - Supabase cache table  
✅ **Mock Authentication** - Hard-coded users  
✅ **Frontend Interface** - React with forms and displays  

## 🚀 Deployment

### Backend (Render)
- Automatic deployment from GitHub
- Environment variables configured
- PostgreSQL with PostGIS support

### Frontend (Vercel)  
- Automatic deployment from GitHub
- Environment variables for API URL
- Static site generation

## 📄 License

MIT License - Built for educational/assignment purposes.

---

**Built with ❤️ using AI assistance for rapid development**