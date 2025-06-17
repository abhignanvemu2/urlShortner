# URL Shortener API

A comprehensive URL shortener API with advanced analytics, user authentication via Google Sign-In, and rate limiting. This system allows users to create short URLs that simplify the sharing of long, complex URLs across various platforms.

## 🚀 Live Demo

**Deployment URL:** 
```
[{https://url-shortener-3dom.onrender.com/}]
```

## ✨ Features

### Core Functionality
- **User Authentication**: Google Sign-In integration for secure user management
- **URL Shortening**: Create short URLs with optional custom aliases
- **Topic Categorization**: Group URLs under specific topics (acquisition, activation, retention)
- **Smart Redirects**: Fast redirection with comprehensive analytics tracking
- **Rate Limiting**: Prevent abuse with configurable rate limits

### Advanced Analytics
- **Individual URL Analytics**: Total clicks, unique users, clicks by date
- **Device & OS Tracking**: Detailed breakdowns by operating system and device type
- **Topic-Based Analytics**: Aggregate analytics for URLs grouped by topic
- **Overall Analytics**: Comprehensive view of all user URLs
- **Geolocation Tracking**: Country, region, and city-level analytics
- **Real-time Data**: Live click tracking with Redis caching

### Technical Features
- **Redis Caching**: High-performance caching for URLs and analytics
- **PostgreSQL Database**: Robust data storage with Sequelize ORM
- **Docker Support**: Containerized deployment with Docker Compose
- **Comprehensive API Documentation**: Swagger/OpenAPI documentation
- **Rate Limiting**: Configurable limits to prevent API abuse
- **Error Handling**: Comprehensive error handling and validation
- **Security**: Helmet.js security headers, JWT authentication
- **Testing**: Unit and integration tests with Jest

## 🏗️ Architecture

The application follows a clean, modular architecture:

```
src/
├── config/          # Configuration files (database, Redis, passport, swagger)
├── middleware/      # Custom middleware (auth, rate limiting, error handling)
├── models/          # Sequelize database models
├── routes/          # API route handlers
├── server.js        # Main application entry point
tests/               # Test files
```

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Caching**: Redis
- **Authentication**: Passport.js with Google OAuth 2.0
- **Security**: JWT tokens, Helmet.js, bcrypt
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Containerization**: Docker, Docker Compose
- **Analytics**: UA-Parser, GeoIP-Lite


## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/abhignanvemu2/urlShortner
cd url-shortener-api
```

### 2. Install Dependencies

```bash
npm install

npm run migrate (to get all the tables )
```

### 3. Environment Setup

Copy the environment file and configure your variables:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=url_shortener
DB_USER=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://url-shortener-3dom.onrender.com/auth/google/callback

# Base URL for short links
BASE_URL=https://url-shortener-3dom.onrender.com
```

### 4. Database Setup

Ensure PostgreSQL is running and create the database:

```bash
createdb url_shortener
```

### 5. Start Redis

Make sure Redis is running locally or update the REDIS_URL in your .env file.

### 6. Run the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The API will be available at `https://url-shortener-3dom.onrender.com`

## 🐳 Docker Deployment

### Local Docker Deployment

1. **Build and run with Docker Compose:**

```bash
docker-compose up --build
```

This will start:
- The Node.js application on port 3000
- PostgreSQL database on port 5432
- Redis cache on port 6379

### Production Deployment

For production deployment on cloud platforms:

1. **Build the Docker image:**

```bash
docker build -t url-shortener-api .
```

2. **Deploy to your preferred platform** (AWS ECS, Google Cloud Run, Railway, etc.)

## 📖 API Documentation

Once the server is running, access the interactive API documentation at:
`https://url-shortener-3dom.onrender.com/api/docs`

### Key Endpoints

#### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Handle OAuth callback
- `POST /auth/logout` - Logout user

#### URL Management
- `POST /api/shorten` - Create short URL
- `GET /api/urls` - Get user's URLs
- `DELETE /api/urls/:id` - Delete URL

