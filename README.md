# 🚀 AlgoRave - Online Judge System

A comprehensive online judge system for competitive programming with real-time leaderboards, contests, and problem-solving features. Built with Node.js, React, and MongoDB.

![AlgoRave Logo](frontend/src/Components/Assets/logo.jpg)

## ✨ Features

### 🎯 Core Features
- **User Authentication**: Secure JWT-based authentication with username/email login
- **Problem Management**: Create and solve algorithmic problems with multiple difficulty levels
- **Contest System**: Participate in rated and practice contests with real-time rankings
- **Leaderboard**: Global rankings with multiple sorting options and time-based filtering
- **Code Submission**: Support for multiple programming languages (C++, Java, Python, JavaScript)
- **User Profiles**: Comprehensive user statistics and achievement badges
- **Real-time Statistics**: Track problems solved, contest performance, and rating changes

### 🏆 Badge System
- **Code Novice**: Starting badge for new users
- **Algorithm Ace**: 10+ problems solved, rating ≥1400
- **Problem Slayer**: 20+ problems solved, rating ≥1600
- **Contest Conqueror**: 30+ problems solved, rating ≥1800
- **Grandmaster Coder**: 50+ problems solved, rating ≥2000

### 🎮 Contest Types
- **Rated Contests**: Affects user rating and ranking
- **Practice Contests**: For learning and practice without rating impact

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Main Server**: `backend/index.js` - Handles authentication, problems, contests, and submissions
- **Compiler Service**: `compiler-backend/` - Dedicated service for code execution
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with bcrypt password hashing

### Frontend (React)
- **Components**: Modular React components for each feature
- **Routing**: React Router for navigation
- **State Management**: Local state with localStorage for user data
- **Styling**: CSS modules with responsive design

### Database Models
- **User**: Authentication, profile, statistics, badges
- **Problem**: Problem statements, test cases, difficulty levels
- **Contest**: Contest details, participants, problems
- **Submission**: Code submissions, test results, scores
- **Leaderboard**: User rankings and statistics
- **Discussion**: Problem discussions and comments

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- **Docker** (for compiler-backend code execution)
- Python 3.x (for Python code execution)
- Java JDK (for Java code execution)
- C++ compiler (for C++ code execution)

### Docker Setup (Required for Compiler Backend)
The compiler-backend uses Docker for secure code execution. This is essential for:
- **Security**: Isolates user code execution from the host system
- **Consistency**: Ensures the same execution environment across different platforms
- **Resource Management**: Controls memory and CPU usage for code execution

