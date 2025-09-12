# User Order Processing Guide

This guide explains how user orders are processed in our e-commerce platform from start to finish, including available payment methods, order statuses, and the API endpoints that support each step of the process.

## Order Processing Flow

### 1. Order Placement
- User adds products to cart (`POST /api/v1/cart/items`)
- User proceeds to checkout (Frontend action)
- User provides shipping details (Form input)
- User selects a payment method (Form input)
- User confirms the order (`POST /api/v1/orders`)

### 2. Order Confirmation
- System generates a unique order number (Server-side action)
- Order is saved with status "PENDING" (Database operation)
- User receives an order confirmation email (Email service)
- Inventory is temporarily reserved (`PUT /api/v1/inventory/reserve`)

### 3. Payment Processing
Depending on the payment method chosen, the following process occurs:

#### Card Payment (Paystack/Flutterwave)
1. User is redirected to the payment gateway (`POST /api/v1/payments/initiate`)
2. User enters card details and completes payment (Gateway hosted page)
3. Payment gateway returns success/failure status (Callback URL)
4. If successful, order status changes to "PAID" (`POST /api/v1/payments/verify` or webhook)
5. If failed, order remains "PENDING" and user can try again

#### Bank Transfer (Manual Payment)
1. System provides bank account details to the user (`POST /api/v1/payments/bank-transfer/initiate`)
2. User makes a transfer from their bank account (External action)
3. User uploads proof of payment (receipt/screenshot) (`POST /api/v1/payments/receipt/upload`)
4. Order status changes to "AWAITING_VERIFICATION" (Database operation)
5. Admin verifies the payment receipt (`PATCH /api/v1/payments/receipt/:receiptId/verify`)
6. If verified, order status changes to "PAID" (Database operation)
7. If rejected, user is notified to provide a valid receipt (Email notification)

### 4. Order Processing
- Once payment is confirmed, order status changes to "PROCESSING" (`PATCH /api/v1/orders/:id/status`)
- Inventory is permanently deducted (`PUT /api/v1/inventory/deduct`)
- Fulfillment team is notified of new order (Email notification)
- Order is prepared for shipping (External action)

### 5. Shipping
- Order is packaged and handed to delivery partner (External action)
- Order status changes to "SHIPPED" (`PATCH /api/v1/orders/:id/status`)
- Tracking information is provided to customer (`PUT /api/v1/orders/:id/tracking`)
- Customer receives shipping notification email (Email service)

### 6. Delivery
- Delivery partner delivers the package (External action)
- Order status changes to "DELIVERED" (`PATCH /api/v1/orders/:id/status`)
- Customer receives delivery confirmation email (Email service)

### 7. Post-Delivery
- Customer can leave a review (`POST /api/v1/reviews`)
- Customer can report issues (`POST /api/v1/customer-support/tickets`)
- Return/exchange process can be initiated if needed (`POST /api/v1/returns`)

## Payment Methods

### 1. Card Payment via Paystack
- **Process**: Real-time payment processing
- **Confirmation**: Immediate
- **Best for**: Quick checkout and convenience
- **Security**: Encrypted and PCI compliant

### 2. Card Payment via Flutterwave
- **Process**: Real-time payment processing
- **Confirmation**: Immediate
- **Best for**: International cards and multiple payment options
- **Security**: Encrypted and PCI compliant

### 3. Bank Transfer (Manual Payment)
- **Process**: Manual transfer and verification
- **Confirmation**: 1-2 hours during business hours
- **Best for**: Users who prefer bank transfers or don't have cards
- **Steps**:
  1. Select "Bank Transfer" payment method at checkout
  2. Copy our bank account details
  3. Make transfer from your bank (online or at branch)
  4. Use the provided reference number in transfer narration
  5. Upload screenshot/photo of payment receipt
  6. Wait for verification and confirmation

## Bank Transfer Payment Process (Detailed)

### Step 1: Select Bank Transfer at Checkout
Choose "Bank Transfer" as your payment option during checkout.

### Step 2: Review Bank Account Details
You'll be shown our bank account details including:
- Bank Name
- Account Name
- Account Number
- Reference Number (Important for tracking your payment)

### Step 3: Make the Transfer
Make a transfer from your bank account with the exact order amount. Be sure to include the reference number in the transfer description/narration.

### Step 4: Upload Payment Receipt
After completing the transfer:
1. Take a screenshot or photo of your payment receipt/confirmation
2. Return to our website and upload the receipt
3. Ensure the receipt clearly shows:
   - Transaction date and time
   - Amount transferred
   - Recipient account information
   - Transaction reference/number

### Step 5: Verification Process
Our admin team will verify your payment by:
1. Confirming the receipt details match your order
2. Checking that the funds have been received
3. Verifying the amount matches the order total

### Step 6: Order Confirmation
Once verified, you'll receive an order confirmation email and your order will be processed for fulfillment.

## Order Statuses Explained

- **PENDING**: Order placed but not yet paid
- **AWAITING_VERIFICATION**: Payment receipt uploaded, awaiting verification
- **PAID**: Payment confirmed but order not yet processed
- **PROCESSING**: Order is being prepared for shipping
- **SHIPPED**: Order has been dispatched to delivery partner
- **DELIVERED**: Order has been successfully delivered
- **CANCELLED**: Order has been cancelled
- **REFUNDED**: Order has been refunded

## Troubleshooting Payment Issues

