# LMS Enhanced API Documentation

## 📚 Overview

This document provides comprehensive API documentation for all enhanced LMS endpoints. All APIs are designed to be **backward-compatible** with your existing system.

## 🔗 Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## 🔐 Authentication

All API endpoints require proper authentication. Include the authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📊 Response Format

All APIs return responses in this format:

```json
{
  "success": true|false,
  "message": "Response message",
  "data": {...},
  "error": "Error details (if any)",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## 🧠 Enhanced Question Management API

### 1. Search Questions with Advanced Filters

**Endpoint:** `POST /api/questions/enhanced`

**Request Body:**
```json
{
  "action": "search",
  "filters": {
    "classId": "string",
    "subjectId": "string", 
    "chapterId": "string",
    "topicId": "string",
    "type": "multiple_choice|true_false|fill_in_the_blank|matching",
    "difficulty": "beginner|intermediate|advanced",
    "searchText": "string",
    "hasImages": true|false,
    "verificationStatus": "pending|approved|rejected",
    "isActive": true|false,
    "createdBy": "userId",
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "analyticsFilter": {
      "minUsageCount": 0,
      "minAverageScore": 0,
      "maxAverageScore": 100
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 50,
      "totalQuestions": 1000,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {...}
  }
}
```

### 2. Create Enhanced Question

**Endpoint:** `POST /api/questions/enhanced`

**Request Body:**
```json
{
  "action": "create",
  "question": {
    "question": "What is the capital of France?",
    "type": "multiple_choice",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswers": ["Paris"],
    "hasMultipleCorrectAnswers": false,
    "difficulty": "beginner",
    "classId": "507f1f77bcf86cd799439011",
    "subjectId": "507f1f77bcf86cd799439012",
    "chapterId": "507f1f77bcf86cd799439013",
    "topicId": "507f1f77bcf86cd799439014",
    "explanation": "Paris is the capital city of France.",
    "hint": "Think about famous landmarks like the Eiffel Tower.",
    "tags": ["geography", "capitals", "europe"],
    "images": [
      {
        "url": "https://example.com/paris.jpg",
        "caption": "Eiffel Tower in Paris",
        "type": "reference"
      }
    ],
    "timeLimit": 60,
    "points": 1
  }
}
```

### 3. Bulk Operations

**Endpoint:** `POST /api/questions/enhanced`

**Bulk Update Request:**
```json
{
  "action": "bulk_update",
  "questionIds": ["id1", "id2", "id3"],
  "updates": {
    "difficulty": "intermediate",
    "verification.status": "approved",
    "isActive": true
  }
}
```

**Bulk Verify Request:**
```json
{
  "action": "bulk_verify",
  "questionIds": ["id1", "id2", "id3"],
  "verification": {
    "status": "approved",
    "verifiedBy": {
      "userId": "userId",
      "name": "Reviewer Name",
      "email": "reviewer@example.com"
    },
    "comments": "Questions approved after review"
  }
}
```

### 4. Bulk CSV Upload

**Endpoint:** `POST /api/questions/bulk-upload-enhanced`

**Request:** Multipart form data
- `file`: CSV file
- `options`: JSON string with upload options

**CSV Format:**
```csv
question,type,options,correctAnswers,difficulty,classId,subjectId,explanation
"What is 2+2?","multiple_choice","2|3|4|5","4","beginner","classId","subjectId","Basic addition"
```

**Upload Options:**
```json
{
  "classId": "507f1f77bcf86cd799439011",
  "subjectId": "507f1f77bcf86cd799439012",
  "chapterId": "507f1f77bcf86cd799439013",
  "topicId": "507f1f77bcf86cd799439014",
  "defaultDifficulty": "intermediate",
  "skipDuplicates": true,
  "validateOnly": false,
  "autoApprove": false
}
```

**Progress Tracking:** Use session ID to track upload progress
```http
GET /api/questions/bulk-upload-enhanced?sessionId=<session-id>
```

---

## 📚 Enhanced Materials Management API

### 1. Create Material with File Upload

**Endpoint:** `POST /api/materials/enhanced`

**Request:** Multipart form data
- `materialData`: JSON with material information
- `files`: Multiple files (PDF, images, videos, etc.)

**Material Data:**
```json
{
  "title": "Advanced Mathematics Guide",
  "description": "Comprehensive guide for calculus",
  "contentType": "pdf",
  "classId": "507f1f77bcf86cd799439011",
  "subjectId": "507f1f77bcf86cd799439012",
  "difficulty": "advanced",
  "prerequisites": ["Basic Algebra", "Trigonometry"],
  "learningObjectives": [
    "Understand derivatives",
    "Master integration techniques"
  ],
  "tags": ["calculus", "mathematics", "advanced"],
  "htmlContent": "<p>Rich text content here</p>",
  "externalUrl": "https://example.com/resource",
  "workflow": {
    "requiresApproval": true,
    "reviewers": ["userId1", "userId2"]
  }
}
```

### 2. Get Material with Analytics

**Endpoint:** `GET /api/materials/enhanced/:id`

**Query Parameters:**
- `includeAnalytics`: boolean
- `trackView`: boolean (increments view count)

**Response:**
```json
{
  "success": true,
  "data": {
    "material": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Advanced Mathematics Guide",
      "contentType": "pdf",
      "files": [
        {
          "originalName": "calculus_guide.pdf",
          "url": "https://cdn.example.com/files/calculus_guide.pdf",
          "thumbnailUrl": "https://cdn.example.com/thumbs/calculus_guide.jpg",
          "mimeType": "application/pdf",
          "size": 2048576,
          "pages": 125,
          "extractedText": "Content preview..."
        }
      ],
      "analytics": {
        "viewCount": 1250,
        "downloadCount": 340,
        "averageRating": 4.7,
        "ratingCount": 89
      },
      "metadata": {
        "wordCount": 15000,
        "readingTime": 45
      }
    }
  }
}
```

### 3. Search Materials with Filters

**Endpoint:** `POST /api/materials/enhanced`

**Request Body:**
```json
{
  "action": "search",
  "filters": {
    "classId": "string",
    "subjectId": "string",
    "contentType": "pdf|video|image|audio|text|url|mixed",
    "difficulty": "beginner|intermediate|advanced",
    "searchText": "calculus derivatives",
    "tags": ["mathematics", "calculus"],
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "hasFiles": true,
    "isActive": true,
    "workflow": {
      "status": "published"
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "sortBy": "analytics.viewCount",
    "sortOrder": "desc"
  }
}
```

---

## ✅ Enhanced Test System API

### 1. Create Enhanced Test

**Endpoint:** `POST /api/tests/enhanced`

**Request Body:**
```json
{
  "title": "Advanced Calculus Final Exam",
  "description": "Comprehensive final examination",
  "classId": "507f1f77bcf86cd799439011",
  "subjectId": "507f1f77bcf86cd799439012",
  "testType": "final",
  "difficulty": "advanced",
  "timeLimit": 120,
  "passingScore": 70,
  "maxAttempts": 2,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "showResultsImmediately": false,
  "allowReview": true,
  "questions": [
    {
      "questionId": "507f1f77bcf86cd799439015",
      "points": 5,
      "timeLimit": 300,
      "isRequired": true,
      "order": 1
    }
  ],
  "instructions": "Read all questions carefully...",
  "prerequisites": ["Calculus I", "Calculus II"],
  "learningObjectives": ["Evaluate complex integrals"],
  "startDate": "2024-06-01T09:00:00Z",
  "endDate": "2024-06-01T12:00:00Z"
}
```

### 2. Submit Test for Auto-Grading

**Endpoint:** `POST /api/tests/submit-enhanced`

**Request Body:**
```json
{
  "testId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "responses": [
    {
      "questionId": "507f1f77bcf86cd799439013",
      "selectedAnswers": ["Paris"],
      "textAnswer": "The capital of France",
      "timeSpent": 45,
      "isSkipped": false,
      "flagged": false,
      "visitCount": 1,
      "reviewNote": "Need to review this topic"
    }
  ],
  "totalTimeSpent": 3600,
  "submitType": "manual",
  "ipAddress": "192.168.1.1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "507f1f77bcf86cd799439014",
    "attemptNumber": 1,
    "submittedAt": "2024-01-01T10:30:00Z",
    "status": "submitted",
    "isGrading": true,
    "estimatedGradingTime": 30
  }
}
```

### 3. Auto-Grade Test Attempt

**Endpoint:** `POST /api/tests/auto-grade`

**Request Body:**
```json
{
  "attemptId": "507f1f77bcf86cd799439014"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "attemptId": "507f1f77bcf86cd799439014",
    "score": {
      "totalPoints": 85,
      "maxPoints": 100,
      "percentage": 85,
      "grade": "B+",
      "isPassed": true,
      "breakdown": {
        "correct": 17,
        "incorrect": 3,
        "skipped": 0,
        "flagged": 2
      }
    },
    "autoGrading": {
      "isAutoGraded": true,
      "confidence": 95,
      "needsReview": false
    },
    "feedback": {
      "overallFeedback": "Good performance overall...",
      "motivationalMessage": "Keep up the great work!"
    }
  }
}
```

### 4. Get Test Results with Analytics

**Endpoint:** `GET /api/tests/submit-enhanced?attemptId=<attempt-id>`

**Response:** Complete attempt data with detailed results, performance analytics, and recommendations.

---

## 📊 Performance Monitoring API

### 1. Get System Performance Metrics

**Endpoint:** `GET /api/performance/monitor`

**Query Parameters:**
- `metric`: system|database|cache|application (optional, returns all if not specified)
- `timeRange`: 1h|24h|7d|30d

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-01-01T10:30:00Z",
  "metrics": {
    "system": {
      "uptime": 86400,
      "memoryUsage": {
        "rss": 150,
        "heapTotal": 120,
        "heapUsed": 85,
        "external": 15
      },
      "cpuUsage": 25.5
    },
    "database": {
      "collections": {
        "questions": 50000,
        "tests": 1500,
        "attempts": 25000,
        "materials": 3000
      },
      "queryMetrics": {
        "averageQueryTime": 45,
        "slowQueryCount": 2
      }
    },
    "cache": {
      "connected": true,
      "hitRate": 87.5,
      "keyCount": 15000
    },
    "application": {
      "totalUsers": 10000,
      "totalQuestions": 50000,
      "activeUsers": 250,
      "recentActivity": {
        "questionsCreated": 15,
        "testsCreated": 3,
        "attemptsStarted": 89
      }
    }
  },
  "recommendations": [
    "Consider implementing memory optimization strategies",
    "High performance - no issues detected"
  ],
  "status": "healthy"
}
```

