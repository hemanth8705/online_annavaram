# Production Deployment Checklist

## 🔐 Security

### Environment Variables
- [ ] Change `JWT_SECRET` to a strong random string (min 64 characters)
- [ ] Update `ADMIN_EMAIL` and `ADMIN_PASSWORD` to production credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure production `MONGODB_URI` (not localhost)
- [ ] Update `CLIENT_URL` to production frontend URL
- [ ] Never commit `.env` file to version control

### Authentication & Authorization
- [ ] Verify JWT token expiration is appropriate (currently 7 days)
- [ ] Ensure all protected routes use `authenticateAdmin` middleware
- [ ] Test token expiration and renewal flow
- [ ] Consider implementing token refresh mechanism for longer sessions
- [ ] Add rate limiting for login endpoint (prevent brute force)

### Password Security
- [ ] Verify bcrypt salt rounds (currently 10, increase to 12+ for production)
- [ ] Implement password complexity requirements
- [ ] Add password change functionality for admins
- [ ] Consider adding 2FA for admin accounts

### API Security
- [ ] Enable HTTPS/SSL (use reverse proxy like nginx)
- [ ] Configure CORS properly for production domains only
- [ ] Add rate limiting middleware (express-rate-limit)
- [ ] Implement request size limits
- [ ] Add helmet.js for security headers
- [ ] Sanitize user inputs (express-mongo-sanitize)
- [ ] Add request logging (morgan or winston)

---

## 🗄️ Database

### MongoDB Configuration
- [ ] Use MongoDB Atlas or managed MongoDB service
- [ ] Enable authentication on MongoDB
- [ ] Create separate database user with minimal permissions
- [ ] Set up connection pooling
- [ ] Configure connection retry logic
- [ ] Enable SSL/TLS for database connections
- [ ] Set up automated backups
- [ ] Implement backup restore testing

### Data Management
- [ ] Plan for data migration strategy
- [ ] Set up database indexes for performance
- [ ] Implement database monitoring
- [ ] Configure slow query logging
- [ ] Plan for data archival strategy

---

## 🚀 Deployment

