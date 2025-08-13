# JJ-Essencial E-Commerce API Implementation Guide

This document provides a comprehensive overview of all API endpoints implemented in the JJ-Essencial E-Commerce backend, including implementation details, requirements, and usage examples.

## Table of Contents

1. [Authentication API](#authentication-api)
2. [Products API](#products-api)
3. [Categories API](#categories-api)
4. [Orders API](#orders-api)
5. [Payments API](#payments-api)
6. [Users API](#users-api)
7. [Admin API](#admin-api)
8. [Files/Upload API](#filesupload-api)
9. [Search API](#search-api)

## Authentication API

The authentication system supports two types of users:
1. Regular users (role: USER) - Can access standard customer features
2. Admin users (role: ADMIN) - Can access both standard and administrative features

### 1. User Registration

**Endpoint:** `POST /api/v1/auth/signup`

**Implementation:**
- Controller: `AuthController.signUp()`
- Service: `AuthService.signUp()`
- DTO: `SignUpDto`
- Response: `AuthResponseDto`

**Request Format:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe"
}
```

**Response Format:**
```json
{
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER"
    }
  }
}
```

**Implementation Details:**
- Validates email uniqueness in the database
- Creates user in Supabase Auth
- Creates user profile in local database
- Returns JWT token and user profile information

**Code Example:**
```typescript
@Post('signup')
@HttpCode(HttpStatus.CREATED)
@ApiOperation({ summary: 'Register a new user' })
async signUp(@Body() signUpDto: SignUpDto): Promise<SuccessResponseDto<AuthResponseDto>> {
  const result = await this.authService.signUp(signUpDto);
  return new SuccessResponseDto(result, 'User registered successfully');
}
```

### 2. User Login

**Endpoint:** `POST /api/v1/auth/signin`

**Implementation:**
- Controller: `AuthController.signIn()`
- Service: `AuthService.signIn()`
- DTO: `SignInDto`
- Response: `AuthResponseDto`

**Implementation Details:**
- Authenticates with Supabase
- Retrieves user profile from database
- Generates JWT token
- Returns token and user information

**Code Example:**
```typescript
@Post('signin')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Sign in user' })
async signIn(@Body() signInDto: SignInDto): Promise<SuccessResponseDto<AuthResponseDto>> {
  const result = await this.authService.signIn(signInDto);
  return new SuccessResponseDto(result, 'User signed in successfully');
}
```

### 3. Admin Login

**Endpoint:** `POST /api/v1/auth/admin/signin`

**Implementation:**
- Controller: `AuthController.adminSignIn()`
- Service: `AuthService.adminSignIn()`
- DTO: `AdminSignInDto`
- Response: `AuthResponseDto`

**Implementation Details:**
- Validates against admin credentials defined in environment variables
- Creates admin account if it doesn't exist
- Ensures ADMIN role is assigned to the user
- Includes fallback for database connectivity issues
- Returns JWT token with admin privileges

**Default Admin Credentials:**
- Email: `admin@jjessential.com`
- Password: `admin123`

**Request Format:**
```json
{
  "email": "admin@jjessential.com",
  "password": "admin123"
}
```

**Response Format:**
```json
{
  "statusCode": 200,
  "message": "Admin signed in successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "f060d4a5-22af-41eb-8de0-fa0ee77621aa",
      "email": "admin@jjessential.com",
      "fullName": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

**Code Example:**
```typescript
@Post('admin/signin')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Sign in as admin' })
async adminSignIn(@Body() adminSignInDto: AdminSignInDto): Promise<SuccessResponseDto<AuthResponseDto>> {
  const result = await this.authService.adminSignIn(adminSignInDto);
  return new SuccessResponseDto(result, 'Admin signed in successfully');
}
```

### 4. Password Reset Request

**Endpoint:** `POST /api/v1/auth/reset-password`

**Implementation:**
- Controller: `AuthController.resetPassword()`
- Service: `AuthService.resetPassword()`
- DTO: `ResetPasswordDto`
- Response: Success message

**Implementation Details:**
- Verifies user email exists
- Sends password reset email via Supabase
- Returns generic message to prevent user enumeration

**Code Example:**
```typescript
@Post('reset-password')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'Request password reset' })
async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
  const result = await this.authService.resetPassword(resetPasswordDto);
  return new SuccessResponseDto(result, 'Password reset email sent');
}
```

### 5. Get User Profile

**Endpoint:** `GET /api/v1/auth/profile`

**Implementation:**
- Controller: `AuthController.getProfile()`
- Service: `AuthService.getUserProfile()`
- Guards: `JwtAuthGuard`
- Response: User profile data

**Implementation Details:**
- Protected by JWT authentication
- Extracts user ID from JWT token
- Retrieves user profile from database
- Returns user profile data

**Code Example:**
```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get current user profile' })
async getProfile(@UserId() userId: string) {
  const result = await this.authService.getUserProfile(userId);
  return new SuccessResponseDto(result, 'Profile retrieved successfully');
}
```

### 6. Update User Profile

**Endpoint:** `PUT /api/v1/auth/profile`

**Implementation:**
- Controller: `AuthController.updateProfile()`
- Service: `AuthService.updateProfile()`
- Guards: `JwtAuthGuard`
- Response: Updated user profile data

**Implementation Details:**
- Protected by JWT authentication
- Extracts user ID from JWT token
- Updates profile in database
- Returns updated profile data

**Code Example:**
```typescript
@Put('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Update user profile' })
async updateProfile(
  @UserId() userId: string,
  @Body() updateData: { fullName?: string },
) {
  const result = await this.authService.updateProfile(userId, updateData);
  return new SuccessResponseDto(result, 'Profile updated successfully');
}
```

### 7. Get Current User Info

**Endpoint:** `GET /api/v1/auth/me`

**Implementation:**
- Controller: `AuthController.getCurrentUser()`
- Guards: `JwtAuthGuard`
- Response: Current user data

**Implementation Details:**
- Protected by JWT authentication
- Extracts user info from JWT token
- Returns user data directly from token

**Code Example:**
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get current user info' })
async getCurrentUser(@CurrentUser() user: any) {
  return new SuccessResponseDto(user, 'User info retrieved');
}
```

## Products API

### 1. Get All Products

**Endpoint:** `GET /api/v1/products`

**Implementation:**
- Controller: `ProductsController.findAll()`
- Service: `ProductsService.findAll()`
- Query Params: pagination, filters, sorting
- Response: Paginated list of products

**Implementation Details:**
- Supports query parameters for filtering (category, price range, etc.)
- Pagination with limit and offset
- Optional search by product name or description
- Sorting options

**Code Example:**
```typescript
@Get()
@ApiOperation({ summary: 'Get all products with pagination and filters' })
async findAll(
  @Query() query: ProductQueryDto,
): Promise<PaginatedResponseDto<Product[]>> {
  const { products, count } = await this.productsService.findAll(query);
  return new PaginatedResponseDto(
    products,
    { page: query.page, limit: query.limit, total: count },
    'Products retrieved successfully',
  );
}
```

### 2. Get Product by ID

**Endpoint:** `GET /api/v1/products/:id`

**Implementation:**
- Controller: `ProductsController.findOne()`
- Service: `ProductsService.findOne()`
- Params: product ID
- Response: Product details

**Implementation Details:**
- Validates product ID
- Retrieves product with related data (category, reviews)
- Returns product details or 404 if not found

**Code Example:**
```typescript
@Get(':id')
@ApiOperation({ summary: 'Get product by ID' })
async findOne(@Param('id') id: string): Promise<SuccessResponseDto<Product>> {
  const product = await this.productsService.findOne(id);
  return new SuccessResponseDto(product, 'Product retrieved successfully');
}
```

### 3. Create Product (Admin Only)

**Endpoint:** `POST /api/v1/products`

**Implementation:**
- Controller: `ProductsController.create()`
- Service: `ProductsService.create()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- DTO: `CreateProductDto`
- Response: Created product

**Implementation Details:**
- Protected by JWT and admin role check
- Validates product data
- Creates product in database
- Handles image URLs

**Code Example:**
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Create a new product (Admin only)' })
async create(@Body() createProductDto: CreateProductDto): Promise<SuccessResponseDto<Product>> {
  const product = await this.productsService.create(createProductDto);
  return new SuccessResponseDto(product, 'Product created successfully');
}
```

### 4. Update Product (Admin Only)

**Endpoint:** `PATCH /api/v1/products/:id`

**Implementation:**
- Controller: `ProductsController.update()`
- Service: `ProductsService.update()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- DTO: `UpdateProductDto`
- Response: Updated product

**Implementation Details:**
- Protected by JWT and admin role check
- Validates product exists
- Updates product in database
- Returns updated product data

**Code Example:**
```typescript
@Patch(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Update a product (Admin only)' })
async update(
  @Param('id') id: string,
  @Body() updateProductDto: UpdateProductDto,
): Promise<SuccessResponseDto<Product>> {
  const product = await this.productsService.update(id, updateProductDto);
  return new SuccessResponseDto(product, 'Product updated successfully');
}
```

### 5. Delete Product (Admin Only)

**Endpoint:** `DELETE /api/v1/products/:id`

**Implementation:**
- Controller: `ProductsController.remove()`
- Service: `ProductsService.remove()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Response: Success message

**Implementation Details:**
- Protected by JWT and admin role check
- Validates product exists
- Soft deletes product (sets isActive to false)
- Returns success message

**Code Example:**
```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Delete a product (Admin only)' })
async remove(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
  await this.productsService.remove(id);
  return new SuccessResponseDto(null, 'Product deleted successfully');
}
```

### 6. Get Low Stock Products (Admin Only)

**Endpoint:** `GET /api/v1/products/low-stock`

**Implementation:**
- Controller: `ProductsController.getLowStockProducts()`
- Service: `ProductsService.getLowStockProducts()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Response: List of low stock products

**Implementation Details:**
- Protected by JWT and admin role check
- Gets products with stock below threshold
- Supports custom threshold parameter
- Returns list of products with low stock

**Code Example:**
```typescript
@Get('low-stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Get low stock products (Admin only)' })
async getLowStockProducts(
  @Query('threshold') threshold?: number,
): Promise<SuccessResponseDto<Product[]>> {
  const products = await this.productsService.getLowStockProducts(threshold);
  return new SuccessResponseDto(products, 'Low stock products retrieved successfully');
}
```

## Categories API

### 1. Get All Categories

**Endpoint:** `GET /api/v1/categories`

**Implementation:**
- Controller: `CategoriesController.findAll()`
- Service: `CategoriesService.findAll()`
- Query Params: includeInactive
- Response: List of categories

**Implementation Details:**
- Retrieves all active categories by default
- Option to include inactive categories
- Flattened list structure

**Code Example:**
```typescript
@Get()
@ApiOperation({ summary: 'Get all categories' })
async findAll(
  @Query('includeInactive') includeInactive: boolean = false,
): Promise<SuccessResponseDto<Category[]>> {
  const categories = await this.categoriesService.findAll(includeInactive);
  return new SuccessResponseDto(categories, 'Categories retrieved successfully');
}
```

### 2. Get Category Tree

**Endpoint:** `GET /api/v1/categories/tree`

**Implementation:**
- Controller: `CategoriesController.getTree()`
- Service: `CategoriesService.getTree()`
- Response: Hierarchical category tree

**Implementation Details:**
- Builds hierarchical tree structure
- Handles parent-child relationships
- Returns nested category data

**Code Example:**
```typescript
@Get('tree')
@ApiOperation({ summary: 'Get category tree' })
async getTree(): Promise<SuccessResponseDto<any>> {
  const categoryTree = await this.categoriesService.getTree();
  return new SuccessResponseDto(categoryTree, 'Category tree retrieved successfully');
}
```

### 3. Get Category by ID or Slug

**Endpoint:** `GET /api/v1/categories/:identifier`

**Implementation:**
- Controller: `CategoriesController.findOne()`
- Service: `CategoriesService.findOne()`
- Params: Category ID or slug
- Response: Category details

**Implementation Details:**
- Supports lookup by numeric ID or string slug
- Determines lookup type automatically
- Returns category details or 404 if not found

**Code Example:**
```typescript
@Get(':identifier')
@ApiOperation({ summary: 'Get category by ID or slug' })
async findOne(@Param('identifier') identifier: string): Promise<SuccessResponseDto<Category>> {
  const category = await this.categoriesService.findOne(identifier);
  return new SuccessResponseDto(category, 'Category retrieved successfully');
}
```

### 4. Create Category (Admin Only)

**Endpoint:** `POST /api/v1/categories`

**Implementation:**
- Controller: `CategoriesController.create()`
- Service: `CategoriesService.create()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- DTO: `CreateCategoryDto`
- Response: Created category

**Implementation Details:**
- Protected by JWT and admin role check
- Validates category data
- Generates slug from name if not provided
- Creates category in database

**Code Example:**
```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Create a new category (Admin only)' })
async create(@Body() createCategoryDto: CreateCategoryDto): Promise<SuccessResponseDto<Category>> {
  const category = await this.categoriesService.create(createCategoryDto);
  return new SuccessResponseDto(category, 'Category created successfully');
}
```

### 5. Update Category (Admin Only)

**Endpoint:** `PUT /api/v1/categories/:id`

**Implementation:**
- Controller: `CategoriesController.update()`
- Service: `CategoriesService.update()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- DTO: `UpdateCategoryDto`
- Response: Updated category

**Implementation Details:**
- Protected by JWT and admin role check
- Validates category exists
- Updates category in database
- Updates slug if name changes
- Returns updated category

**Code Example:**
```typescript
@Put(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Update a category (Admin only)' })
async update(
  @Param('id') id: string,
  @Body() updateCategoryDto: UpdateCategoryDto,
): Promise<SuccessResponseDto<Category>> {
  const category = await this.categoriesService.update(id, updateCategoryDto);
  return new SuccessResponseDto(category, 'Category updated successfully');
}
```

### 6. Delete Category (Admin Only)

**Endpoint:** `DELETE /api/v1/categories/:id`

**Implementation:**
- Controller: `CategoriesController.remove()`
- Service: `CategoriesService.remove()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Response: Success message

**Implementation Details:**
- Protected by JWT and admin role check
- Validates category exists
- Checks for products in category
- Soft deletes category (sets isActive to false)
- Returns success message

**Code Example:**
```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Delete a category (Admin only)' })
async remove(@Param('id') id: string): Promise<SuccessResponseDto<any>> {
  await this.categoriesService.remove(id);
  return new SuccessResponseDto(null, 'Category deleted successfully');
}
```

## Orders API

### 1. Create Order

**Endpoint:** `POST /api/v1/orders`

**Implementation:**
- Controller: `OrdersController.create()`
- Service: `OrdersService.create()`
- Guards: `JwtAuthGuard`
- DTO: `CreateOrderDto`
- Response: Created order

**Implementation Details:**
- Protected by JWT authentication
- Validates product availability and stock
- Creates order with items in database
- Uses transaction for data integrity
- Returns created order with details

**Code Example:**
```typescript
@Post()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Create a new order' })
async create(
  @UserId() userId: string,
  @Body() createOrderDto: CreateOrderDto,
): Promise<SuccessResponseDto<Orders>> {
  const order = await this.ordersService.create(userId, createOrderDto);
  return new SuccessResponseDto(order, 'Order created successfully');
}
```

### 2. Get User Orders

**Endpoint:** `GET /api/v1/orders`

**Implementation:**
- Controller: `OrdersController.findAll()`
- Service: `OrdersService.findAll()`
- Guards: `JwtAuthGuard`
- Query Params: pagination, filters
- Response: Paginated list of orders

**Implementation Details:**
- Protected by JWT authentication
- Regular users see only their orders
- Admin users see all orders
- Supports pagination and filtering
- Returns orders with items

**Code Example:**
```typescript
@Get()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get all orders (users see their own, admins see all)' })
async findAll(
  @UserId() userId: string,
  @UserRole() role: string,
  @Query() query: OrderQueryDto,
): Promise<PaginatedResponseDto<Orders[]>> {
  const { orders, count } = await this.ordersService.findAll(userId, role, query);
  return new PaginatedResponseDto(
    orders,
    { page: query.page, limit: query.limit, total: count },
    'Orders retrieved successfully',
  );
}
```

### 3. Get Order by ID

**Endpoint:** `GET /api/v1/orders/:id`

**Implementation:**
- Controller: `OrdersController.findOne()`
- Service: `OrdersService.findOne()`
- Guards: `JwtAuthGuard`
- Params: Order ID
- Response: Order details

**Implementation Details:**
- Protected by JWT authentication
- Validates order exists
- Checks user permission (own order or admin)
- Returns order with items and address

**Code Example:**
```typescript
@Get(':id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get order by ID' })
async findOne(
  @Param('id') id: string,
  @UserId() userId: string,
  @UserRole() role: string,
): Promise<SuccessResponseDto<Orders>> {
  const order = await this.ordersService.findOne(id, userId, role);
  return new SuccessResponseDto(order, 'Order retrieved successfully');
}
```

### 4. Update Order Status (Admin Only)

**Endpoint:** `PATCH /api/v1/orders/:id/status`

**Implementation:**
- Controller: `OrdersController.updateStatus()`
- Service: `OrdersService.updateStatus()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- DTO: `UpdateOrderStatusDto`
- Response: Updated order

**Implementation Details:**
- Protected by JWT and admin role check
- Validates order exists
- Updates order status
- Creates order tracking entry
- Returns updated order

**Code Example:**
```typescript
@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Update order status (Admin only)' })
async updateStatus(
  @Param('id') id: string,
  @Body() updateStatusDto: UpdateOrderStatusDto,
): Promise<SuccessResponseDto<Orders>> {
  const order = await this.ordersService.updateStatus(id, updateStatusDto.status);
  return new SuccessResponseDto(order, 'Order status updated successfully');
}
```

### 5. Get Order Statistics

**Endpoint:** `GET /api/v1/orders/stats`

**Implementation:**
- Controller: `OrdersController.getStats()`
- Service: `OrdersService.getStats()`
- Guards: `JwtAuthGuard`
- Response: Order statistics

**Implementation Details:**
- Protected by JWT authentication
- Regular users see their own stats
- Admin users see global stats
- Calculates totals by status
- Returns comprehensive statistics

**Code Example:**
```typescript
@Get('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get order statistics' })
async getStats(
  @UserId() userId: string,
  @UserRole() role: string,
): Promise<SuccessResponseDto<any>> {
  const stats = await this.ordersService.getStats(userId, role);
  return new SuccessResponseDto(stats, 'Order statistics retrieved successfully');
}
```

## Payments API

### 1. Initiate Payment

**Endpoint:** `POST /api/v1/payments/initiate`

**Implementation:**
- Controller: `PaymentsController.initiatePayment()`
- Service: `PaymentsService.initiatePayment()`
- Guards: `JwtAuthGuard`
- DTO: `InitiatePaymentDto`
- Response: Payment initialization data

**Implementation Details:**
- Protected by JWT authentication
- Validates order belongs to user
- Creates payment transaction record
- Integrates with payment gateway (Paystack/Flutterwave)
- Returns payment link and reference

**Code Example:**
```typescript
@Post('initiate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Initiate payment for an order' })
async initiatePayment(
  @UserId() userId: string,
  @Body() initiatePaymentDto: InitiatePaymentDto,
): Promise<SuccessResponseDto<any>> {
  const result = await this.paymentsService.initiatePayment(userId, initiatePaymentDto);
  return new SuccessResponseDto(result, 'Payment initiated successfully');
}
```

### 2. Verify Payment

**Endpoint:** `POST /api/v1/payments/verify`

**Implementation:**
- Controller: `PaymentsController.verifyPayment()`
- Service: `PaymentsService.verifyPayment()`
- Guards: `JwtAuthGuard`
- DTO: `VerifyPaymentDto`
- Response: Payment verification result

**Implementation Details:**
- Protected by JWT authentication
- Verifies payment with gateway
- Updates payment transaction status
- Updates order status if paid
- Returns verification result

**Code Example:**
```typescript
@Post('verify')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Verify payment status' })
async verifyPayment(
  @Body() verifyPaymentDto: VerifyPaymentDto,
): Promise<SuccessResponseDto<any>> {
  const result = await this.paymentsService.verifyPayment(verifyPaymentDto);
  return new SuccessResponseDto(result, 'Payment verified successfully');
}
```

### 3. Get Payment History

**Endpoint:** `GET /api/v1/payments/history`

**Implementation:**
- Controller: `PaymentsController.getPaymentHistory()`
- Service: `PaymentsService.getPaymentHistory()`
- Guards: `JwtAuthGuard`
- Response: Payment transaction history

**Implementation Details:**
- Protected by JWT authentication
- Regular users see their own transactions
- Admin users see all transactions
- Returns transaction list with order details

**Code Example:**
```typescript
@Get('history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get payment transaction history' })
async getPaymentHistory(
  @UserId() userId: string,
  @UserRole() role: string,
): Promise<SuccessResponseDto<PaymentTransaction[]>> {
  const transactions = await this.paymentsService.getPaymentHistory(userId, role);
  return new SuccessResponseDto(transactions, 'Payment history retrieved successfully');
}
```

### 4. Initiate Bank Transfer

**Endpoint:** `POST /api/v1/payments/bank-transfer/initiate`

**Implementation:**
- Controller: `PaymentsController.initiateBankTransfer()`
- Service: `PaymentsService.initiateBankTransfer()`
- Guards: `JwtAuthGuard`
- DTO: `InitiateBankTransferDto`
- Response: Bank transfer details

**Implementation Details:**
- Protected by JWT authentication
- Validates order belongs to user
- Creates payment transaction record
- Retrieves bank account details
- Returns transfer instructions

**Code Example:**
```typescript
@Post('bank-transfer/initiate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get bank transfer details for payment' })
async initiateBankTransfer(
  @UserId() userId: string,
  @Body() initiateDto: InitiateBankTransferDto,
): Promise<SuccessResponseDto<any>> {
  const result = await this.paymentsService.initiateBankTransfer(userId, initiateDto);
  return new SuccessResponseDto(result, 'Bank transfer details provided successfully');
}
```

### 5. Upload Payment Receipt

**Endpoint:** `POST /api/v1/payments/receipt/upload`

**Implementation:**
- Controller: `PaymentsController.uploadReceipt()`
- Service: `PaymentsService.uploadReceipt()`
- Guards: `JwtAuthGuard`
- DTO: FormData with file and transaction ID
- Response: Uploaded receipt details

**Implementation Details:**
- Protected by JWT authentication
- Validates transaction belongs to user
- Uploads receipt to storage (Supabase)
- Creates receipt record in database
- Returns receipt details with URL

**Code Example:**
```typescript
@Post('receipt/upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Upload payment receipt' })
@UseInterceptors(FileInterceptor('file'))
async uploadReceipt(
  @UserId() userId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body() uploadDto: UploadReceiptDto,
): Promise<SuccessResponseDto<PaymentReceipt>> {
  const receipt = await this.paymentsService.uploadReceipt(userId, file, uploadDto);
  return new SuccessResponseDto(receipt, 'Receipt uploaded successfully');
}
```

### 6. Get Pending Receipts (Admin Only)

**Endpoint:** `GET /api/v1/payments/receipts/pending`

**Implementation:**
- Controller: `PaymentsController.getPendingReceipts()`
- Service: `PaymentsService.getPendingReceipts()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Response: List of pending receipts

**Implementation Details:**
- Protected by JWT and admin role check
- Retrieves receipts with PENDING status
- Includes transaction and uploader details
- Returns receipt list

**Code Example:**
```typescript
@Get('receipts/pending')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Get pending receipts (Admin only)' })
async getPendingReceipts(): Promise<SuccessResponseDto<PaymentReceipt[]>> {
  const receipts = await this.paymentsService.getPendingReceipts();
  return new SuccessResponseDto(receipts, 'Pending receipts retrieved successfully');
}
```

### 7. Verify Receipt (Admin Only)

**Endpoint:** `PATCH /api/v1/payments/receipt/:receiptId/verify`

**Implementation:**
- Controller: `PaymentsController.verifyReceipt()`
- Service: `PaymentsService.verifyReceipt()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- DTO: `VerifyReceiptDto`
- Response: Verification result

**Implementation Details:**
- Protected by JWT and admin role check
- Updates receipt verification status
- Updates payment transaction status
- Updates order status if approved
- Uses transaction for data integrity
- Returns verification result

**Code Example:**
```typescript
@Patch('receipt/:receiptId/verify')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Verify or reject a payment receipt (Admin only)' })
async verifyReceipt(
  @Param('receiptId') receiptId: string,
  @UserId() adminId: string,
  @Body() verifyDto: VerifyReceiptDto,
): Promise<SuccessResponseDto<any>> {
  const result = await this.paymentsService.verifyReceipt(receiptId, adminId, verifyDto);
  return new SuccessResponseDto(result, 'Receipt verification completed');
}
```

## Users API

### 1. Get All Users (Admin Only)

**Endpoint:** `GET /api/v1/users`

**Implementation:**
- Controller: `UsersController.findAll()`
- Service: `UsersService.findAll()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Query Params: pagination, filters
- Response: Paginated list of users

**Implementation Details:**
- Protected by JWT and admin role check
- Supports pagination and filtering
- Excludes sensitive information
- Returns user list

**Code Example:**
```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Get all users (Admin only)' })
async findAll(
  @Query() query: UserQueryDto,
): Promise<PaginatedResponseDto<Profile[]>> {
  const { users, count } = await this.usersService.findAll(query);
  return new PaginatedResponseDto(
    users,
    { page: query.page, limit: query.limit, total: count },
    'Users retrieved successfully',
  );
}
```

### 2. Get User by ID (Admin Only)

**Endpoint:** `GET /api/v1/users/:id`

**Implementation:**
- Controller: `UsersController.findOne()`
- Service: `UsersService.findOne()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Params: User ID
- Response: User details

**Implementation Details:**
- Protected by JWT and admin role check
- Validates user exists
- Includes order history
- Returns user details

**Code Example:**
```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Get user by ID (Admin only)' })
async findOne(@Param('id') id: string): Promise<SuccessResponseDto<Profile>> {
  const user = await this.usersService.findOne(id);
  return new SuccessResponseDto(user, 'User retrieved successfully');
}
```

### 3. Update User Status (Admin Only)

**Endpoint:** `PATCH /api/v1/users/:id/status`

**Implementation:**
- Controller: `UsersController.updateStatus()`
- Service: `UsersService.updateStatus()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- DTO: `UpdateUserStatusDto`
- Response: Updated user

**Implementation Details:**
- Protected by JWT and admin role check
- Validates user exists
- Updates user active status
- Prevents deactivating own account
- Returns updated user status

**Code Example:**
```typescript
@Patch(':id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Activate or deactivate a user (Admin only)' })
async updateStatus(
  @Param('id') id: string,
  @UserId() adminId: string,
  @Body() updateStatusDto: UpdateUserStatusDto,
): Promise<SuccessResponseDto<Profile>> {
  const user = await this.usersService.updateStatus(id, adminId, updateStatusDto.isActive);
  return new SuccessResponseDto(user, 'User status updated successfully');
}
```

## Admin API

### Admin Authentication

To access any admin API endpoint, you must:
1. Authenticate using the admin credentials at `POST /api/v1/auth/admin/signin`
2. Include the returned JWT token in the Authorization header of all requests
3. The token must have the ADMIN role assigned

**Default Admin Credentials:**
- Email: `admin@jjessential.com`
- Password: `admin123`

### 1. Get Dashboard Data

**Endpoint:** `GET /api/v1/admin/dashboard`

**Implementation:**
- Controller: `AdminController.getDashboardData()`
- Service: `AdminService.getDashboardData()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Response: Dashboard statistics

**Implementation Details:**
- Protected by JWT and admin role check
- Aggregates data from multiple services
- Includes sales, orders, products, users statistics
- Provides activity feed
- Returns comprehensive dashboard data

**Response Format:**
```json
{
  "statusCode": 200,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "salesStats": {
      "totalSales": 15000.50,
      "todaySales": 1250.75,
      "weekSales": 5400.25,
      "monthSales": 15000.50,
      "salesGrowth": 12.5
    },
    "orderStats": {
      "totalOrders": 156,
      "pendingOrders": 23,
      "completedOrders": 120,
      "cancelledOrders": 13
    },
    "productStats": {
      "totalProducts": 89,
      "lowStockProducts": 12,
      "outOfStockProducts": 3,
      "featuredProducts": 6
    },
    "userStats": {
      "totalUsers": 250,
      "newUsersToday": 5,
      "activeUsers": 180
    },
    "recentOrders": [
      {
        "id": "order-uuid",
        "userId": "user-uuid",
        "userEmail": "customer@example.com",
        "totalAmount": 120.50,
        "status": "PENDING",
        "createdAt": "2025-08-12T10:30:00Z"
      }
    ],
    "recentUsers": [
      {
        "id": "user-uuid",
        "email": "newuser@example.com",
        "fullName": "New User",
        "createdAt": "2025-08-12T09:45:00Z"
      }
    ],
    "activityFeed": [
      {
        "type": "ORDER_CREATED",
        "message": "New order #123 created",
        "timestamp": "2025-08-12T10:30:00Z"
      },
      {
        "type": "USER_REGISTERED",
        "message": "New user registered: user@example.com",
        "timestamp": "2025-08-12T09:45:00Z"
      }
    ]
  }
}
```

**Code Example:**
```typescript
@Get('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Get admin dashboard data' })
async getDashboardData(): Promise<SuccessResponseDto<any>> {
  const dashboardData = await this.adminService.getDashboardData();
  return new SuccessResponseDto(dashboardData, 'Dashboard data retrieved successfully');
}
```

### 2. Get Sales Reports

**Endpoint:** `GET /api/v1/admin/reports/sales`

**Implementation:**
- Controller: `AdminController.getSalesReport()`
- Service: `AdminService.getSalesReport()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Query Params: date range, grouping
- Response: Sales report data

**Implementation Details:**
- Protected by JWT and admin role check
- Aggregates sales data
- Supports different date ranges
- Groups by product, category, or date
- Returns formatted report data

**Code Example:**
```typescript
@Get('reports/sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Get sales report' })
async getSalesReport(
  @Query() query: SalesReportQueryDto,
): Promise<SuccessResponseDto<any>> {
  const report = await this.adminService.getSalesReport(query);
  return new SuccessResponseDto(report, 'Sales report generated successfully');
}
```

### 3. Export Data

**Endpoint:** `GET /api/v1/admin/export/:type`

**Implementation:**
- Controller: `AdminController.exportData()`
- Service: `AdminService.exportData()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Params: Export type (orders, products, users)
- Response: CSV or Excel file

**Implementation Details:**
- Protected by JWT and admin role check
- Formats data for export
- Generates CSV or Excel file
- Supports different data types
- Returns file for download

**Code Example:**
```typescript
@Get('export/:type')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Export data as CSV or Excel' })
async exportData(
  @Param('type') type: string,
  @Query('format') format: string = 'csv',
  @Res() response: Response,
): Promise<void> {
  const { filename, buffer } = await this.adminService.exportData(type, format);
  response.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  response.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  response.send(buffer);
}
```

## Files/Upload API

### 1. Upload File

**Endpoint:** `POST /api/v1/files/upload`

**Implementation:**
- Controller: `FileUploadController.uploadFile()`
- Service: `FileUploadService.uploadFile()`
- Guards: `JwtAuthGuard`
- Response: Uploaded file details

**Implementation Details:**
- Protected by JWT authentication
- Validates file type and size
- Uploads to Supabase storage
- Creates file record in database
- Returns file URL and details

**Code Example:**
```typescript
@Post('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Upload a file' })
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UserId() userId: string,
  @UploadedFile() file: Express.Multer.File,
  @Body('bucket') bucket: string = 'general',
): Promise<SuccessResponseDto<FileUpload>> {
  const uploadedFile = await this.fileUploadService.uploadFile(file, userId, bucket);
  return new SuccessResponseDto(uploadedFile, 'File uploaded successfully');
}
```

### 2. Upload Product Image

**Endpoint:** `POST /api/v1/files/product-image`

**Implementation:**
- Controller: `FileUploadController.uploadProductImage()`
- Service: `FileUploadService.uploadProductImage()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Response: Uploaded image details

**Implementation Details:**
- Protected by JWT and admin role check
- Validates image type and size
- Optimizes image if needed
- Uploads to Supabase storage in products bucket
- Returns image URL and details

**Code Example:**
```typescript
@Post('product-image')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Upload a product image (Admin only)' })
@UseInterceptors(FileInterceptor('file'))
async uploadProductImage(
  @UserId() userId: string,
  @UploadedFile() file: Express.Multer.File,
): Promise<SuccessResponseDto<FileUpload>> {
  const uploadedFile = await this.fileUploadService.uploadProductImage(file, userId);
  return new SuccessResponseDto(uploadedFile, 'Product image uploaded successfully');
}
```

### 3. Get File by ID

**Endpoint:** `GET /api/v1/files/:id`

**Implementation:**
- Controller: `FileUploadController.getFile()`
- Service: `FileUploadService.getFile()`
- Guards: `JwtAuthGuard`
- Params: File ID
- Response: File details

**Implementation Details:**
- Protected by JWT authentication
- Validates file exists
- Checks user permission
- Returns file details with URL

**Code Example:**
```typescript
@Get(':id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get file by ID' })
async getFile(
  @Param('id') id: string,
  @UserId() userId: string,
  @UserRole() role: string,
): Promise<SuccessResponseDto<FileUpload>> {
  const file = await this.fileUploadService.getFile(id, userId, role);
  return new SuccessResponseDto(file, 'File retrieved successfully');
}
```

## Search API

### 1. Search Products

**Endpoint:** `GET /api/v1/search/products`

**Implementation:**
- Controller: `SearchController.searchProducts()`
- Service: `SearchService.searchProducts()`
- Query Params: q (search term), filters
- Response: Search results

**Implementation Details:**
- Performs full-text search on products
- Supports filtering by category, price range
- Uses database full-text search capabilities
- Returns matching products

**Code Example:**
```typescript
@Get('products')
@ApiOperation({ summary: 'Search products' })
async searchProducts(
  @Query() query: SearchProductsDto,
): Promise<SuccessResponseDto<Product[]>> {
  const products = await this.searchService.searchProducts(query);
  return new SuccessResponseDto(products, 'Search results retrieved successfully');
}
```

### 2. Global Search (Admin Only)

**Endpoint:** `GET /api/v1/search`

**Implementation:**
- Controller: `SearchController.globalSearch()`
- Service: `SearchService.globalSearch()`
- Guards: `JwtAuthGuard`, `RolesGuard`
- Decorators: `@AdminOnly()`
- Query Params: q (search term), type
- Response: Multi-entity search results

**Implementation Details:**
- Protected by JWT and admin role check
- Searches across multiple entities
- Supports filtering by entity type
- Returns categorized results

**Code Example:**
```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
@ApiOperation({ summary: 'Global search across all entities (Admin only)' })
async globalSearch(
  @Query() query: GlobalSearchDto,
): Promise<SuccessResponseDto<any>> {
  const results = await this.searchService.globalSearch(query);
  return new SuccessResponseDto(results, 'Search results retrieved successfully');
}
```

## Security and Common Features

### JWT Authentication

All protected endpoints use JWT authentication via the `JwtAuthGuard`:

```typescript
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
```

### Role-Based Access Control

Admin-only endpoints use both JWT authentication and role checking:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
```

### Pagination

Endpoints returning lists support pagination:

```typescript
new PaginatedResponseDto(
  items,
  { page: query.page, limit: query.limit, total: count },
  'Message'
)
```

### Success Response Format

All successful responses use a consistent format:

```typescript
new SuccessResponseDto(data, 'Success message')
```

### Error Handling

Errors are handled using NestJS exception filters:

```typescript
throw new NotFoundException('Resource not found');
throw new UnauthorizedException('Invalid credentials');
throw new BadRequestException('Invalid input');
```

## Integration Points

### Supabase Integration

- Authentication via Supabase Auth
- File storage via Supabase Storage
- Real-time features via Supabase Realtime

### Payment Gateway Integration

- Paystack integration for card payments
- Flutterwave as alternative payment gateway
- Manual bank transfer option

## Admin Dashboard API

The admin dashboard is powered by specialized endpoints that provide comprehensive data:

1. **Dashboard Overview**: `GET /api/v1/admin/dashboard`
2. **Sales Reports**: `GET /api/v1/admin/reports/sales`
3. **Order Reports**: `GET /api/v1/admin/reports/orders`
4. **Customer Reports**: `GET /api/v1/admin/reports/customers`
5. **Inventory Reports**: `GET /api/v1/admin/reports/inventory`
6. **Data Export**: `GET /api/v1/admin/export/:type`

These endpoints provide the data necessary for implementing the comprehensive admin dashboard described in the requirements.
