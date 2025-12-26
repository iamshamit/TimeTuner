# 📋 PHASE 18: Documentation & Handover

> **Duration:** 2-3 days  
> **Dependencies:** Phase 17

---

## 🎯 Phase Objectives

Create comprehensive documentation for developers, admins, and end users.

---

## 📑 Task Breakdown

---

### 18.1-18.2 API Documentation

```bash
npm install swagger-jsdoc swagger-ui-express
```

```javascript
// backend/src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TimeTuner API',
      version: '1.0.0',
      description: 'Smart Classroom & Timetable Scheduler API'
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

module.exports = swaggerJsdoc(options);

// In app.js
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

**Example Route Documentation:**
```javascript
/**
 * @swagger
 * /faculties:
 *   get:
 *     summary: Get all faculties
 *     tags: [Faculties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of faculties
 */
```

---

### 18.3-18.6 User & Technical Documentation

Create in `docs/` folder:

**docs/user-guide.md:**
- Getting started
- Login and roles
- Managing entities
- Generating timetables
- Editing and approving
- Exporting

**docs/admin-guide.md:**
- System configuration
- User management
- Constraint setup
- Backup procedures

**docs/technical-architecture.md:**
- System overview diagram
- Service descriptions
- Data flow
- API contracts

**docs/database-schema.md:**
- All collections
- Field descriptions
- Relationships

---

### 18.7-18.10 Deployment & Troubleshooting

**docs/deployment-guide.md:**
```markdown
# Deployment Guide

## Prerequisites
- Docker & Docker Compose
- MongoDB Atlas account
- Redis (Upstash) account

## Steps
1. Clone repository
2. Copy `.env.example` to `.env` and fill values
3. Run `docker-compose up -d`
4. Access at http://localhost

## Production
1. Push to main branch
2. CI/CD will build and deploy
3. Verify at production URL
```

**docs/troubleshooting.md:**
```markdown
# Troubleshooting

## Solver Times Out
- Reduce number of batches
- Lower constraint weights
- Check for conflicting fixed slots

## Login Fails
- Check JWT_ACCESS_SECRET is set
- Verify MongoDB connection
- Check password format

## No Timetable Generated
- Ensure qualified faculty exists
- Check room capacities
- Review constraint configuration
```

---

## ✅ Phase 18 Completion Checklist

```
□ Swagger API docs at /api-docs
□ Solver API documented
□ User guide written
□ Admin guide written
□ Technical architecture doc
□ Database schema doc
□ Deployment guide
□ Troubleshooting guide
□ README updated
□ CONTRIBUTING.md added
```

---

## ⏭️ Next: Phase 19 - Future Enhancements