### Server Setup
- [ ] Choose hosting platform (AWS, Azure, DigitalOcean, Heroku, etc.)
- [ ] Set up production server (Ubuntu/CentOS recommended)
- [ ] Configure firewall rules
- [ ] Set up reverse proxy (nginx or Apache)
- [ ] Install Node.js (LTS version)
- [ ] Install PM2 or similar process manager
- [ ] Configure domain and DNS records
- [ ] Set up SSL certificate (Let's Encrypt)

### Application Deployment
- [ ] Clone repository to production server
- [ ] Install dependencies: `npm ci --production`
- [ ] Set environment variables
- [ ] Build application if needed
- [ ] Test application in staging environment first
- [ ] Set up PM2 ecosystem file
- [ ] Configure PM2 to start on system boot
- [ ] Set up log rotation

### Process Management (PM2 Example)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/server.js --name admin-backend

# Configure startup script
pm2 startup
pm2 save

# Monitor logs
pm2 logs admin-backend

# Monitor application
pm2 monit
```

---

## 📊 Monitoring & Logging

### Application Monitoring
- [ ] Set up application performance monitoring (New Relic, DataDog, etc.)
- [ ] Configure error tracking (Sentry, Rollbar, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Monitor API response times
- [ ] Track error rates and types
- [ ] Set up alerts for critical errors

### Logging
- [ ] Implement structured logging (winston)
- [ ] Set up centralized log management (ELK stack, Loggly, etc.)
- [ ] Configure log levels (error, warn, info, debug)
- [ ] Implement log rotation
- [ ] Store logs securely
- [ ] Set up log retention policy
- [ ] Add request/response logging middleware

### Health Checks
- [ ] Verify `/health` endpoint is accessible
- [ ] Add database connection check to health endpoint
- [ ] Implement liveness and readiness probes
- [ ] Set up automated health check monitoring

---

## ⚡ Performance

### API Optimization
- [ ] Enable gzip compression
- [ ] Implement caching strategy (Redis recommended)
- [ ] Add pagination to all list endpoints (already implemented)
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Implement query result caching
- [ ] Consider adding API versioning

### Load Testing
- [ ] Perform load testing (Apache JMeter, k6, etc.)
- [ ] Test concurrent user handling
- [ ] Identify and fix bottlenecks
- [ ] Set up auto-scaling if needed
- [ ] Test under peak load conditions

### Resource Management
- [ ] Configure Node.js memory limits
- [ ] Set up memory leak monitoring
- [ ] Optimize connection pooling
- [ ] Configure request timeouts
- [ ] Implement graceful shutdown

---

## 🔄 CI/CD

### Continuous Integration
- [ ] Set up GitHub Actions / GitLab CI / Jenkins
- [ ] Run tests on every commit
- [ ] Run linting checks
- [ ] Perform security scanning
- [ ] Build Docker images if using containers

### Continuous Deployment
- [ ] Set up staging environment
- [ ] Implement blue-green deployment
- [ ] Configure rollback strategy
- [ ] Set up deployment notifications
- [ ] Implement smoke tests after deployment
- [ ] Document deployment procedures

---

## 🧪 Testing

### Pre-Production Testing
- [ ] Run full API test suite: `npm run test`
- [ ] Test authentication flows
- [ ] Test all CRUD operations
- [ ] Test error handling
- [ ] Test edge cases and boundary conditions
- [ ] Perform security testing
- [ ] Test backup and restore procedures

### User Acceptance Testing
- [ ] Test complete admin workflows
- [ ] Verify all business rules
- [ ] Test with production-like data
- [ ] Get stakeholder approval

---

## 📝 Documentation

### Technical Documentation
- [ ] Update README with production specifics
- [ ] Document deployment procedures
- [ ] Document monitoring and alerting
- [ ] Create runbook for common issues
- [ ] Document backup and restore procedures
- [ ] Create architecture diagrams

### Operational Documentation
- [ ] Create admin user guide
- [ ] Document troubleshooting steps
- [ ] Create incident response plan
- [ ] Document scaling procedures
- [ ] Maintain changelog

---

## 🔧 Maintenance

### Regular Tasks
- [ ] Schedule regular dependency updates
- [ ] Monitor and patch security vulnerabilities
- [ ] Review and rotate logs
- [ ] Test backup restoration quarterly
- [ ] Review and update documentation
- [ ] Perform security audits

### Monitoring & Alerts
- [ ] Set up alerts for:
  - [ ] Server CPU > 80%
  - [ ] Memory usage > 80%
  - [ ] Disk space < 20%
  - [ ] API error rate > 5%
  - [ ] Response time > 3 seconds
  - [ ] Database connection failures
  - [ ] Authentication failures spike

---

## 📦 Docker Deployment (Optional)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 5001

CMD ["node", "src/server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  admin-backend:
    build: .
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/annavaram_admin
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

### Deployment Steps
- [ ] Create Dockerfile
- [ ] Create docker-compose.yml
- [ ] Build image: `docker build -t admin-backend .`
- [ ] Test locally: `docker-compose up`
- [ ] Push to container registry
- [ ] Deploy to container orchestration platform

---

## 🌐 Reverse Proxy Configuration (nginx)

### Sample nginx Configuration
```nginx
server {
    listen 80;
    server_name admin.annavaram.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- [ ] Install nginx
- [ ] Configure reverse proxy
- [ ] Set up SSL with Let's Encrypt
- [ ] Configure gzip compression
- [ ] Set up rate limiting
- [ ] Configure static file caching

---

## 🚨 Incident Response

### Preparation
- [ ] Create incident response plan
- [ ] Define escalation procedures
- [ ] Set up on-call rotation
- [ ] Document emergency contacts
- [ ] Prepare rollback procedures

### Response Procedures
1. **Service Down**
   - Check PM2 status: `pm2 status`
   - Review logs: `pm2 logs admin-backend`
   - Check MongoDB connection
   - Restart if needed: `pm2 restart admin-backend`

2. **High Error Rate**
   - Check error logs
   - Review recent deployments
   - Check database status
   - Consider rollback if needed

3. **Performance Issues**
   - Check server resources
   - Review slow queries
   - Check MongoDB performance
   - Scale resources if needed

---

## ✅ Pre-Launch Checklist

### Final Verification
- [ ] All environment variables set correctly
- [ ] SSL certificate installed and working
- [ ] Database backups configured and tested
- [ ] Monitoring and alerts active
- [ ] Error tracking active
- [ ] API documentation updated
- [ ] Admin credentials changed from defaults
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Logs being captured and rotated
- [ ] Health check endpoint responding
- [ ] All API endpoints tested
- [ ] Load testing completed
- [ ] Staging environment tested
- [ ] Rollback plan documented
- [ ] Team trained on operations
- [ ] Incident response plan reviewed

---

## 📞 Post-Launch

### Day 1
- [ ] Monitor error rates closely
- [ ] Check performance metrics
- [ ] Verify backups running
- [ ] Review security logs
- [ ] Be ready for immediate response

### Week 1
- [ ] Daily monitoring review
- [ ] Check for performance issues
- [ ] Review user feedback
- [ ] Address any critical issues
- [ ] Update documentation as needed

### Month 1
- [ ] Review security logs
- [ ] Analyze performance trends
- [ ] Review and optimize slow queries
- [ ] Plan for scaling if needed
- [ ] Update dependencies if needed

---

## 🔐 Security Hardening Recommendations

### Additional Security Measures
```bash
# Install security packages
npm install helmet express-rate-limit express-mongo-sanitize xss-clean hpp

# Update server.js with security middleware
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Apply security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});
app.use('/api/auth/login', authLimiter);
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
- [ ] Set up load balancer
- [ ] Configure session management (if needed)
- [ ] Implement distributed caching (Redis)
- [ ] Use managed MongoDB cluster
- [ ] Configure auto-scaling

### Vertical Scaling
- [ ] Monitor resource usage
- [ ] Upgrade server resources as needed
- [ ] Optimize database queries
- [ ] Implement caching layer

---

**Remember:** Test everything in staging before deploying to production!

**Production Go-Live Date:** _________________

**Approved By:** _________________

**Date:** _________________
