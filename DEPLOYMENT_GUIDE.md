# 🚀 DEPLOYMENT GUIDE - EDUXITY PRODUCTION LAUNCH

> **Status**: ✅ Ready for Production Deployment  
> **Last Updated**: April 12, 2026  
> **System Status**: All Tests Passing (16/16)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Infrastructure Requirements

- [ ] **Database**: PostgreSQL instance (Neon.tech recommended)
- [ ] **Backend Server**: Linux/macOS with Node.js v20+
- [ ] **Frontend Hosting**: Mobile app deployed to stores OR web hosting setup
- [ ] **CDN**: Optional (CloudFront, Cloudflare)
- [ ] **Monitoring**: Sentry, DataDog, or similar
- [ ] **CI/CD**: GitHub Actions or similar

### Credentials & Secrets

- [ ] Firebase Project Admin Credentials (service account key)
- [ ] Google Gemini API Key
- [ ] Database Connection String
- [ ] SSL/TLS Certificates
- [ ] Domain names configured

---

## 🔧 ENVIRONMENT SETUP

### 1. Create Production `.env` File

```bash
# Database (Get from Neon.tech or your provider)
DATABASE_URL="postgresql://user:password@db.provider.com:5432/eduxity-prod"

# Firebase Admin SDK (From Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID="your-firebase-project"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# Google Gemini API (From Google Cloud Console)
GEMINI_API_KEY="AIzaSy..."

# CORS Configuration (Update for your domain)
ALLOWED_ORIGINS="https://yourdomain.com,https://api.yourdomain.com"

# Node Environment
NODE_ENV="production"
PORT=4000

# Optional: Logging Service
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
```

### 2. Install Dependencies

```bash
# Install all npm packages
npm install

# Verify Prisma setup
npx prisma generate
npx prisma migrate deploy

# Check for security vulnerabilities
npm audit
```

### 3. Run Pre-Launch Tests

```bash
# Start backend server
npm run api &

# Wait 3 seconds, then run E2E tests
sleep 3 && npm run test:e2e

# Expected output: 16/16 tests passing ✅
```

---

## 🗄️ DATABASE SETUP

### Initialize PostgreSQL Database

```bash
# Connect to your PostgreSQL server
psql -U admin -h db.provider.com -d eduxity

# Run Prisma migrations
npx prisma migrate deploy

# Verify schema created
\dt  # List all tables

# Expected tables:
# - users
# - sessions
# - learningItems
# - feedItems
# - userEngagement
```

### Database Backup Strategy

```bash
# Automated daily backups (via Neon.tech or provider)
# OR manual backup command:
pg_dump -U admin -h db.provider.com eduxity > backup-$(date +%Y%m%d).sql
```

---

## 🚀 BACKEND DEPLOYMENT

### Option A: Traditional Server (Linux/EC2/DigitalOcean)

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Clone repository
git clone https://github.com/yourorg/eduxity.git
cd eduxity

# 3. Install dependencies
npm install --production

# 4. Create .env file with production credentials
nano .env  # Add all environment variables

# 5. Build/Compile (if needed)
npm run build

# 6. Start with PM2 (process manager)
npm install -g pm2
pm2 start "npm run api" --name "eduxity-api"
pm2 startup
pm2 save

# 7. Setup Nginx reverse proxy
# (Configure with your domain and SSL)
```

### Option B: Serverless (AWS Lambda, Vercel, Railway)

```bash
# Deploy via CLI tool (example with Railway)
railway link  # Connect to your project
railway up    # Deploy

# Or using Vercel
vercel --prod
```

### Option C: Docker Container

```bash
# Build Docker image (if Dockerfile exists)
docker build -t eduxity-api:latest .

# Run container
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://..." \
  -e FIREBASE_PROJECT_ID="..." \
  -e GEMINI_API_KEY="..." \
  eduxity-api:latest