#### Redirects
- `GET /:alias` - Redirect to original URL

#### Analytics
- `GET /api/analytics/:alias` - URL-specific analytics
- `GET /api/analytics/topic/:topic` - Topic-based analytics
- `GET /api/analytics/urls/overall` - Overall user analytics

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Test Coverage

The test suite covers:
- Authentication flows
- URL creation and validation
- Redirect functionality
- Analytics calculations
- Rate limiting
- Error handling

## 🔧 Configuration

### Rate Limiting

Configure rate limits in your `.env` file:

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

### Caching

Redis caching is used for:
- URL mappings (1 hour TTL)
- Analytics data (5 minutes TTL)
- Rate limiting counters

### Database Schema

The application uses three main models:

1. **User**: Stores user information from Google OAuth
2. **Url**: Stores URL mappings and metadata
3. **Click**: Stores detailed analytics for each click

## 🚀 Deployment Guide

### Railway Deployment

1. Fork this repository
2. Connect your Railway account to GitHub
3. Create a new project and select this repository
4. Add the following environment variables in Railway:
   - All variables from `.env` file
   - Update `BASE_URL` to your Railway domain
5. Deploy!

### Other Platforms

The application is compatible with:
- **Heroku**: Add Heroku Postgres and Redis add-ons
- **AWS ECS**: Use the provided Docker configuration
- **Google Cloud Run**: Deploy using the Docker image
- **DigitalOcean App Platform**: Use the Docker setup

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive input sanitization
- **Security Headers**: Helmet.js security middleware
- **SQL Injection Protection**: Sequelize ORM parameterized queries
- **CORS Configuration**: Configurable cross-origin resource sharing

## 📊 Monitoring & Analytics

The application provides detailed analytics including:

- **Click Tracking**: Every URL access is logged
- **Device Detection**: OS, browser, and device type identification
- **Geolocation**: Country, region, and city tracking
- **Unique User Tracking**: IP-based unique user identification
- **Time-series Data**: 7-day historical analytics

## 📝 Challenges Faced & Solutions

### 1. **Unique Short Code Generation**
**Challenge**: Ensuring generated short codes are always unique while maintaining performance.

**Solution**: Implemented a retry mechanism with nanoid for unique code generation, with database-level unique constraints as a fallback.

### 2. **Analytics Performance**
**Challenge**: Real-time analytics queries could become expensive with large datasets.

**Solution**: Implemented Redis caching for analytics data with appropriate TTL, and optimized database queries with proper indexing.

### 3. **Rate Limiting Accuracy**
**Challenge**: Implementing accurate rate limiting that works across multiple server instances.

**Solution**: Used Redis-based rate limiting to ensure consistency across distributed deployments.

### 4. **User Agent Parsing**
**Challenge**: Accurately parsing user agents for device and OS analytics.

**Solution**: Integrated UA-Parser-js library for reliable user agent parsing with fallback handling.

### 5. **Geolocation Accuracy**
**Challenge**: Providing accurate geolocation without external API dependencies.

**Solution**: Used GeoIP-Lite for offline IP geolocation with reasonable accuracy for analytics purposes.

## 🔮 Future Enhancements

- **Custom Domains**: Allow users to use their own domains
- **QR Code Generation**: Generate QR codes for short URLs
- **Link Expiration**: Set expiration dates for URLs
- **Bulk URL Creation**: API endpoint for creating multiple URLs
- **Advanced Analytics**: Click heatmaps, referrer analytics
- **API Keys**: Allow programmatic access via API keys
- **Team Management**: Multi-user account management
- **A/B Testing**: Built-in A/B testing for URLs

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Web framework
- [Sequelize](https://sequelize.org/) - ORM
- [Passport.js](http://www.passportjs.org/) - Authentication
- [Redis](https://redis.io/) - Caching
- [Swagger](https://swagger.io/) - API documentation

---

For questions or support, please open an issue in the GitHub repository.