### 2. Health Check

**Endpoint:** `POST /api/performance/monitor`

**Request Body:**
```json
{
  "action": "health-check"
}
```

**Response:**
```json
{
  "success": true,
  "healthy": true,
  "checks": {
    "database": true,
    "cache": true,
    "memory": true,
    "disk": true
  },
  "timestamp": "2024-01-01T10:30:00Z"
}
```

---

## 📁 File Upload & Storage API

### Cloud Storage Configuration

**AWS S3 Setup:**
```json
{
  "provider": "aws",
  "maxFileSize": 10485760,
  "allowedTypes": [
    "image/jpeg", "image/png", "image/gif",
    "application/pdf", "video/mp4", "audio/mpeg"
  ],
  "thumbnailGeneration": true
}
```

### Direct Upload (Signed URLs)

**Endpoint:** `GET /api/upload/signed-url`

**Query Parameters:**
- `fileName`: string
- `fileType`: string
- `folder`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://presigned-s3-url...",
    "key": "uploads/file_uuid.pdf",
    "expiresIn": 3600
  }
}
```

---

## 🔧 Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "classId",
      "message": "ClassId is required"
    }
  },
  "timestamp": "2024-01-01T10:30:00Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error
- `DATABASE_ERROR`: Database operation failed
- `CACHE_ERROR`: Cache operation failed

---

## 📊 Rate Limiting

All APIs are rate-limited to ensure system stability:

- **Standard endpoints**: 100 requests per 15 minutes per IP
- **Upload endpoints**: 20 uploads per 15 minutes per user
- **Bulk operations**: 5 operations per 15 minutes per user
- **Auto-grading**: 50 submissions per 15 minutes per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🧪 Testing Examples

### cURL Examples

**Search Questions:**
```bash
curl -X POST http://localhost:3000/api/questions/enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "action": "search",
    "filters": {"difficulty": "advanced"},
    "pagination": {"page": 1, "limit": 10}
  }'
