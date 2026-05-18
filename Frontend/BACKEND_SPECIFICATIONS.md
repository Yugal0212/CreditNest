# 🏪 CreditNest
## Complete Backend Specifications & Workflow Documentation

---

## 📋 TABLE OF CONTENTS
1. [Authentication Flow](#authentication-flow)
2. [Dashboard Features by Role](#dashboard-features)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Security Requirements](#security-requirements)
6. [Technical Stack](#technical-stack)
7. [File Upload Implementation](#file-upload)
8. [OTP & Notification System](#otp-system)

---

## 🔐 AUTHENTICATION FLOW

### 1. ADMIN AUTHENTICATION

**Registration:** ❌ NOT ALLOWED (Admins created via seed file only)

**Login Flow:**
```
1. Admin enters credentials
   - Email: admin@creditnest.com
   - Password: (from seed file)
   
2. Backend validates credentials
   - Check email/password in database
   - Verify role is 'admin'
   
3. Generate JWT Token
   - Payload: { userId, email, role: 'admin' }
   - Expiry: 7 days
   
4. Return Response
   {
     success: true,
     token: "jwt_token_here",
     user: {
       id, name, email, role: 'admin', 
       avatar: "default_admin_icon.png"
     }
   }
   
5. Frontend stores JWT in localStorage
6. Redirect to: /dashboard/admin
```

---

### 2. SHOP OWNER AUTHENTICATION

#### A. REGISTRATION FLOW (First Time)

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Shop Owner Registration Form                        │
├─────────────────────────────────────────────────────────────┤
│ Input Fields:                                                │
│ • Shop Name* (required)                                      │
│ • Owner Name* (required)                                     │
│ • Shop Address* (required)                                   │
│ • Phone Number* (required, 10 digits)                        │
│ • Email* (required, valid format)                            │
│ • Choose OTP Method: [SMS] or [Email]                        │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Backend Validation                                   │
├─────────────────────────────────────────────────────────────┤
│ • Check if phone number already registered                   │
│ • Check if email already registered                          │
│ • Validate all fields                                        │
│ • Generate 6-digit OTP (expires in 10 minutes)               │
│ • Store OTP in Redis/Database (temporary)                    │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Send OTP                                             │
├─────────────────────────────────────────────────────────────┤
│ If SMS selected:                                             │
│ • Use Twilio/MSG91/Fast2SMS                                  │
│ • Send to: +91 [phone_number]                                │
│ • Message: "Your CreditNest OTP is: 123456. Valid for 10 min"│
│                                                              │
│ If Email selected:                                           │
│ • Use Nodemailer/SendGrid                                    │
│ • Send to: [email_address]                                   │
│ • Subject: "CreditNest Registration - OTP Verification"      │
│ • Body: "Your OTP is: 123456. Valid for 10 minutes"         │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: OTP Verification                                     │
├─────────────────────────────────────────────────────────────┤
│ User enters 6-digit OTP                                      │
│ Backend validates:                                           │
│ • OTP matches stored value                                   │
│ • OTP not expired (< 10 minutes)                             │
│ • Max 3 attempts allowed                                     │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Create Shop Owner Account                            │
├─────────────────────────────────────────────────────────────┤
│ • Hash sensitive data (if needed)                            │
│ • Create Shop record in database                             │
│ • Create ShopOwner record in database                        │
│ • Link owner to shop (one-to-one relationship)               │
│ • Set default avatar: "SO" initials or default icon          │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Auto-Login                                           │
├─────────────────────────────────────────────────────────────┤
│ • Generate JWT Token                                         │
│   Payload: { userId, email, role: 'shop_owner', shopId }    │
│   Expiry: 30 days                                            │
│                                                              │
│ • Return Response:                                           │
│   {                                                          │
│     success: true,                                           │
│     token: "jwt_token_here",                                 │
│     user: {                                                  │
│       id, name, email, phone,                                │
│       role: 'shop_owner',                                    │
│       shopId, shopName,                                      │
│       avatar: "default_icon.png"                             │
│     }                                                        │
│   }                                                          │
│                                                              │
│ • Frontend stores JWT in localStorage                        │
│ • Redirect to: /dashboard/shop_owner                         │
└─────────────────────────────────────────────────────────────┘
```

#### B. LOGIN FLOW (Returning Shop Owner)

```
1. Shop Owner enters Phone or Email
   - Input: Phone Number OR Email
   
2. Backend checks if user exists
   - Query database for shop_owner with phone/email
   - If not found: Return error "Account not found"
   
3. Generate OTP
   - Create 6-digit OTP
   - Store in Redis with 10-minute expiry
   - Send via SMS or Email (based on input type)
   
4. User enters OTP
   - Validate OTP
   - Max 3 attempts
   
5. Generate JWT & Auto-Login
   - Create JWT token (30-day expiry)
   - Return user data + token
   - Redirect to /dashboard/shop_owner
```

**🔑 Key Points:**
- ❌ NO PASSWORD REQUIRED for shop owners
- ✅ Only OTP-based authentication
- ✅ Auto-login after successful OTP verification
- ✅ JWT stored in localStorage for persistent login

---

### 3. CUSTOMER AUTHENTICATION

**Registration:** ❌ NOT ALLOWED (Customers added by shop owner only)

**Login Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Customer Login Page                                  │
├─────────────────────────────────────────────────────────────┤
│ Input: Phone Number OR Email                                 │
│ (No password field shown)                                    │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Backend Validation                                   │
├─────────────────────────────────────────────────────────────┤
│ • Find customer by phone/email                               │
│ • Check if customer exists                                   │
│ • Check if customer is active                                │
│ • Get associated shop information                            │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Generate & Send OTP                                  │
├─────────────────────────────────────────────────────────────┤
│ • Generate 6-digit OTP                                       │
│ • Store with customer ID + timestamp                         │
│ • Send via SMS (if phone) or Email                           │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: OTP Verification                                     │
├─────────────────────────────────────────────────────────────┤
│ • Validate 6-digit OTP                                       │
│ • Check expiry (10 minutes)                                  │
│ • Max 3 attempts                                             │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Generate JWT & Login                                 │
├─────────────────────────────────────────────────────────────┤
│ JWT Payload: {                                               │
│   userId: customer.id,                                       │
│   email: customer.email,                                     │
│   role: 'customer',                                          │
│   shopId: customer.shopId                                    │
│ }                                                            │
│                                                              │
│ Response: {                                                  │
│   token, user: {                                             │
│     id, name, email, phone,                                  │
│     role: 'customer',                                        │
│     shopId, shopName,                                        │
│     avatar: customer.photo || "default_customer_icon.png",   │
│     creditBalance, totalPurchases                            │
│   }                                                          │
│ }                                                            │
│                                                              │
│ Redirect to: /dashboard/customer                             │
└─────────────────────────────────────────────────────────────┘
```

**🔑 Key Points:**
- ❌ Customers CANNOT register themselves
- ✅ Shop owner adds customers with full details
- ✅ Customer can only login to their assigned shop
- ✅ OTP-based login (SMS or Email)
- ❌ NO PASSWORD REQUIRED
- ✅ Auto-login with JWT (30-day expiry)

---

## 📊 DASHBOARD FEATURES BY ROLE

### 1. ADMIN DASHBOARD

**Route:** `/dashboard/admin`

**Features:**

#### A. Overview/Home Page
```
Statistics Cards:
• Total Shops: 150+
• Total Customers: 5,200+
• Total Credit Outstanding: ₹2,50,000+
• Monthly Revenue: ₹15,00,000+

Charts:
• Credit Trends (Line chart)
• Shop Performance (Bar chart)
• Payment Collections (Area chart)
• Top 10 Shops by Revenue
```

#### B. Shop Management (`/dashboard/admin/shops`)
```
Features:
• View all registered shops
• Search/Filter shops
• View shop details:
  - Shop name, owner name
  - Address, contact info
  - Total customers
  - Credit outstanding
  - Registration date
  - Status (active/inactive)
• Approve/Reject new shop registrations
• Suspend/Activate shops
• View shop analytics
```

#### C. Analytics (`/dashboard/admin/analytics`)
```
Reports:
• Revenue by Shop
• Credit Recovery Rate
• Active vs Inactive Shops
• Customer Growth Trends
• Payment Collection Efficiency
• Overdue Credits Dashboard

Filters:
• Date Range
• Shop Category
• Region/Location
• Status
```

#### D. Products Management (`/dashboard/admin/products`)
```
Features:
• View all products across shops
• Product categories
• Price trends
• Popular products
• Stock status across shops
```

#### E. Orders/Transactions (`/dashboard/admin/orders`)
```
Features:
• View all credit transactions
• Filter by shop/customer/date
• Transaction details
• Payment status
• Generate reports
```

#### F. History/Logs (`/dashboard/admin/history`)
```
Features:
• System audit logs
• Shop registration logs
• Login/Logout logs
• Credit transaction history
• Payment history
• OTP logs
```

---

### 2. SHOP OWNER DASHBOARD

**Route:** `/dashboard/shop_owner`

**Features:**

#### A. Overview/Home Page
```
Quick Stats:
• Total Customers: 45
• Total Credit Outstanding: ₹25,450
• This Month's Sales: ₹85,000
• Pending Payments: ₹15,200

Quick Actions:
• Add New Customer
• Record Sale
• View Today's Transactions
• Send Payment Reminders

Recent Activities:
• Last 10 transactions
• Recent customer additions
• Payment collections
```

#### B. Customers Management (`/dashboard/shop_owner/customers`)
```
Features:

1. VIEW ALL CUSTOMERS
   • List view with cards
   • Search by name/phone
   • Filter by status (Active/Overdue/Cleared)
   • Sort by credit amount, last purchase

2. ADD NEW CUSTOMER
   Form Fields:
   • Customer Name* (required)
   • Phone Number* (required, will be used for login)
   • Email* (required, will be used for login)
   • Address
   • Photo Upload (Cloudinary)
     - Max 2MB, JPG/PNG
     - If not uploaded, show initials icon
   • Workplace/Company Name
   • Notes (optional)
   
   Process:
   • Upload photo to Cloudinary
   • Get photo URL
   • Create customer record
   • Link to current shop
   • Send welcome SMS/Email with login instructions

3. CUSTOMER PROFILE VIEW
   Display:
   • Photo (or initials icon)
   • Name, Phone, Email
   • Address, Workplace
   • Shop Name (auto-filled)
   • Join Date
   • Credit Statistics:
     - Total Credit: ₹2,450
     - Paid: ₹1,200
     - Balance: ₹1,250
   • Last Purchase Date
   • Status Badge (Active/Overdue/Cleared)
   • Purchase History (last 10)
   
   Actions:
   • Edit Customer
   • View Full History
   • Record Sale
   • Record Payment
   • Send Reminder
   • Delete Customer

4. RECORD SALE (Credit Purchase)
   Flow:
   • Select Customer
   • Add Products to Cart:
     - Search products
     - Select product
     - Adjust quantity (+ / -)
     - Show unit price
     - Calculate subtotal
   • View Cart Summary:
     - List all items
     - Quantities
     - Subtotal per item
     - Total Amount
   • Confirm Sale
   • Backend:
     - Create Transaction record
     - Update customer's credit balance
     - Update product stock (if tracked)
     - Send SMS/Email receipt
   • Success Message

5. EDIT CUSTOMER
   • Update any field
   • Upload new photo
   • Save changes

6. DELETE CUSTOMER
   • Confirmation dialog
   • Check if customer has pending credit
   • If credit > 0, show warning
   • Soft delete (mark as inactive)
```

#### C. Products Management (`/dashboard/shop_owner/products`)
```
Features:

1. VIEW ALL PRODUCTS
   Display:
   • Product Name
   • Unit (kg, L, piece, etc.)
   • Price per unit
   • Stock Status (Available/Out of Stock)
   • Photo (or default icon)
   • Category

2. ADD PRODUCT
   Form:
   • Product Name*
   • Category (dropdown)
   • Unit* (1kg, 500g, 1L, etc.)
   • Price* (₹)
   • Photo Upload (Cloudinary)
     - Max 2MB, JPG/PNG
     - Default: Product icon with initials
   • Stock Status (toggle)
   • Description (optional)
   
   Process:
   • Upload photo to Cloudinary
   • Create product record
   • Link to shop

3. EDIT PRODUCT
   • Update any field
   • Change photo
   • Update stock status
   • Save

4. DELETE PRODUCT
   • Confirmation
   • Soft delete (mark as inactive)

5. PRODUCT DETAILS
   • View full details
   • Sales history
   • Revenue from product
   • Top customers for product
```

#### D. Analytics (`/dashboard/shop_owner/analytics`)
```
Display:

1. Revenue Analytics
   • Daily/Weekly/Monthly Revenue
   • Revenue vs Expenses (if tracked)
   • Revenue by Product Category
   • Line Chart: Last 30 days

2. Credit Analytics
   • Total Credit Outstanding
   • Credit Recovery Rate
   • Overdue Credits (>30 days)
   • Average Credit per Customer
   • Pie Chart: Credit Distribution

3. Customer Analytics
   • Total Customers
   • Active Customers (purchased in last 30 days)
   • New Customers This Month
   • Top 10 Customers by Purchase Value
   • Bar Chart: Customer Purchase Frequency

4. Product Analytics
   • Most Sold Products
   • Revenue by Product
   • Low Stock Alerts
   • Product Performance Trends

5. Payment Analytics
   • Payment Collection Rate
   • Average Payment Time
   • Pending Payments by Customer
```

#### E. Orders/Transactions (`/dashboard/shop_owner/orders`)
```
Features:
• View all credit sales/transactions
• Filter by:
  - Date Range
  - Customer
  - Product
  - Status (Pending/Paid/Overdue)
• Transaction Details:
  - Customer name
  - Products purchased
  - Quantities
  - Total amount
  - Payment status
  - Date & time
• Export to PDF/Excel
• Send receipt via email/SMS
```

#### F. Payment Collections (`/dashboard/shop_owner/history`)
```
Features:
• Payment History
• Record Payment:
  - Select Customer
  - Enter Amount
  - Payment Method (Cash/UPI/Card)
  - Date
  - Notes
• Payment Receipt Generation
• Filter by date/customer
• Total Collections Summary
```

---

### 3. CUSTOMER DASHBOARD

**Route:** `/dashboard/customer`

**Features:**

#### A. Overview/Home Page
```
Credit Summary Card:
• Current Credit Balance: ₹1,250
• Total Purchases: ₹5,450
• Total Paid: ₹4,200
• Last Purchase: 2 days ago

Shop Information:
• Shop Name
• Owner Name
• Contact: Phone & Address

Quick Actions:
• View Products
• View Purchase History
• View Payment History
```

#### B. Products (`/dashboard/customer/products`)
```
Features:
• View shop's product catalog
• Product cards showing:
  - Product Photo
  - Name & Unit
  - Price
  - Availability Status
• Search products
• Filter by category
• View product details
• Note: Customer CANNOT add to cart
  (Only shop owner records sales)
```

#### C. Orders/Purchases (`/dashboard/customer/orders`)
```
Display:
• All credit purchases made by customer
• Each transaction shows:
  - Date & Time
  - Products purchased
  - Quantities
  - Total Amount
  - Payment Status (Pending/Partial/Paid)
  - Remaining Balance
• Filter by date range
• View transaction receipt
```

#### D. Payment History (`/dashboard/customer/history`)
```
Display:
• All payments made
• Payment details:
  - Date & Time
  - Amount Paid
  - Payment Method
  - Receipt Number
  - Updated Balance
• Filter by date
• Download receipt
• Total Paid Summary
```

---

## 🗄️ DATABASE SCHEMA

### Technology: **PostgreSQL** (Recommended) or **MongoDB**

### Schema Design (SQL):

```sql
-- =====================================================
-- TABLE: users (Base authentication table)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE,
  role ENUM('admin', 'shop_owner', 'customer') NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: admins
-- =====================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: shops
-- =====================================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('pending', 'active', 'suspended', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: shop_owners
-- =====================================================
CREATE TABLE shop_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  owner_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, shop_id)
);

-- =====================================================
-- TABLE: customers
-- =====================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  address TEXT,
  workplace VARCHAR(255),
  photo_url VARCHAR(500),
  total_credit DECIMAL(10, 2) DEFAULT 0.00,
  total_paid DECIMAL(10, 2) DEFAULT 0.00,
  credit_balance DECIMAL(10, 2) DEFAULT 0.00,
  status ENUM('active', 'overdue', 'cleared') DEFAULT 'active',
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_purchase TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: products
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  unit VARCHAR(50) NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  photo_url VARCHAR(500),
  stock_status ENUM('available', 'out_of_stock') DEFAULT 'available',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: transactions (Credit Sales)
-- =====================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  transaction_type ENUM('credit_sale', 'payment') NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
  amount_paid DECIMAL(10, 2) DEFAULT 0.00,
  remaining_balance DECIMAL(10, 2),
  notes TEXT,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: transaction_items (Products in each sale)
-- =====================================================
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: payments
-- =====================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'upi', 'card', 'bank_transfer') NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  receipt_number VARCHAR(100) UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: otp_verifications (Temporary OTP storage)
-- =====================================================
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- phone or email
  otp VARCHAR(6) NOT NULL,
  otp_type ENUM('registration', 'login') NOT NULL,
  attempts INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: notifications (SMS/Email logs)
-- =====================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type ENUM('sms', 'email') NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE: audit_logs (System activity tracking)
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_shops_status ON shops(status);
CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_products_shop_id ON products(shop_id);
CREATE INDEX idx_transactions_shop_id ON transactions(shop_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_otp_identifier ON otp_verifications(identifier);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
```

---

## 🔌 API ENDPOINTS

### Base URL: `http://localhost:5000/api/v1`

### 1. AUTHENTICATION ENDPOINTS

#### 1.1 Admin Login
```
POST /auth/admin/login

Request Body:
{
  "email": "admin@scms.com",
  "password": "admin123"
}

Response (200):
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "Admin Name",
    "email": "admin@scms.com",
    "role": "admin",
    "avatar": "url"
  }
}
```

#### 1.2 Shop Owner Registration
```
POST /auth/shop-owner/register

Request Body:
{
  "shopName": "Ramesh Kirana Store",
  "ownerName": "Ramesh Kumar",
  "address": "123 Main Street, Ahmedabad",
  "phone": "9876543210",
  "email": "ramesh@store.com"
}

OTP is sent to both the registered email and phone.

Response (200):
{
  "success": true,
  "message": "OTP sent to your email and phone",
  "identifier": "ramesh@store.com",
  "otpExpiresIn": 600 // seconds
}
```

#### 1.3 Verify OTP (Shop Owner Registration)
```
POST /auth/shop-owner/verify-otp

Request Body:
{
  "identifier": "9876543210",
  "otp": "123456"
}

Response (200):
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "Ramesh Kumar",
    "email": "ramesh@store.com",
    "phone": "9876543210",
    "role": "shop_owner",
    "shopId": "shop_uuid",
    "shopName": "Ramesh Kirana Store",
    "avatar": "default_icon_url"
  }
}
```

#### 1.4 Shop Owner Login (Request OTP)
```
POST /auth/shop-owner/login

Request Body:
{
  "identifier": "9876543210" // phone or email
}

Response (200):
{
  "success": true,
  "message": "OTP sent successfully",
  "identifier": "9876543210",
  "otpExpiresIn": 600
}
```

#### 1.5 Shop Owner Login (Verify OTP)
```
POST /auth/shop-owner/verify-login-otp

Request Body:
{
  "identifier": "9876543210",
  "otp": "123456"
}

Response (200):
{
  "success": true,
  "token": "jwt_token_here",
  "user": { ...user_data... }
}
```

#### 1.6 Customer Login (Request OTP)
```
POST /auth/customer/login

Request Body:
{
  "identifier": "9123456789" // phone or email
}

Response (200):
{
  "success": true,
  "message": "OTP sent successfully",
  "identifier": "9123456789",
  "shopName": "Ramesh Kirana Store"
}
```

#### 1.7 Customer Login (Verify OTP)
```
POST /auth/customer/verify-otp

Request Body:
{
  "identifier": "9123456789",
  "otp": "123456"
}

Response (200):
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "Customer Name",
    "email": "customer@email.com",
    "phone": "9123456789",
    "role": "customer",
    "shopId": "shop_uuid",
    "shopName": "Ramesh Kirana Store",
    "avatar": "photo_url or default",
    "creditBalance": 1250.00,
    "totalPurchases": 5450.00
  }
}
```

#### 1.8 Logout
```
POST /auth/logout

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 1.9 Verify Token (Auto-login)
```
GET /auth/verify-token

Headers:
Authorization: Bearer <jwt_token>

Response (200):
{
  "success": true,
  "user": { ...user_data... }
}
```

---

### 2. SHOP OWNER ENDPOINTS

**All endpoints require JWT authentication**
**Headers:** `Authorization: Bearer <token>`

#### 2.1 Get Dashboard Stats
```
GET /shop-owner/dashboard/stats

Response (200):
{
  "success": true,
  "stats": {
    "totalCustomers": 45,
    "totalCreditOutstanding": 25450.00,
    "thisMonthSales": 85000.00,
    "pendingPayments": 15200.00,
    "activeCustomers": 38,
    "overdueCustomers": 7
  }
}
```

#### 2.2 Get All Customers
```
GET /shop-owner/customers?page=1&limit=20&search=ramesh&status=active

Response (200):
{
  "success": true,
  "customers": [
    {
      "id": "uuid",
      "name": "Ramesh Kumar",
      "phone": "9876543210",
      "email": "ramesh@email.com",
      "avatar": "url or null",
      "address": "Sector 12, Ahmedabad",
      "workplace": "ABC Company",
      "totalCredit": 2450.00,
      "totalPaid": 1200.00,
      "creditBalance": 1250.00,
      "status": "active",
      "joinDate": "2024-01-15",
      "lastPurchase": "2024-03-02"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCustomers": 45,
    "limit": 20
  }
}
```

#### 2.3 Add New Customer
```
POST /shop-owner/customers

Request Body (multipart/form-data):
{
  "name": "Priya Sharma",
  "phone": "9123456789",
  "email": "priya@email.com",
  "address": "Gandhi Nagar, Jaipur",
  "workplace": "XYZ Ltd.",
  "photo": <file> // optional, image file
}

Response (201):
{
  "success": true,
  "message": "Customer added successfully",
  "customer": {
    "id": "uuid",
    "name": "Priya Sharma",
    ...customer_data...,
    "photoUrl": "cloudinary_url or default"
  }
}
```

#### 2.4 Get Customer Details
```
GET /shop-owner/customers/:customerId

Response (200):
{
  "success": true,
  "customer": {
    ...customer_data...,
    "recentTransactions": [
      {
        "id": "uuid",
        "date": "2024-03-01",
        "amount": 450.00,
        "products": ["Rice 5kg", "Dal 2kg"],
        "status": "pending"
      }
    ],
    "paymentHistory": [...]
  }
}
```

#### 2.5 Update Customer
```
PUT /shop-owner/customers/:customerId

Request Body (multipart/form-data):
{
  "name": "Updated Name",
  "phone": "9999999999",
  "address": "New Address",
  "photo": <file> // optional
}

Response (200):
{
  "success": true,
  "message": "Customer updated successfully",
  "customer": { ...updated_data... }
}
```

#### 2.6 Delete Customer
```
DELETE /shop-owner/customers/:customerId

Response (200):
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

#### 2.7 Record Credit Sale
```
POST /shop-owner/transactions/credit-sale

Request Body:
{
  "customerId": "customer_uuid",
  "items": [
    {
      "productId": "product_uuid",
      "quantity": 2,
      "unitPrice": 320.00
    },
    {
      "productId": "product_uuid_2",
      "quantity": 1,
      "unitPrice": 180.00
    }
  ],
  "totalAmount": 820.00,
  "notes": "Regular purchase"
}

Response (201):
{
  "success": true,
  "message": "Sale recorded successfully",
  "transaction": {
    "id": "uuid",
    "receiptNumber": "RCPT-2024-001",
    "customerId": "uuid",
    "customerName": "Ramesh Kumar",
    "items": [...],
    "totalAmount": 820.00,
    "date": "2024-03-04T10:30:00Z"
  }
}
```

#### 2.8 Get All Products
```
GET /shop-owner/products?page=1&limit=20&search=rice

Response (200):
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name": "Basmati Rice",
      "category": "Grains",
      "unit": "5kg",
      "pricePerUnit": 320.00,
      "photoUrl": "cloudinary_url or default",
      "stockStatus": "available",
      "description": "Premium quality rice"
    }
  ],
  "pagination": { ...pagination_data... }
}
```

#### 2.9 Add Product
```
POST /shop-owner/products

Request Body (multipart/form-data):
{
  "productName": "Toor Dal",
  "category": "Pulses",
  "unit": "1kg",
  "pricePerUnit": 90.00,
  "stockStatus": "available",
  "description": "Fresh toor dal",
  "photo": <file> // optional
}

Response (201):
{
  "success": true,
  "message": "Product added successfully",
  "product": { ...product_data... }
}
```

#### 2.10 Update Product
```
PUT /shop-owner/products/:productId

Request Body (multipart/form-data):
{
  "productName": "Updated Name",
  "pricePerUnit": 95.00,
  "stockStatus": "out_of_stock",
  "photo": <file> // optional
}

Response (200):
{
  "success": true,
  "message": "Product updated successfully",
  "product": { ...updated_data... }
}
```

#### 2.11 Delete Product
```
DELETE /shop-owner/products/:productId

Response (200):
{
  "success": true,
  "message": "Product deleted successfully"
}
```

#### 2.12 Get Analytics
```
GET /shop-owner/analytics?period=30days

Response (200):
{
  "success": true,
  "analytics": {
    "revenue": {
      "total": 85000.00,
      "daily": [...],
      "byCategory": [...]
    },
    "credit": {
      "outstanding": 25450.00,
      "recovered": 60000.00,
      "recoveryRate": 70.5
    },
    "customers": {
      "total": 45,
      "active": 38,
      "new": 5,
      "topCustomers": [...]
    },
    "products": {
      "topSelling": [...],
      "revenueByProduct": [...]
    }
  }
}
```

#### 2.13 Get All Transactions
```
GET /shop-owner/transactions?page=1&limit=20&customerId=uuid&startDate=2024-01-01&endDate=2024-03-04

Response (200):
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "customerName": "Ramesh Kumar",
      "type": "credit_sale",
      "totalAmount": 820.00,
      "paidAmount": 0.00,
      "balance": 820.00,
      "status": "pending",
      "date": "2024-03-04",
      "items": [...]
    }
  ],
  "pagination": { ... }
}
```

#### 2.14 Record Payment
```
POST /shop-owner/payments

Request Body:
{
  "customerId": "customer_uuid",
  "transactionId": "transaction_uuid", // optional
  "amount": 500.00,
  "paymentMethod": "cash", // cash, upi, card, bank_transfer
  "notes": "Partial payment"
}

Response (201):
{
  "success": true,
  "message": "Payment recorded successfully",
  "payment": {
    "id": "uuid",
    "receiptNumber": "PAY-2024-001",
    "amount": 500.00,
    "date": "2024-03-04",
    "updatedBalance": 320.00
  }
}
```

---

### 3. CUSTOMER ENDPOINTS

**All endpoints require JWT authentication**

#### 3.1 Get Dashboard
```
GET /customer/dashboard

Response (200):
{
  "success": true,
  "dashboard": {
    "creditBalance": 1250.00,
    "totalPurchases": 5450.00,
    "totalPaid": 4200.00,
    "lastPurchaseDate": "2024-03-02",
    "shop": {
      "name": "Ramesh Kirana Store",
      "ownerName": "Ramesh Kumar",
      "phone": "9876543210",
      "address": "123 Main Street"
    }
  }
}
```

#### 3.2 Get Products (Shop Catalog)
```
GET /customer/products?page=1&limit=20&search=rice

Response (200):
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "name": "Basmati Rice",
      "unit": "5kg",
      "pricePerUnit": 320.00,
      "photoUrl": "url",
      "stockStatus": "available",
      "category": "Grains"
    }
  ],
  "pagination": { ... }
}
```

#### 3.3 Get Purchase History (Orders)
```
GET /customer/orders?page=1&limit=20&startDate=2024-01-01

Response (200):
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "date": "2024-03-02",
      "items": [
        {
          "productName": "Basmati Rice",
          "quantity": 2,
          "unitPrice": 320.00,
          "subtotal": 640.00
        }
      ],
      "totalAmount": 820.00,
      "paidAmount": 0.00,
      "balance": 820.00,
      "status": "pending"
    }
  ],
  "pagination": { ... }
}
```

#### 3.4 Get Payment History
```
GET /customer/payments?page=1&limit=20

Response (200):
{
  "success": true,
  "payments": [
    {
      "id": "uuid",
      "date": "2024-02-28",
      "amount": 500.00,
      "paymentMethod": "cash",
      "receiptNumber": "PAY-2024-001",
      "balanceAfterPayment": 320.00
    }
  ],
  "totalPaid": 4200.00,
  "pagination": { ... }
}
```

---

### 4. ADMIN ENDPOINTS

#### 4.1 Get Dashboard Stats
```
GET /admin/dashboard/stats

Response (200):
{
  "success": true,
  "stats": {
    "totalShops": 150,
    "totalCustomers": 5200,
    "totalCreditOutstanding": 250000.00,
    "monthlyRevenue": 1500000.00,
    "activeShops": 142,
    "pendingApprovals": 8
  }
}
```

#### 4.2 Get All Shops
```
GET /admin/shops?page=1&limit=20&status=active&search=ramesh

Response (200):
{
  "success": true,
  "shops": [
    {
      "id": "uuid",
      "shopName": "Ramesh Kirana Store",
      "ownerName": "Ramesh Kumar",
      "phone": "9876543210",
      "email": "ramesh@store.com",
      "address": "123 Main Street",
      "status": "active",
      "totalCustomers": 45,
      "creditOutstanding": 25450.00,
      "registrationDate": "2024-01-01"
    }
  ],
  "pagination": { ... }
}
```

#### 4.3 Get Shop Details
```
GET /admin/shops/:shopId

Response (200):
{
  "success": true,
  "shop": {
    ...shop_data...,
    "owner": { ...owner_details... },
    "customers": [...],
    "products": [...],
    "analytics": { ... }
  }
}
```

#### 4.4 Suspend/Activate Shop
```
PATCH /admin/shops/:shopId/status

Request Body:
{
  "status": "suspended", // or "active"
  "reason": "Payment issues"
}

Response (200):
{
  "success": true,
  "message": "Shop status updated successfully"
}
```

#### 4.5 Get Analytics
```
GET /admin/analytics?period=30days

Response (200):
{
  "success": true,
  "analytics": {
    "revenueByShop": [...],
    "creditRecoveryRate": 75.5,
    "shopPerformance": [...],
    "customerGrowth": [...],
    "topShops": [...]
  }
}
```

---

## 🔒 SECURITY REQUIREMENTS

### 1. JWT Configuration
```javascript
// JWT Secret: Strong random string (store in .env)
JWT_SECRET=your_super_secret_key_min_32_chars

// Token Expiry
- Admin: 7 days
- Shop Owner: 30 days
- Customer: 30 days

// Refresh Token (Optional but recommended)
REFRESH_TOKEN_EXPIRY=90 days
```

### 2. Password Hashing (Admin only)
```javascript
// Use bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 12;

// Hash password
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verify
const isMatch = await bcrypt.compare(inputPassword, hashedPassword);
```

### 3. OTP Security
- Generate 6-digit random OTP
- Store with expiry timestamp (10 minutes)
- Max 3 attempts per OTP
- Clear OTP after successful verification
- Rate limiting: Max 3 OTP requests per hour per identifier

### 4. API Security
```javascript
// Rate Limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Apply to all routes
app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 requests per 15 minutes
});
app.use('/api/auth/', authLimiter);
```

### 5. Input Validation
```javascript
// Use express-validator or Joi

const { body, validationResult } = require('express-validator');

// Example: Validate registration
[
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone('en-IN'),
  body('shopName').trim().isLength({ min: 3, max: 100 }),
  body('ownerName').trim().isLength({ min: 2, max: 100 }),
]
```

### 6. CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### 7. Helmet.js (Security Headers)
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 8. SQL Injection Prevention
- Use parameterized queries (prepared statements)
- Use ORM (Sequelize/TypeORM) with proper sanitization
- Never concatenate user input in SQL queries

### 9. XSS Protection
- Sanitize all user inputs
- Use libraries like `xss-clean`
- Validate file uploads (type, size)

### 10. Environment Variables
```env
# .env file
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/scms_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRY=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# SMS (Twilio / MSG91 / Fast2SMS)
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=SCMS

# Email (Nodemailer / SendGrid)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=SCMS <noreply@scms.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

---

## 💻 TECHNICAL STACK

### Backend Framework
```
Node.js (v18+) + Express.js (v4.18+)
TypeScript (Optional but Recommended)
```

### Database
```
PostgreSQL (v14+) - Primary Choice
OR
MongoDB (v5+) with Mongoose
```

### ORM/ODM
```
For PostgreSQL: Sequelize or TypeORM
For MongoDB: Mongoose
```

### Authentication
```
jsonwebtoken (JWT)
bcryptjs (Password hashing)
```

### File Upload
```
multer (Handle multipart/form-data)
cloudinary (Cloud storage)
```

### OTP & Notifications
```
SMS:
- Twilio (International)
- MSG91 (India)
- Fast2SMS (India)

Email:
- Nodemailer with Gmail/SendGrid
- AWS SES
```

### Validation
```
express-validator
OR
Joi
```

### Security
```
helmet (Security headers)
cors (Cross-origin resource sharing)
express-rate-limit (Rate limiting)
xss-clean (XSS protection)
hpp (HTTP parameter pollution)
```

### Utilities
```
dotenv (Environment variables)
morgan (HTTP request logger)
winston (Application logger)
moment / date-fns (Date handling)
```

### Testing (Optional)
```
Jest (Unit testing)
Supertest (API testing)
```

---

## 📤 FILE UPLOAD IMPLEMENTATION

### Setup Cloudinary

```javascript
// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
```

### Multer Configuration

```javascript
// middleware/upload.js
const multer = require('multer');
const path = require('path');

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
};

// Upload configuration
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: fileFilter,
});

module.exports = upload;
```

### Upload to Cloudinary

```javascript
// utils/uploadToCloudinary.js
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder, // e.g., 'scms/customers' or 'scms/products'
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;
```

### Usage in Route

```javascript
// routes/shopOwner.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const Customer = require('../models/Customer');

// Add customer with photo
router.post('/customers', upload.single('photo'), async (req, res) => {
  try {
    const { name, phone, email, address, workplace } = req.body;
    
    let photoUrl = null;
    
    // Upload photo if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'scms/customers');
      photoUrl = result.secure_url;
    } else {
      // Generate default avatar (initials)
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
      photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=500&background=random`;
    }
    
    // Create customer
    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      workplace,
      photoUrl,
      shopId: req.user.shopId, // from JWT
    });
    
    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
```

### Default Avatar Generation

```javascript
// If no photo uploaded, generate initials avatar
const generateAvatarUrl = (name) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const colors = ['4F46E5', '7C3AED', 'EC4899', '06B6D4', '10B981'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=500&background=${randomColor}&color=fff&bold=true&font-size=0.4`;
};
```

---

## 📱 OTP & NOTIFICATION SYSTEM

### OTP Generation

```javascript
// utils/generateOTP.js
const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateOTP;
```

### Store OTP in Database

```javascript
// controllers/authController.js
const OTPVerification = require('../models/OTPVerification');
const generateOTP = require('../utils/generateOTP');

const sendOTP = async (identifier, type) => {
  // Generate OTP
  const otp = generateOTP();
  
  // Store in database
  await OTPVerification.create({
    identifier,
    otp,
    otpType: type,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });
  
  return otp;
};
```

### Send SMS (Using MSG91)

```javascript
// services/sms.service.js
const axios = require('axios');

const sendSMS = async (phone, message) => {
  try {
    const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      short_url: '0',
      recipients: [
        {
          mobiles: phone,
          VAR1: message, // OTP variable in template
        }
      ]
    }, {
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY,
        'content-type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('SMS Error:', error);
    throw error;
  }
};

module.exports = { sendSMS };
```

### Send Email (Using Nodemailer)

```javascript
// services/email.service.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    
    return info;
  } catch (error) {
    console.error('Email Error:', error);
    throw error;
  }
};

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
  const subject = 'SCMS - OTP Verification';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Smart Credit Management System</h2>
      <p>Your OTP for verification is:</p>
      <h1 style="color: #4F46E5; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        If you didn't request this OTP, please ignore this email.
      </p>
    </div>
  `;
  
  return sendEmail(email, subject, `Your OTP is: ${otp}`, html);
};

module.exports = { sendEmail, sendOTPEmail };
```

### Verify OTP

```javascript
// controllers/authController.js
const verifyOTP = async (identifier, otp) => {
  // Find OTP record
  const otpRecord = await OTPVerification.findOne({
    where: {
      identifier,
      otp,
      isVerified: false,
    }
  });
  
  // Check if OTP exists
  if (!otpRecord) {
    throw new Error('Invalid OTP');
  }
  
  // Check if OTP expired
  if (new Date() > otpRecord.expiresAt) {
    throw new Error('OTP expired');
  }
  
  // Check attempts
  if (otpRecord.attempts >= 3) {
    throw new Error('Maximum attempts exceeded');
  }
  
  // Increment attempts
  otpRecord.attempts += 1;
  
  // Mark as verified
  otpRecord.isVerified = true;
  await otpRecord.save();
  
  return true;
};
```

---

## 📁 RECOMMENDED FOLDER STRUCTURE

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database connection
│   │   ├── cloudinary.js        # Cloudinary config
│   │   └── constants.js         # App constants
│   │
│   ├── controllers/
│   │   ├── auth.controller.js   # Authentication logic
│   │   ├── admin.controller.js  # Admin operations
│   │   ├── shopOwner.controller.js
│   │   └── customer.controller.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification
│   │   ├── upload.middleware.js # Multer config
│   │   ├── validate.middleware.js
│   │   └── errorHandler.js      # Global error handler
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Admin.js
│   │   ├── Shop.js
│   │   ├── ShopOwner.js
│   │   ├── Customer.js
│   │   ├── Product.js
│   │   ├── Transaction.js
│   │   ├── Payment.js
│   │   ├── OTPVerification.js
│   │   └── AuditLog.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── admin.routes.js
│   │   ├── shopOwner.routes.js
│   │   └── customer.routes.js
│   │
│   ├── services/
│   │   ├── sms.service.js       # SMS sending
│   │   ├── email.service.js     # Email sending
│   │   ├── otp.service.js       # OTP generation & verification
│   │   └── upload.service.js    # Cloudinary upload
│   │
│   ├── utils/
│   │   ├── generateOTP.js
│   │   ├── generateToken.js
│   │   ├── logger.js            # Winston logger
│   │   └── validators.js        # Custom validators
│   │
│   ├── seeders/
│   │   └── admin.seeder.js      # Create admin user
│   │
│   └── app.js                   # Express app setup
│
├── .env                         # Environment variables
├── .env.example                 # Example env file
├── .gitignore
├── package.json
└── server.js                    # Server entry point
```

---

## 🚀 NEXT STEPS FOR BACKEND DEVELOPMENT

### Phase 1: Setup & Configuration (Week 1)
1. ✅ Initialize Node.js project
2. ✅ Install dependencies
3. ✅ Setup PostgreSQL database
4. ✅ Configure Cloudinary
5. ✅ Setup environment variables
6. ✅ Create database schema
7. ✅ Create admin seed file

### Phase 2: Authentication System (Week 2)
1. ✅ Implement JWT authentication
2. ✅ Create admin login
3. ✅ Create shop owner registration with OTP
4. ✅ Create shop owner login with OTP
5. ✅ Create customer login with OTP
6. ✅ Implement OTP services (SMS & Email)
7. ✅ Add rate limiting & security

### Phase 3: Shop Owner Features (Week 3-4)
1. ✅ Customer management (CRUD)
2. ✅ Product management (CRUD)
3. ✅ Credit sale recording
4. ✅ Payment recording
5. ✅ Transaction history
6. ✅ Analytics dashboard
7. ✅ File upload (Cloudinary)

### Phase 4: Customer Features (Week 5)
1. ✅ Dashboard API
2. ✅ View products
3. ✅ View purchase history
4. ✅ View payment history

### Phase 5: Admin Features (Week 6)
1. ✅ Dashboard stats
2. ✅ Shop management
3. ✅ Analytics & reports
4. ✅ Audit logs

### Phase 6: Testing & Optimization (Week 7)
1. ✅ API testing
2. ✅ Performance optimization
3. ✅ Security audit
4. ✅ Documentation

### Phase 7: Deployment (Week 8)
1. ✅ Deploy to production server
2. ✅ Setup CI/CD
3. ✅ Configure production environment
4. ✅ Monitor & maintain

---

## 📞 SUPPORT & CONTACT

For any clarifications or additional requirements during backend development, refer to:

- Frontend Repository: `/d:/Project/SMART_CREDIT`
- API Documentation: This file
- Database Schema: Section above

---

**Document Version:** 1.0  
**Last Updated:** March 4, 2026  
**Status:** Ready for Backend Development  

---

## 🎯 KEY HIGHLIGHTS

✅ **OTP-Based Authentication** - No passwords for shop owners & customers  
✅ **JWT Auto-Login** - Persistent sessions  
✅ **Cloudinary Integration** - Photo uploads for customers & products  
✅ **Multi-Role System** - Admin, Shop Owner, Customer  
✅ **Credit Management** - Track credit, payments, history  
✅ **Real-time Analytics** - Dashboard insights  
✅ **Secure & Scalable** - Enterprise-grade security  
✅ **SMS & Email Notifications** - OTP delivery  
✅ **PostgreSQL Database** - Robust data storage  
✅ **RESTful API** - Well-structured endpoints  

**Ready to build! 🚀**