Install Docker:
- **Windows/macOS**: Download from [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow [Docker installation guide](https://docs.docker.com/engine/install/)

Verify Docker installation:
```bash
docker --version
docker-compose --version
```

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Online_Judge-AlgoRave-1
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Create and configure environment variables
```

Configure your `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/algorave
SECRET_KEY=your_jwt_secret_key_here
PORT=5000
```

Start the backend server:
```bash
npm run dev           # Start development server
npm run init-data     # Initialize sample data
```

### 3. Compiler Backend Setup (Docker Required)
```bash
cd compiler-backend
npm install
```

Create a `.env` file for the compiler service:
```env
GOOGLE_GEMINI_API=your_gemini_api_key_here
PORT=8000
NODE_ENV=production
```

**Option A: Using Docker (Recommended for Production)**
```bash
# Build and start the Docker container
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

**Option B: Local Development (Without Docker)**
```bash
# Install system dependencies manually
# On Ubuntu/Debian:
sudo apt-get update && sudo apt-get install -y g++ python3 openjdk-17-jdk

# On macOS:
brew install gcc python3 openjdk@17

# On Windows:
# Install MinGW for g++, Python 3, and OpenJDK 17

# Then start the service
npm run dev
```

**Note**: Using Docker is strongly recommended as it provides better security and consistency for code execution.

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Start the React development server:
```bash
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: https://algorave.me
- **Compiler Service**: http://localhost:8000

## 🐳 Docker Management

### Compiler Backend Docker Commands
```bash
cd compiler-backend

# Build and start the container
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop the container
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up --build --force-recreate
```

### Docker Container Details
The compiler-backend Docker container includes:
- **Node.js 24 Alpine**: Lightweight base image
- **System Dependencies**: g++, python3, openjdk17-jdk
- **Volume Mounts**: 
  - `./outputs:/app/outputs` - For storing execution outputs
  - `./codes:/app/codes` - For temporary code files
- **Port Mapping**: `8000:8000` - Exposes the compiler service

### Security Features
- **Isolated Execution**: User code runs in a contained environment
- **Resource Limits**: Memory and CPU usage are controlled
- **File System Isolation**: Code cannot access host files outside the container
- **Network Isolation**: Code execution is isolated from network access

## 📡 API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout

### Problems
- `GET /api/problems` - Get all problems
- `GET /api/problems/:id` - Get specific problem
- `GET /api/problems/code/:code` - Get problem by code
- `POST /api/problems/:id/submit` - Submit solution
- `POST /api/problems/code/:code/submit` - Submit solution by code
- `GET /api/problems/:id/submissions` - Get user submissions for problem

### Contests
- `GET /api/contests` - Get all contests
- `GET /api/contests/status/:status` - Get contests by status
- `GET /api/contests/:id` - Get specific contest
- `POST /api/contests/:id/register` - Register for contest
- `POST /api/contests/:id/unregister` - Unregister from contest
- `POST /api/contests/:id/end` - End contest (admin only)
- `GET /api/contests/:id/results` - Get contest results

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/stats` - Get user statistics
- `PUT /api/user/stats` - Update user statistics
- `GET /api/user/submissions` - Get user submissions
- `GET /api/user/contests` - Get user's registered contests
- `GET /api/user/contest-results` - Get user contest results

### Leaderboard
- `GET /api/leaderboard` - Get global leaderboard
- `GET /api/leaderboard/user/:userId` - Get specific user stats
- `PUT /api/leaderboard/user/:userId` - Update user leaderboard stats

### Discussions
- `GET /api/problems/:problemId/discussions` - Get problem discussions
- `POST /api/problems/:problemId/discussions` - Post new discussion

### Admin Endpoints
- `POST /admin/problem` - Create new problem
- `POST /admin/testcase` - Add test case to problem
- `POST /admin/contest` - Create new contest

## 🎯 Key Features Explained

### Code Execution System
The system supports multiple programming languages:
- **C++**: Compiled and executed with g++
- **Python**: Interpreted with Python 3
- **Java**: Compiled with javac and executed with java
- **JavaScript**: Executed with Node.js

### Rating System
- Base rating: 1500
- +10 points per problem solved
- +5 points per contest participated
- Bonus points for top 10 contest finishes

### Contest Management
- **Automatic Status Updates**: Contests automatically transition from upcoming → ongoing → past
- **Real-time Registration**: Users can register/unregister for contests
- **Performance Tracking**: Detailed contest results with rankings and scores

### Problem Management
- **Test Cases**: Support for multiple test cases per problem
- **Sample Cases**: Built-in sample test cases for problem understanding
- **Difficulty Levels**: Easy, Medium, Hard categorization
- **Tags**: Problem categorization (arrays, dp, binary search, etc.)

## ⏱️ Time and Memory Limit Enforcement

### Limit Configuration
Each problem has configurable limits defined in the Problem model:
- **Time Limit**: 1000ms (1 second) - configurable per problem (100ms to 10000ms)
- **Memory Limit**: 256MB - configurable per problem (1MB to 512MB)

### Enforcement Mechanism
- **Time Limit**: Uses Node.js `setTimeout()` to kill processes after the specified time limit
- **Memory Limit**: Monitors memory usage every 50ms and kills processes when limits are exceeded
- **Cross-platform Support**: Memory monitoring works on Windows, Linux, and macOS

### Status Codes
| Status | Description | When It Occurs |
|--------|-------------|----------------|
| `accepted` | Solution is correct | All test cases pass |
| `time_limit_exceeded` | TLE | Execution time exceeds limit |
| `memory_limit_exceeded` | MLE | Memory usage exceeds limit |
| `compilation_error` | CE | Code fails to compile |
| `wrong_answer` | WA | Output doesn't match expected |
| `runtime_error` | RE | Program crashes or throws exception |

### Language-Specific Considerations
- **C++**: Compiled with `g++`, runs compiled binary with input piped to stdin
- **Python**: Direct execution with `python` interpreter
- **Java**: Compiled with `javac`, runs with `java` interpreter
- **JavaScript**: Executed with Node.js

## 🔧 Development

### Project Structure
```
Online_Judge-AlgoRave-1/
├── backend/                 # Main backend server
│   ├── model/              # Database models
│   │   ├── middleware/     # Authentication middleware
│   │   ├── services/       # Business logic services
│   │   └── index.js        # Main server file
│   ├── scripts/            # Database initialization
│   └── README.md           # This file
├── compiler-backend/       # Code execution service
│   ├── executeCpp.js       # C++ execution
│   ├── generateFile.js     # File generation utilities
│   └── index.js            # Compiler service
├── frontend/               # React frontend
│   ├── src/
│   │   ├── Components/     # React components
│   │   ├── utils/          # Utility functions
│   │   └── theme.js        # Theme configuration
│   └── public/             # Static assets
└── README.md               # This file
```

### Running Tests
```bash
# Backend tests (when implemented)
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Style
- Backend: ESLint with Node.js standards
- Frontend: ESLint with React standards

### Database Migrations
The system automatically handles schema updates. For major changes:
```bash
cd backend
npm run init-data  # Reinitialize with new schema
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set:
- `MONGODB_URI`: MongoDB connection string
- `SECRET_KEY`: JWT secret key
- `PORT`: Server port (default: 5000)

### Production Build
```bash
# Frontend build
cd frontend
npm run build

# Backend (use PM2 or similar)
cd backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Code Execution**: Verify Python, Java, and C++ compilers are installed
3. **Port Conflicts**: Check if ports 3000, 5000, and 8000 are available

### Getting Help
1. Check the documentation above
2. Search existing issues
3. Create a new issue with detailed information:
   - Error messages
   - Steps to reproduce
   - Environment details

## 🎉 Acknowledgments

- Built with ❤️ for the competitive programming community
- Inspired by platforms like Codeforces, LeetCode, and HackerRank
- Special thanks to all contributors and users

---

**AlgoRave** - Where algorithms meet excellence! 🚀