```

**Upload Material:**
```bash
curl -X POST http://localhost:3000/api/materials/enhanced \
  -H "Authorization: Bearer your-token" \
  -F 'files=@"/path/to/document.pdf"' \
  -F 'materialData={"title":"Test Document","contentType":"pdf"}'
```

### JavaScript SDK Example

```javascript
class LMSClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }
  
  async searchQuestions(filters, pagination = {}) {
    const response = await fetch(`${this.baseURL}/api/questions/enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({
        action: 'search',
        filters,
        pagination: { page: 1, limit: 20, ...pagination }
      })
    });
    
    return response.json();
  }
  
  async submitTest(testData) {
    const response = await fetch(`${this.baseURL}/api/tests/submit-enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(testData)
    });
    
    return response.json();
  }
}

// Usage
const client = new LMSClient('http://localhost:3000', 'your-jwt-token');
const results = await client.searchQuestions({
  difficulty: 'advanced',
  classId: 'class123'
});
```

---

## 🔄 Migration API

For migrating from existing models to enhanced versions:

**Endpoint:** `POST /api/migrate/questions`

**Request Body:**
```json
{
  "batchSize": 100,
  "dryRun": false,
  "preserveIds": true,
  "defaultValues": {
    "verification.status": "approved",
    "analytics.usageCount": 0
  }
}
```

This API documentation provides comprehensive coverage of all enhanced LMS features while maintaining compatibility with your existing system. All endpoints include proper error handling, validation, and performance optimizations.