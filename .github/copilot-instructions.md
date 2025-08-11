# Copilot Instructions for E-commerce Backend

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a full-scale e-commerce backend built with NestJS, Supabase (PostgreSQL), and Prisma ORM. The API supports multi-role authentication (admin/user), product management, order processing, payment integration (Paystack & Flutterwave), and real-time features.

## Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth + JWT
- **Payments**: Paystack and Flutterwave integration
- **Real-time**: Supabase Realtime + Socket.IO
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate limiting, Role-based access

## Code Standards
1. **API Structure**: Follow RESTful conventions with proper HTTP status codes
2. **DTOs**: Use class-validator for input validation and swagger decorators for documentation
3. **Error Handling**: Use NestJS built-in exceptions (BadRequestException, NotFoundException, etc.)
4. **Security**: Always use guards (JwtAuthGuard, RolesGuard) for protected routes
5. **Database**: Use Prisma transactions for complex operations
6. **Response Format**: Always return SuccessResponseDto or PaginatedResponseDto

## Module Structure
Each module should contain:
- `dto/` - Data Transfer Objects with validation
- `*.controller.ts` - API endpoints with Swagger documentation
- `*.service.ts` - Business logic
- `*.module.ts` - Module configuration

## Authentication & Authorization
- Use `@UseGuards(JwtAuthGuard)` for authenticated routes
- Use `@AdminOnly()` decorator for admin-only endpoints
- Extract user info with `@UserId()` and `@UserRole()` decorators

## Database Best Practices
- Always handle database errors gracefully
- Use transactions for operations affecting multiple tables
- Format decimal values when returning to frontend
- Use soft deletion (isActive: false) instead of hard deletion

## Payment Integration
- Support both Paystack and Flutterwave
- Always verify payments server-side
- Handle webhooks securely with signature verification
- Store transaction references for tracking

## Error Responses
Return consistent error responses:
```typescript
throw new BadRequestException('Clear error message');
```

## Success Responses
Always wrap responses in SuccessResponseDto:
```typescript
return new SuccessResponseDto(data, 'Success message');
```
