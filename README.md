# Time Tracker Application

A comprehensive employee time tracking application built with modern web technologies, enabling precise work hour monitoring, reporting, and team productivity insights.

## Features

- User authentication and registration
- Time entry with punch-in/punch-out functionality
- Category tagging for time entries
- Daily and weekly progress tracking
- Visual statistics and reporting
- PDF export option for time reports
- Mobile-responsive design

## Tech Stack

- MongoDB for database storage
- Express.js for backend API
- React.js for frontend
- Node.js runtime
- Shadcn UI components
- Tailwind CSS for styling
- TypeScript for type safety
- Authentication with Passport.js

## Deployment

This application is configured for deployment on Render.com.

### Environment Variables Required

- `NODE_ENV`: Set to "production"
- `SESSION_SECRET`: A secure string for session management
- `MONGODB_URI`: Connection string to your MongoDB database

## Getting Started

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm start
```