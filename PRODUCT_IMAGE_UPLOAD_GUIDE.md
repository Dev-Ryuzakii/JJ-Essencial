# Product Image Upload Implementation Guide

This guide provides the correct implementation for handling product image uploads from backend to frontend in the JJ-ESSENCIAL e-commerce application.

## Table of Contents
- [Backend Implementation](#backend-implementation)
- [Frontend Implementation](#frontend-implementation)
- [API Endpoint Usage](#api-endpoint-usage)
- [Error Handling](#error-handling)
- [Testing Examples](#testing-examples)

## Backend Implementation

### 1. Controller Endpoint

The backend provides the following endpoint for uploading product images:

```typescript
@Post('products/:id/images')
@ApiOperation({ summary: 'Upload images for a product' })
@ApiParam({ name: 'id', description: 'Product ID' })
@UseInterceptors(FilesInterceptor('images', 10)) // Max 10 images
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'Product images upload',
  schema: {
    type: 'object',
    properties: {
      images: {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary'
        }
      },
      isMain: {
        type: 'boolean',
        description: 'Set as main product image',
        default: false
      }
    }
  }
})
async uploadProductImages(
  @Param('id') productId: string,
  @UploadedFiles() images: Express.Multer.File[],
  @Query('isMain') isMain?: string
): Promise<SuccessResponseDto<ProductImageResponseDto[]>> {
  const isMainImage = isMain === 'true';
  const result = await this.adminService.uploadProductImages(productId, images, isMainImage);
  return new SuccessResponseDto(result, 'Product images uploaded successfully');
}
```

### 2. Request Format

**Endpoint**: `POST /api/v1/admin/products/{productId}/images`

**Headers**:
```
Authorization: Bearer {admin_jwt_token}
Content-Type: multipart/form-data
```

**Form Data**:
- `images`: One or more image files (field name must be "images")
- `isMain`: Boolean string ("true" or "false") - Optional query parameter

### 3. Response Format

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Product images uploaded successfully",
  "data": [
    {
      "id": "image-uuid",
      "url": "https://supabase-storage-url/image.jpg",
      "isMain": true,
      "sortOrder": 1
    }
  ],
  "timestamp": "2025-08-22T21:45:00.000Z"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Frontend Implementation

### 1. API Client Function

```typescript
// adminProductsApi.ts
async uploadProductImages(
  productId: string, 
  files: File[], 
  isMain: boolean = false
): Promise<ProductImageResponseDto[]> {
  const formData = new FormData();
  
  // Add all image files with the field name "images"
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  
  // Build the URL with query parameter
  const url = `/admin/products/${productId}/images${isMain ? '?isMain=true' : ''}`;
  
  try {
    const response = await apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data; // Extract the data from SuccessResponseDto
  } catch (error) {
    console.error('Error uploading product images:', error);
    throw error;
  }
}
```

### 2. React Component Usage

```typescript
// ProductManagement.tsx
const handleSubmitProductForm = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Create product first
  const apiData = {
    name: productFormData.name.trim(),
    description: productFormData.description.trim(),
    price: productFormData.price ? parseFloat(productFormData.price) : 0,
    stock: productFormData.stock ? parseInt(productFormData.stock) : 0,
    sku: productFormData.sku.trim(),
    categoryId: productFormData.categoryId,
    lowStockThreshold: 10,
    isActive: true
  };
  
  try {
    // Step 1: Create the product
    const newProduct = await adminProductsApi.createProduct(apiData);
    const productId = newProduct.id;
    
    // Step 2: Upload images if any selected
    if (selectedImages.length > 0) {
      try {
        const uploadedImages = await adminProductsApi.uploadProductImages(
          productId, 
          selectedImages, 
          true // Set first image as main
        );
        console.log('Images uploaded successfully:', uploadedImages);
      } catch (imageError) {
        console.error('Error uploading images:', imageError);
        setError('Product created but failed to upload images. You can edit the product to add images later.');
      }
    }
    
    // Success - close modal and refresh list
    setShowCreateModal(false);
    setShowEditModal(false);
    fetchProducts();
    
  } catch (err) {
    console.error('Error creating product:', err);
    setError('Failed to create product. Please try again.');
  }
};
```

### 3. File Input Handling

```typescript
const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  // Validate file types
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const invalidFiles = files.filter(file => !validTypes.includes(file.type));
  
  if (invalidFiles.length > 0) {
    setError('Please select only image files (JPEG, PNG, GIF, WebP)');
    return;
  }

  // Validate file sizes (max 5MB per file)
  const maxSize = 5 * 1024 * 1024; // 5MB
  const oversizedFiles = files.filter(file => file.size > maxSize);
  
  if (oversizedFiles.length > 0) {
    setError('Please select images smaller than 5MB each');
    return;
  }

  setSelectedImages(files);
  
  // Create preview URLs
  const previewUrls = files.map(file => URL.createObjectURL(file));
  setImagePreviewUrls(previewUrls);
};
```

## API Endpoint Usage

### 1. Upload Product Images

```bash
curl -X POST "http://localhost:3000/api/v1/admin/products/{productId}/images?isMain=true" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: multipart/form-data" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### 2. JavaScript Fetch Example

```javascript
async function uploadProductImages(productId, imageFiles, isMain = false) {
  const formData = new FormData();
  
  // Add all image files
  imageFiles.forEach(file => {
    formData.append('images', file);
  });
  
  const url = `http://localhost:3000/api/v1/admin/products/${productId}/images${isMain ? '?isMain=true' : ''}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
      // Don't set Content-Type - browser will set it with boundary for multipart/form-data
    },
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  return result.data;
}
```

## Error Handling

### Common Issues and Solutions

#### 1. 400 Bad Request - Validation Error

**Problem**: Form data validation fails

**Solution**: Ensure you're sending the data correctly:
- Use `FormData` for file uploads
- Field name for files must be "images" (plural)
- Use query parameter for `isMain` instead of form field

#### 2. 401 Unauthorized

**Problem**: Missing or invalid admin token

**Solution**: 
```javascript
// Ensure you have a valid admin token
const adminToken = localStorage.getItem('adminToken');
if (!adminToken) {
  throw new Error('Admin authentication required');
}
```

#### 3. 404 Not Found - Product doesn't exist

**Problem**: Product ID is invalid or product doesn't exist

**Solution**: Verify the product was created successfully before uploading images

#### 4. 413 Payload Too Large

**Problem**: File size exceeds server limits

**Solution**: Compress images or implement client-side resizing:
```javascript
// Check file size before upload (max 5MB per file)
const maxSize = 5 * 1024 * 1024;
if (file.size > maxSize) {
  throw new Error('File size must be less than 5MB');
}
```

### Error Handling in Frontend

```typescript
const uploadImagesWithErrorHandling = async (productId: string, files: File[]) => {
  try {
    const result = await adminProductsApi.uploadProductImages(productId, files, true);
    return result;
  } catch (error: any) {
    console.error('Image upload error:', error);
    
    if (error.response?.status === 400) {
      throw new Error('Invalid image files. Please check file format and size.');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (error.response?.status === 404) {
      throw new Error('Product not found. Please refresh and try again.');
    } else if (error.response?.status === 413) {
      throw new Error('File size too large. Please use smaller images.');
    } else {
      throw new Error('Failed to upload images. Please try again.');
    }
  }
};
```

## Testing Examples

### 1. Test with curl

```bash
# First, get an admin token
curl -X POST http://localhost:3000/api/v1/auth/admin/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Then use the token to upload images
curl -X POST "http://localhost:3000/api/v1/admin/products/your-product-id/images?isMain=true" \
  -H "Authorization: Bearer your-admin-token" \
  -F "images=@test-image.jpg"
```

### 2. Test with JavaScript

```javascript
// Test function
async function testImageUpload() {
  try {
    // 1. Get admin token
    const authResponse = await fetch('http://localhost:3000/api/v1/auth/admin/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password'
      })
    });
    
    const authData = await authResponse.json();
    const token = authData.data.access_token;
    
    // 2. Create a test file
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 100, 100);
    
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'test-image.png', { type: 'image/png' });
      
      // 3. Upload the image
      const formData = new FormData();
      formData.append('images', file);
      
      const uploadResponse = await fetch('http://localhost:3000/api/v1/admin/products/your-product-id/images?isMain=true', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const uploadResult = await uploadResponse.json();
      console.log('Upload result:', uploadResult);
    }, 'image/png');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}
```

## Best Practices

1. **Always validate file types and sizes** on the frontend before uploading
2. **Use proper error handling** to provide meaningful feedback to users
3. **Show upload progress** for better user experience
4. **Clean up preview URLs** to prevent memory leaks:
   ```javascript
   // Clean up when component unmounts or files change
   useEffect(() => {
     return () => {
       imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
     };
   }, [imagePreviewUrls]);
   ```
5. **Implement retry logic** for failed uploads
6. **Use optimistic UI updates** where appropriate

## Security Considerations

1. **Always validate admin authentication** before allowing uploads
2. **Implement file type validation** on both frontend and backend
3. **Set reasonable file size limits** to prevent abuse
4. **Scan uploaded files** for malware if handling user uploads
5. **Use secure storage** with proper access controls (Supabase Storage)
