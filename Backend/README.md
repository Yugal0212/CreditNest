# 🏪 Smart Credit Management System - Backend API

## 📋 Overview

Complete backend API for SMART CREDIT MANAGEMENT SYSTEM built with Node.js, Express, MongoDB, and Prisma.

## 🔐 Quick Start - OTP Testing

### Testing Mode (Current - Console Only)
**For phone number +919723023403**:
- 📱 Use fixed OTP: **`123456`** (in development mode)
- ✅ Check backend console for OTP display
- 🚫 SMS won't be sent to actual phone (only logged to console)
- 📖 See [OTP_TESTING_GUIDE.md](./OTP_TESTING_GUIDE.md) for detailed instructions

### 📱 Want REAL SMS on Your Phone?
**To receive actual SMS on +919723023403**, follow this simple guide:
1. 📖 See [SMS_SETUP_GUIDE.md](./SMS_SETUP_GUIDE.md) - Complete setup in 5 minutes
2. 🆓 **FREE Twilio Trial** - ₹1,368 credit (no credit card needed initially)
3. 💬 Receive OTP via SMS on your actual phone

**Quick Setup**:
```bash
# 1. Install Twilio
npm install twilio

# 2. Get free Twilio account
#    Visit: https://www.twilio.com/try-twilio
#    Verify phone: +919723023403

# 3. Add credentials to .env
#    TWILIO_ACCOUNT_SID=ACxxx...
#    TWILIO_AUTH_TOKEN=xxx...
#    TWILIO_PHONE_NUMBER=+1xxx...

# 4. Restart server
npm run dev
```

After setup, OTP will be sent to your phone via SMS! 📱✅

## 🚀 Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **OTP Verification** - Email & SMS OTP for shop owners and customers
- ✅ **Multi-Role System** - Admin, Shop Owner, Customer
- ✅ **File Upload** - Cloudinary integration for images
- ✅ **Email Service** - Nodemailer with Gmail
- ✅ **SMS Service** - Firebase (to be configured)
- ✅ **Rate Limiting** - Protection against brute force attacks
- ✅ **Input Validation** - Express-validator
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Logging** - Winston logger
- ✅ **Security** - Helmet, CORS, bcrypt

## 🛠 Tech Stack

- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** MongoDB
- **ORM:** Prisma
- **Authentication:** JWT, bcrypt
- **File Upload:** Cloudinary, Multer
- **Email:** Nodemailer
- **Validation:** Express-validator
- **Security:** Helmet, CORS, Rate Limiting
- **Logging:** Winston

## 📁 Project Structure

```
Backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/
│   │   ├── database.js        # Prisma client
│   │   ├── cloudinary.js      # Cloudinary config
│   │   └── constants.js       # App constants
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── admin.controller.js
│   │   ├── shopOwner.controller.js
│   │   └── customer.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── upload.middleware.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── admin.routes.js
│   │   ├── shopOwner.routes.js
│   │   └── customer.routes.js
│   ├── services/
│   │   ├── email.service.js
│   │   ├── sms.service.js
│   │   ├── otp.service.js
│   │   └── upload.service.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── generateOTP.js
│   │   ├── generateAvatar.js
│   │   ├── logger.js
│   │   └── validators.js
│   ├── seeders/
│   │   └── admin.seeder.js
│   ├── app.js                 # Express app
│   └── server.js              # Server entry
├── logs/                      # Log files
├── .env                       # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Installation

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Configure Environment Variables

The `.env` file is already configured. Update if needed:

```env
# Server
PORT=5000

# Database
DATABASE_URL="mongodb+srv://..."

# JWT
JWT_SECRET="your_secret_key"

# Email (Gmail App Password)
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Firebase (for SMS - optional for now)
FIREBASE_API_KEY=""
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Push Database Schema

```bash
npm run prisma:push
```

### 5. Seed Admin User

```bash
npm run seed
```

**Admin Credentials:**
- Email: `admin@scms.com`
- Password: `Admin@123`

⚠️ Change password after first login!

### 6. Start Development Server

```bash
npm run dev
```

Server will start on: `http://localhost:5000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### Admin Login
```http
POST /api/auth/admin/login
Content-Type: application/json

{
  "email": "admin@scms.com",
  "password": "Admin@123"
}
```

#### Shop Owner Registration
```http
POST /api/auth/shop-owner/register
Content-Type: application/json

{
  "shopName": "My Shop",
  "ownerName": "John Doe",
  "address": "123 Main St",
  "phone": "9876543210",
  "email": "shop@example.com"
}
```
OTP is sent to both the registered email and phone.

#### Verify OTP
```http
POST /api/auth/shop-owner/verify-otp
Content-Type: application/json