### Card Payment Issues
- **Card Declined**: Ensure sufficient funds and try again
- **Gateway Error**: Try a different card or payment method
- **Verification Failed**: Check if 3D Secure is enabled

### Bank Transfer Issues
- **Receipt Rejected**: Ensure receipt shows all required information
- **Transfer Not Credited**: Confirm you transferred to the correct account
- **Reference Missing**: Ensure you included the reference number in transfer narration

## Contacting Support

If you encounter any issues during the payment or order process, please contact our support team:

- Email: support@jjessential.com
- Phone: +234-XXX-XXX-XXXX
- Live Chat: Available on our website (9am-5pm, Monday-Friday)

---

By understanding this order process, you can more effectively track your orders and resolve any issues that may arise during the payment or fulfillment stages.

## API Endpoints Reference

This section documents all the API endpoints used in the order processing flow. These endpoints follow a RESTful structure and are secured with JWT authentication except where noted as public.

### Authentication

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/auth/login` | Authenticate user | `{email, password}` | `{token, user}` |
| POST | `/api/v1/auth/register` | Register new user | `{email, password, fullName}` | `{token, user}` |
| POST | `/api/v1/auth/refresh` | Refresh access token | `{refreshToken}` | `{token}` |

### Products

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/v1/products` | Get product list (public) | Query params for filtering/pagination | Product list with pagination |
| GET | `/api/v1/products/:id` | Get product details (public) | - | Single product with details |
| GET | `/api/v1/products/featured` | Get featured products (public) | - | List of featured products |
| GET | `/api/v1/products/categories/:categoryId` | Get products by category (public) | - | Products in category |

### Cart Management

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/v1/cart` | Get current user's cart | - | Cart with items |
| POST | `/api/v1/cart/items` | Add item to cart | `{productId, quantity}` | Updated cart |
| PUT | `/api/v1/cart/items/:itemId` | Update cart item | `{quantity}` | Updated cart |
| DELETE | `/api/v1/cart/items/:itemId` | Remove item from cart | - | Updated cart |

### Order Management

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/orders` | Create new order | `{shippingDetails, items}` | Created order |
| GET | `/api/v1/orders` | Get user's orders | Query params for pagination | Order list with pagination |
| GET | `/api/v1/orders/:id` | Get order details | - | Order with items and status |
| GET | `/api/v1/orders/stats` | Get order statistics | - | Order statistics |

### Payment Processing

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/payments/initiate` | Initiate payment | `{orderId, gateway}` | Payment initialization data |
| POST | `/api/v1/payments/verify` | Verify payment | `{reference, gateway}` | Payment verification result |
| GET | `/api/v1/payments/history` | Get payment history | - | Payment transaction list |
| GET | `/api/v1/payments/bank-accounts` | Get bank accounts for manual transfers (public) | - | List of bank accounts |

### Bank Transfer Specific Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/payments/bank-transfer/initiate` | Initiate bank transfer | `{orderId}` | Bank transfer details |
| POST | `/api/v1/payments/receipt/upload` | Upload payment receipt | Multipart form with `file` and `reference` | Receipt upload result |
| GET | `/api/v1/payments/receipts/pending` | Get pending receipts (Admin only) | - | List of pending receipts |
| PATCH | `/api/v1/payments/receipt/:receiptId/verify` | Verify payment receipt (Admin only) | `{status, notes}` | Receipt verification result |

### Reviews

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/v1/reviews` | Create product review | `{productId, rating, comment}` | Created review |
| GET | `/api/v1/reviews/product/:productId` | Get product reviews (public) | Query params for pagination | Reviews with pagination |

## Data Structures

### Order Object

```json
{
  "id": "uuid",
  "orderNumber": "ORD12345",
  "userId": "user-uuid",
  "status": "PENDING",
  "paymentStatus": "AWAITING_VERIFICATION",
  "paymentMethod": "BANK_TRANSFER",
  "shippingAddress": {
    "fullName": "John Doe",
    "address": "123 Main St",
    "city": "Lagos",
    "state": "Lagos State",
    "country": "Nigeria",
    "postalCode": "100001",
    "phone": "08012345678"
  },
  "subtotal": 25000.00,
  "shippingFee": 1500.00,
  "discount": 0.00,
  "totalAmount": 26500.00,
  "items": [
    {
      "id": "item-uuid",
      "productId": "product-uuid",
      "quantity": 2,
      "price": 12500.00,
      "product": {
        "name": "Product Name",
        "images": ["url-to-image.jpg"]
      }
    }
  ],
  "createdAt": "2025-09-05T12:00:00Z",
  "updatedAt": "2025-09-06T09:30:00Z"
}
```

### Payment Transaction Object

```json
{
  "id": "uuid",
  "orderId": "order-uuid",
  "reference": "bank_transfer_1630864520_12345",
  "amount": 26500.00,
  "gateway": "BANK_TRANSFER",
  "status": "AWAITING_VERIFICATION",
  "receiptUrl": "uploads/receipts/1630864520_receipt.jpg",
  "gatewayData": {},
  "createdAt": "2025-09-05T12:05:00Z",
  "updatedAt": "2025-09-06T10:30:00Z"
}
```

### Bank Account Object

```json
{
  "bankName": "First Bank Nigeria",
  "accountName": "JJ Essencial Ltd",
  "accountNumber": "1234567890",
  "sortCode": "123456",
  "swiftCode": "FIRSTNIG",
  "currency": "NGN"
}
```
