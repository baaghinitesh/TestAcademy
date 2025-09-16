# 📚 TestAcademy Enhanced V2 API Documentation

## Overview

This document provides comprehensive documentation for the TestAcademy Enhanced V2 APIs, specifically designed for hierarchical question management, advanced bulk operations, and enterprise-grade performance.

---

## 🚀 Key Features

- **Hierarchical Structure**: Full support for Class → Subject → Chapter → Topic → Subtopic
- **Advanced Filtering**: 20+ filter options with compound query support
- **Bulk Operations**: Process thousands of questions efficiently
- **Auto-Test Creation**: Automatic test generation from uploaded questions
- **Analytics Integration**: Usage tracking and performance metrics
- **Enterprise Performance**: Optimized for lakhs of questions with sub-second response times

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Enhanced Questions API V2](#enhanced-questions-api-v2)
3. [Bulk Upload API V2](#bulk-upload-api-v2)
4. [Enhanced Materials API](#enhanced-materials-api)
5. [Enhanced Tests API](#enhanced-tests-api)
6. [Performance Monitoring API](#performance-monitoring-api)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Examples](#examples)

---

## 🔐 Authentication

All V2 APIs require proper authentication using JWT tokens.

### Headers Required
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout  
- `GET /api/auth/me` - Get current user info

---

## 📝 Enhanced Questions API V2

### Base URL
`/api/questions/enhanced-v2`

### 1. Get Questions (Advanced Filtering)

**GET** `/api/questions/enhanced-v2`

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number (default: 1) | `?page=2` |
| `limit` | number | Items per page (default: 20, max: 100) | `?limit=50` |
| `sortBy` | string | Sort field | `?sortBy=createdAt` |
| `sortOrder` | string | Sort order: 'asc' or 'desc' | `?sortOrder=desc` |
| `search` | string | Search in question text | `?search=linear+equations` |
| `classNumber` | number | Filter by class | `?classNumber=10` |
| `subject` | string | Filter by subject | `?subject=Mathematics` |
| `chapter` | string | Filter by chapter | `?chapter=Linear+Equations` |
| `topic` | string | Filter by topic | `?topic=Solving+Methods` |
| `subtopic` | string | Filter by subtopic | `?subtopic=Quadratic+Formula` |
| `difficulty` | string | easy, medium, hard | `?difficulty=medium` |
| `questionType` | string | Question type | `?questionType=single-choice` |
| `bloomsTaxonomy` | string | Bloom's level | `?bloomsTaxonomy=apply` |
| `verificationStatus` | string | pending, approved, rejected | `?verificationStatus=approved` |
| `isActive` | boolean | Active status | `?isActive=true` |
| `tags` | string | Comma-separated tags | `?tags=important,exam` |
| `createdBy` | string | Filter by creator | `?createdBy=admin` |
| `dateFrom` | string | Date range start (ISO string) | `?dateFrom=2024-01-01` |
| `dateTo` | string | Date range end (ISO string) | `?dateTo=2024-12-31` |
| `usageCountMin` | number | Minimum usage count | `?usageCountMin=10` |
| `correctAnswerRateMin` | number | Minimum success rate (0-1) | `?correctAnswerRateMin=0.7` |

#### Response

```json
{
  "success": true,
  "questions": [
    {
      "_id": "675a1b2c3d4e5f6g7h8i9j0k",
      "question": "Solve for x: 2x + 5 = 15",
      "questionType": "single-choice",
      "subject": "Mathematics",
      "classNumber": 8,
      "chapter": "Linear Equations",
      "topic": "Solving Linear Equations",
      "subtopic": "One Variable",
      "difficulty": "medium",
      "marks": 2,
      "options": [
        { "text": "x = 5", "isCorrect": true },
        { "text": "x = 10", "isCorrect": false },
        { "text": "x = -5", "isCorrect": false },
        { "text": "x = 15", "isCorrect": false }
      ],
      "explanation": "To solve 2x + 5 = 15, subtract 5 from both sides: 2x = 10, then divide by 2: x = 5",
      "questionImageUrl": null,
      "explanationImageUrl": null,
      "tags": ["algebra", "linear-equations", "basic"],
      "bloomsTaxonomy": "apply",
      "estimatedTime": 90,
      "prerequisites": ["basic-algebra"],
      "learningOutcomes": ["solve-linear-equations"],
      "isActive": true,
      "isVerified": true,
      "verificationStatus": "approved",
      "createdBy": "teacher-001",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z",
      "usageCount": 25,
      "correctAnswerRate": 0.78,
      "avgTimeSpent": 85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "totalPages": 63
  },
  "hierarchyStats": {
    "totalQuestions": 1250,
    "byClass": {
      "8": 320,
      "9": 425,
      "10": 505
    },
    "bySubject": {
      "Mathematics": 850,
      "Physics": 240,
      "Chemistry": 160
    },
    "byDifficulty": {
      "easy": 400,
      "medium": 600,
      "hard": 250
    },
    "byStatus": {
      "active": 1100,
      "pending": 120,
      "rejected": 30
    },
    "hierarchicalBreakdown": {
      "Class 8": {
        "Mathematics": {
          "Linear Equations": {
            "Solving Methods": 45,
            "Word Problems": 32
          }
        }
      }
    }
  }
}
```

### 2. Create Question

**POST** `/api/questions/enhanced-v2`

#### Request Body

```json
{
  "question": "What is the value of π (pi) approximately?",
  "questionType": "single-choice",
  "subject": "Mathematics",
  "classNumber": 7,
  "chapter": "Geometry",
  "topic": "Circles",
  "subtopic": "Properties",
  "difficulty": "easy",
  "marks": 1,
  "options": [
    { "text": "3.14159", "isCorrect": true },
    { "text": "2.71828", "isCorrect": false },
    { "text": "1.41421", "isCorrect": false },
    { "text": "1.73205", "isCorrect": false }
  ],
  "explanation": "π (pi) is approximately 3.14159, representing the ratio of circumference to diameter.",
  "tags": ["geometry", "circles", "constants"],
  "bloomsTaxonomy": "remember",
  "estimatedTime": 30,
  "prerequisites": ["basic-geometry"],
  "learningOutcomes": ["understand-pi-value"]
}
```

#### Response

```json
{
  "success": true,
  "message": "Question created successfully",
  "questionId": "675a1b2c3d4e5f6g7h8i9j0k",
  "autoTestCreated": {
    "testId": "675b2c3d4e5f6g7h8i9j0k1l",
    "testTitle": "Class 7 - Mathematics - Geometry - Auto Test",
    "questionsCount": 1
  }
}
```

### 3. Update Question

**PUT** `/api/questions/enhanced-v2/:id`

Uses same request body as create. Returns updated question object.

### 4. Delete Question

**DELETE** `/api/questions/enhanced-v2/:id`

#### Response

```json
{
  "success": true,
  "message": "Question deleted successfully"
}
```

### 5. Bulk Operations

**PATCH** `/api/questions/enhanced-v2`

#### Request Body

```json
{
  "operation": "activate",  // "activate", "deactivate", "verify", "reject", "delete"
  "questionIds": [
    "675a1b2c3d4e5f6g7h8i9j0k",
    "675b2c3d4e5f6g7h8i9j0k1l"
  ],
  "verificationNotes": "Approved after review"  // Optional, for verify/reject operations
}
```

#### Response

```json
{
  "success": true,
  "message": "Bulk operation completed",
  "results": {
    "processed": 2,
    "successful": 2,
    "failed": 0,
    "errors": []
  }
}
```

### 6. Export Questions

**GET** `/api/questions/enhanced-v2/export?format=csv`

#### Query Parameters

All the same filtering parameters as the main GET endpoint, plus:

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | string | Export format: 'csv', 'json', 'pdf' |

#### Response

Returns file download with appropriate content type.

---

## 📤 Bulk Upload API V2

### Base URL
`/api/questions/bulk-upload-v2`

### 1. Upload CSV File

**POST** `/api/questions/bulk-upload-v2`

#### Request

Multipart form data with:
- `file`: CSV file (required)
- `createAutoTests`: boolean (default: true)
- `overwriteExisting`: boolean (default: false)

#### CSV Format

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| question | ✅ | Question text | "Solve for x: 2x + 5 = 15" |
| questionType | ✅ | Type of question | "single-choice" |
| subject | ✅ | Subject name | "Mathematics" |
| classNumber | ✅ | Class number | "8" |
| chapter | ✅ | Chapter name | "Linear Equations" |
| topic | ✅ | Topic name | "Solving Methods" |
| subtopic | ❌ | Subtopic (optional) | "One Variable" |
| difficulty | ✅ | Difficulty level | "medium" |
| marks | ✅ | Marks for question | "2" |
| option1 | ✅ | First option | "x = 5" |
| option1_correct | ✅ | Is option 1 correct | "true" |
| option2 | ✅ | Second option | "x = 10" |
| option2_correct | ✅ | Is option 2 correct | "false" |
| option3 | ❌ | Third option (optional) | "x = -5" |
| option3_correct | ❌ | Is option 3 correct | "false" |
| option4 | ❌ | Fourth option (optional) | "x = 15" |
| option4_correct | ❌ | Is option 4 correct | "false" |
| explanation | ❌ | Explanation (optional) | "Subtract 5, then divide by 2" |
| tags | ❌ | Comma-separated tags | "algebra,linear-equations" |
| bloomsTaxonomy | ❌ | Bloom's level | "apply" |
| estimatedTime | ❌ | Time in seconds | "90" |

#### Response

```json
{
  "success": true,
  "message": "Upload initiated",
  "sessionId": "upload_675a1b2c3d4e5f6g7h8i9j0k",
  "status": "processing",
  "progress": 0,
  "totalRows": 150,
  "processedRows": 0,
  "successCount": 0,
  "errorCount": 0,
  "errors": [],
  "autoTestsCreated": []
}
```

### 2. Check Upload Progress

**GET** `/api/questions/bulk-upload-v2?sessionId=upload_675a1b2c3d4e5f6g7h8i9j0k`

#### Response

```json
{
  "success": true,
  "sessionId": "upload_675a1b2c3d4e5f6g7h8i9j0k",
  "status": "completed",  // "processing", "completed", "failed"
  "progress": 100,
  "totalRows": 150,
  "processedRows": 150,
  "successCount": 142,
  "errorCount": 8,
  "errors": [
    {
      "row": 25,
      "field": "classNumber",
      "message": "Invalid class number: must be between 6-12"
    },
    {
      "row": 47,
      "field": "options",
      "message": "At least one correct option required"
    }
  ],
  "autoTestsCreated": [
    {
      "className": 8,
      "subject": "Mathematics",
      "chapter": "Linear Equations",
      "testId": "675b2c3d4e5f6g7h8i9j0k1l",
      "testTitle": "Class 8 - Mathematics - Linear Equations - Auto Test",
      "questionsCount": 45
    },
    {
      "className": 9,
      "subject": "Physics",
      "chapter": "Motion",
      "testId": "675c3d4e5f6g7h8i9j0k1l2m",
      "testTitle": "Class 9 - Physics - Motion - Auto Test",
      "questionsCount": 32
    }
  ]
}
```

---

## 📚 Enhanced Materials API

### Base URL
`/api/materials/enhanced`

### 1. Get Materials

**GET** `/api/materials/enhanced`

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `search` | string | Search materials |
| `subject` | string | Filter by subject |
| `classNumber` | number | Filter by class |
| `chapter` | string | Filter by chapter |
| `materialType` | string | pdf, video, image, document |
| `isActive` | boolean | Active status |

#### Response

```json
{
  "success": true,
  "materials": [
    {
      "_id": "675a1b2c3d4e5f6g7h8i9j0k",
      "title": "Linear Equations - Introduction",
      "description": "Comprehensive guide to linear equations",
      "subject": "Mathematics",
      "classNumber": 8,
      "chapter": "Linear Equations",
      "topic": "Introduction",
      "materialType": "pdf",
      "fileUrl": "/uploads/materials/linear-equations-intro.pdf",
      "thumbnailUrl": "/uploads/thumbnails/linear-equations-intro.jpg",
      "fileSize": 2458624,
      "duration": null,
      "tags": ["algebra", "equations", "introduction"],
      "difficulty": "medium",
      "prerequisites": ["basic-algebra"],
      "learningOutcomes": ["understand-linear-equations"],
      "isActive": true,
      "viewCount": 156,
      "averageRating": 4.2,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 85,
    "totalPages": 5
  }
}
```

### 2. Upload Material

**POST** `/api/materials/enhanced`

Multipart form data with material file and metadata.

---

## 🧪 Enhanced Tests API

### Base URL
`/api/tests`

### 1. Get Tests

**GET** `/api/tests`

Similar structure to questions API with filtering options.

### 2. Auto-Grade Test

**POST** `/api/tests/auto-grade`

#### Request Body

```json
{
  "testId": "675a1b2c3d4e5f6g7h8i9j0k",
  "studentAnswers": {
    "675b2c3d4e5f6g7h8i9j0k1l": ["option1"],
    "675c3d4e5f6g7h8i9j0k1l2m": ["option2", "option3"]
  }
}
```

#### Response

```json
{
  "success": true,
  "results": {
    "totalQuestions": 20,
    "correctAnswers": 16,
    "incorrectAnswers": 4,
    "skippedAnswers": 0,
    "totalMarks": 40,
    "obtainedMarks": 32,
    "percentage": 80,
    "grade": "A",
    "timeTaken": 1800,
    "questionResults": [
      {
        "questionId": "675b2c3d4e5f6g7h8i9j0k1l",
        "isCorrect": true,
        "marksObtained": 2,
        "timeTaken": 85,
        "studentAnswer": ["option1"],
        "correctAnswer": ["option1"]
      }
    ],
    "categoryWiseAnalysis": {
      "Linear Equations": {
        "correct": 8,
        "total": 10,
        "percentage": 80
      }
    }
  }
}
```

---

## 📊 Performance Monitoring API

### Base URL
`/api/performance/monitor`

### 1. Get Performance Metrics

**GET** `/api/performance/monitor`

#### Response

```json
{
  "success": true,
  "metrics": {
    "database": {
      "connectionCount": 12,
      "avgQueryTime": 45.2,
      "slowQueries": 3
    },
    "api": {
      "requestsPerMinute": 250,
      "averageResponseTime": 120,
      "errorRate": 0.02
    },
    "questions": {
      "totalCount": 125000,
      "activeCount": 110000,
      "verificationPending": 5000
    },
    "cache": {
      "hitRate": 0.85,
      "memoryUsage": "45%"
    }
  }
}
```

---

## ❌ Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "classNumber",
      "value": "13",
      "constraint": "must be between 6-12"
    }
  },
  "timestamp": "2024-01-20T10:30:00.000Z",
  "requestId": "req_675a1b2c3d4e5f6g7h8i9j0k"
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `AUTHENTICATION_ERROR` | Invalid or missing auth token | 401 |
| `AUTHORIZATION_ERROR` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `DUPLICATE_ERROR` | Resource already exists | 409 |
| `RATE_LIMIT_ERROR` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

---

## 🚦 Rate Limiting

### Limits

- **General API**: 1000 requests per minute per user
- **Bulk Upload**: 5 uploads per minute per user
- **Search API**: 100 requests per minute per user

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1705840200
```

---

## 📖 Examples

### 1. Advanced Question Search

```bash
# Search for Class 8 Mathematics Linear Equations with medium difficulty
curl -X GET \
  "https://api.testacademy.com/api/questions/enhanced-v2?classNumber=8&subject=Mathematics&chapter=Linear%20Equations&difficulty=medium&verificationStatus=approved&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Bulk Upload with Progress Tracking

```bash
# Upload CSV file
curl -X POST \
  "https://api.testacademy.com/api/questions/bulk-upload-v2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@questions.csv" \
  -F "createAutoTests=true"

# Check progress
curl -X GET \
  "https://api.testacademy.com/api/questions/bulk-upload-v2?sessionId=upload_123456" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Hierarchical Statistics

```bash
# Get detailed hierarchy breakdown
curl -X GET \
  "https://api.testacademy.com/api/questions/enhanced-v2?limit=1&includeStats=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Performance Analytics

```bash
# Get question usage analytics
curl -X GET \
  "https://api.testacademy.com/api/questions/enhanced-v2?sortBy=usageCount&sortOrder=desc&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔧 Migration Guide

### From V1 to V2

1. **Run Migration Script**
   ```bash
   npm run migrate:questions-v2:dry-run  # Test first
   npm run migrate:questions-v2         # Actual migration
   ```

2. **Update Frontend Code**
   - Replace `/api/questions` with `/api/questions/enhanced-v2`
   - Add new filter parameters
   - Update response handling for new structure

3. **Performance Optimization**
   - Compound indexes are automatically created
   - Enable caching for frequently accessed data
   - Monitor performance metrics

---

## 📞 Support

For API support and documentation updates:
- **Email**: api-support@testacademy.com
- **Documentation**: Updated regularly with new features
- **Changelog**: See `CHANGELOG.md` for version history

---

*Last Updated: January 2024 | Version: 2.0.0*