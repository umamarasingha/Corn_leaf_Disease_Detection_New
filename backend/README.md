# Corn Leaf Disease Detector Backend

Complete Node.js/Express backend API for the Corn Leaf Disease Detector application.

## Features

- **Authentication**: JWT-based user authentication with role-based access control
- **Disease Detection**: AI-powered corn leaf disease detection using TensorFlow.js
- **Community Features**: Posts, comments, likes, and social feed
- **News Management**: Admin-controlled news articles
- **Admin Dashboard**: User management, statistics, data export
- **Chatbot**: AI-powered agricultural assistant
- **File Uploads**: Image upload support for posts and detections

## Technology Stack

- **Framework**: Express.js with TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Uploads**: Multer for image handling
- **AI/ML**: TensorFlow.js for disease detection
- **Security**: Helmet, CORS, rate limiting, input validation
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+ and npm
- Git

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=8000
NODE_ENV="development"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
CORS_ORIGIN="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Seed the database (optional):
```bash
npm run prisma:seed
```

## Running the Application

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:8000`

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/validate-token` - Validate JWT token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password
- `PUT /api/auth/profile` - Update profile

### Disease Detection
- `POST /api/analyze` - Analyze corn leaf image
- `GET /api/detection/history/:userId` - Get detection history
- `GET /api/detection/:detectionId` - Get detection details
- `DELETE /api/detection/:detectionId` - Delete detection

### Community
- `GET /api/community/posts` - Get all posts
- `POST /api/community/posts` - Create a post
- `GET /api/community/posts/:postId` - Get a post
- `POST /api/community/posts/:postId/like` - Like/unlike a post
- `POST /api/community/posts/:postId/comments` - Add a comment

### News
- `GET /api/news` - Get all news
- `GET /api/news/:newsId` - Get news item
- `POST /api/news` - Create news (admin only)
- `PUT /api/news/:newsId` - Update news (admin only)
- `DELETE /api/news/:newsId` - Delete news (admin only)

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user details
- `PUT /api/admin/users/:userId/role` - Update user role
- `GET /api/admin/users/:userId/role-history` - Get role history
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/export/:dataType` - Export data (CSV)

### Chatbot
- `POST /api/chat` - Send message to chatbot

## Database Schema

### User
- id, email, password, name, avatar, role, createdAt, updatedAt

### Post
- id, userId, title, content, images[], likesCount, createdAt, updatedAt

### Comment
- id, postId, userId, content, createdAt

### Like
- id, postId, userId, createdAt

### Detection
- id, userId, imageUrl, disease, confidence, severity, description, treatment, prevention, createdAt

### News
- id, title, content, image, createdAt, updatedAt

### RoleHistory
- id, userId, oldRole, newRole, changedBy, changedAt

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication with expiration
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- File upload restrictions (type, size)
- SQL injection prevention (Prisma ORM)

## Development

### Running Tests
```bash
npm test
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting

### Database Migrations
```bash
npx prisma migrate dev
```

### Prisma Studio
```bash
npx prisma studio
```

## Deployment

### Environment Variables
Ensure all environment variables are set in production:
- `DATABASE_URL`
- `JWT_SECRET` (use a strong, random secret)
- `CORS_ORIGIN` (set to your frontend domain)

### Build Process
```bash
npm run build
```

### Start Server
```bash
npm start
```

## API Documentation

Swagger documentation is available at `/api-docs` when running the server.

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### File Upload Issues
- Check UPLOAD_DIR exists and is writable
- Verify MAX_FILE_SIZE is appropriate
- Check file permissions

### AI Model Issues
- TensorFlow.js will fall back to mock predictions if model fails to load
- Check console logs for model loading errors

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