{
  "identifier": "shop@example.com",
  "otp": "123456",
  "registrationData": { ... }
}
```

#### Shop Owner Login
```http
POST /api/auth/shop-owner/login
Content-Type: application/json

{
  "identifier": "9876543210"
}
```

#### Customer Login
```http
POST /api/auth/customer/login
Content-Type: application/json

{
  "identifier": "customer@example.com"
}
```

### Protected Endpoints

All protected endpoints require JWT token in header:

```http
Authorization: Bearer <your_jwt_token>
```

## 🔐 Authentication Flow

### Admin
1. Login with email/password
2. Receive JWT token
3. Use token for all requests

### Shop Owner
1. Register with details → Receive OTP
2. Verify OTP → Auto-login with JWT
3. Or login with phone/email → Receive OTP
4. Verify OTP → Receive JWT token

### Customer
1. Login with phone/email → Receive OTP
2. Verify OTP → Receive JWT token

## 🗄 Database Schema

### Collections

- **users** - Base authentication
- **admins** - Admin details
- **shops** - Shop information
- **shop_owners** - Shop owner details
- **customers** - Customer profiles
- **products** - Product catalog
- **transactions** - Credit sales
- **transaction_items** - Sale items
- **payments** - Payment records
- **otp_verifications** - OTP storage
- **notifications** - SMS/Email logs
- **audit_logs** - System logs

## 📊 Roles & Permissions

### Admin
- View all shops
- View shop analytics
- Manage shop status
- View system logs

### Shop Owner
- Manage customers
- Manage products
- Record credit sales
- Record payments
- View analytics
- Generate reports

### Customer
- View products
- View purchase history
- View payment history
- View credit balance

## 🔒 Security Features

- **JWT Authentication** with expiry
- **bcrypt** password hashing (saltRounds: 12)
- **Rate Limiting** on all routes
- **Strict Rate Limiting** on auth routes
- **Helmet.js** for security headers
- **CORS** protection
- **Input Validation** with express-validator
- **XSS Protection**
- **SQL Injection Prevention** (Prisma)

## 🖼 File Upload

- **Provider:** Cloudinary
- **Max Size:** 2MB
- **Allowed Types:** JPG, JPEG, PNG
- **Auto Resize:** 500x500px

## 📧 Email & SMS

### Email
- **Provider:** Nodemailer (Gmail)
- **Features:** OTP, Welcome emails, Receipts

### SMS
- **Provider:** Firebase Phone Auth (to be configured)
- **Placeholder:** Console logging in development

## 🐛 Debugging

### View Logs

```bash
# Combined logs
cat logs/combined.log

# Error logs only
cat logs/error.log
```

### Prisma Studio

```bash
npm run prisma:studio
```

Opens database GUI at `http://localhost:5555`

## 📦 Scripts

```bash
# Development
npm run dev              # Start with nodemon

# Production
npm start                # Start server

# Prisma
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:studio    # Open Prisma Studio

# Seeding
npm run seed             # Seed admin user
```

## 🚀 Deployment

### 1. Set Environment to Production

```env
NODE_ENV=production
```

### 2. Build & Deploy

Deploy to:
- Vercel
- Heroku
- Railway
- AWS EC2
- DigitalOcean

### 3. Database

Use MongoDB Atlas for production database.

## 🔧 Configuration

### Gmail App Password

1. Enable 2-Factor Authentication
2. Go to Google Account Settings
3. Security → App Passwords
4. Generate password for "Mail"
5. Add to `.env` as `EMAIL_PASS`

### Firebase (for SMS)

1. Create Firebase project
2. Enable Phone Authentication
3. Add credentials to `.env`

## 📝 TODO

- [ ] Configure Firebase for SMS
- [ ] Add API documentation (Swagger)
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add webhook support
- [ ] Add export to PDF/Excel
- [ ] Add email templates
- [ ] Add SMS templates

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

ISC

## 👤 Author

SCMS Development Team

## 🆘 Support

For issues or questions:
- Check logs in `logs/` folder
- Review error messages
- Check database connection
- Verify environment variables

## 🎉 Success!

Backend is now ready! Start the frontend and test the complete system.

**API is running at:** `http://localhost:5000`
**Health Check:** `http://localhost:5000/api/health`


## 🚀 Deploying to Render

To deploy this backend to Render for free:

1. Create a free account on [Render](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `smart-credit-backend`
   - **Language**: `Node`
   - **Branch**: `main` (or your branch)
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Start Command**: `npm start`
5. Add the following **Environment Variables** in Render:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your MongoDB Atlas connection string (Must not be localhost!)
   - `JWT_SECRET`: A secure random string
   - `FRONTEND_URL`: `https://credit-nest.vercel.app`
6. Click **Deploy Web Service**!

Render will automatically provide an `https://` URL for your backend!