# Push to Docker Hub/ECR
docker push eduxity-api:latest
```

---

## 🔐 SSL/TLS SETUP

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure Nginx to use certificate (in /etc/nginx/nginx.conf)
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Nginx Configuration Example

```nginx
# /etc/nginx/sites-available/eduxity
upstream eduxity_backend {
    server 127.0.0.1:4000;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req zone=general burst=20 nodelay;

    location / {
        proxy_pass http://eduxity_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/eduxity /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🧪 POST-DEPLOYMENT VERIFICATION

### 1. Health Check

```bash
# Test health endpoint
curl https://api.yourdomain.com/health

# Expected response:
# {"status":"ok","ts":"2026-04-12T10:30:00.000Z"}
```

### 2. Authentication Test

```bash
# Test 401 response (no token)
curl -X POST https://api.yourdomain.com/api/generate-learning-posts \
  -H "Content-Type: application/json" \
  -d '{"topic":"Test"}'

# Expected: 401 Unauthorized
```

### 3. E2E Test Suite

```bash
# Run full test suite
npm run test:e2e

# All 16 tests should pass ✅
```

### 4. Database Connection

```bash
# Connect to production database
psql -U admin -h db.yourdomain.com -d eduxity

# Check row counts
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM learning_items;
```

---

## 📊 MONITORING & LOGGING

### Application Monitoring

```bash
# Using PM2 Plus (free tier available)
pm2 link <your-pm2-secret-key>

# Monitor in real-time
pm2 monit
pm2 logs
```

### Error Tracking (Sentry)

```typescript
// Already configured if SENTRY_DSN in .env
// Errors are automatically tracked
```

### Database Monitoring

```sql
-- Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;

-- Check connection status
SELECT * FROM pg_stat_activity;

-- Check index usage
SELECT schemaname, tablename, indexname FROM pg_indexes;
```

---

## ⚡ PERFORMANCE OPTIMIZATION

### Caching Strategy

```typescript
// Redis setup (optional but recommended)
import Redis from "ioredis";

const redis = new Redis({
  host: "cache.yourdomain.com",
  port: 6379,
});

// Cache post generation results for 5 minutes
await redis.setex(`gen-${userId}`, 300, JSON.stringify(data));
```

### Database Optimization

```sql
-- Ensure indexes are in place
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_learning_items_session_id ON learning_items(session_id);
CREATE INDEX idx_feed_items_created_at ON feed_items(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM feed_items WHERE user_id = 'xxx';
```

### Rate Limiting Tuning

Update in `server/index.ts` based on production load:

- **Global**: 100 → 1000 requests/15 minutes
- **Generation**: 5 → 20 requests/5 minutes

---

## 🆘 TROUBLESHOOTING

### API Not Starting

```bash
# Check for port conflicts
lsof -i :4000

# Check environment variables
echo $DATABASE_URL
echo $FIREBASE_PROJECT_ID

# Check logs
pm2 logs eduxity-api
tail -f /var/log/eduxity/error.log
```

### Database Connection Issues

```bash
# Test connection string
psql "$DATABASE_URL"

# Check Prisma
npx prisma db push
npx prisma studio
```

### Firebase Auth Failures

```bash
# Verify service account key
npx firebase-debug <path-to-service-account-key>

# Check token generation
node -e "const admin = require('firebase-admin'); console.log(admin.initializeApp)"
```

---

## 📱 FRONTEND DEPLOYMENT

### Mobile App (Expo)

```bash
# Build APK (Android)
expo build:android --release-channel production

# Build IPA (iOS)
expo build:ios --release-channel production

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Web Version (Next.js)

```bash
# Build optimized production bundle
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to your server
npm run build
npm start
```

---

## 📈 LAUNCH TIMELINE

| Phase           | Duration | Actions                                    |
| --------------- | -------- | ------------------------------------------ |
| **Preparation** | 2-3 days | Infrastructure setup, credentials, backups |
| **Staging**     | 1-2 days | Deploy to staging, run full test suite     |
| **Soft Launch** | 1-3 days | Limited users, monitoring, bug fixes       |
| **Full Launch** | Day N    | Public release, monitoring 24/7            |

---

## ✅ LAUNCH CHECKLIST - FINAL

- [ ] Database: PostgreSQL migrated and verified
- [ ] Backend API: Running, SSL/TLS enabled, tests passing
- [ ] Environment variables: All configured
- [ ] Monitoring: Sentry/DataDog setup
- [ ] Backups: Automated backup configured
- [ ] Rate limiting: Tuned for production load
- [ ] Security headers: Verified present
- [ ] CORS: Updated for production domain
- [ ] Frontend: Mobile app and web app deployed
- [ ] E2E tests: All 16 tests passing
- [ ] Performance: Load testing completed
- [ ] Disaster recovery: Plan documented
- [ ] Team: On-call schedule established

---

## 🎉 GO LIVE!

Once all items checked, you're ready to:

```bash
# 1. Start backend
npm run api &

# 2. Verify health
curl https://api.yourdomain.com/health

# 3. Announce launch
echo "🚀 Eduxity is now LIVE!"
```

---

## 📞 SUPPORT & ESCALATION

**Critical Issues** (Production Down):  
→ Page on-call engineer immediately

**High Priority** (Core Features Broken):  
→ File incident, debug with logs, rollback if needed

**Medium Priority** (Non-critical Issues):  
→ Create ticket, schedule fix, monitor

---

**Deployment Guide Version**: 1.0  
**Last Reviewed**: April 12, 2026  
**Status**: ✅ Ready for Production
