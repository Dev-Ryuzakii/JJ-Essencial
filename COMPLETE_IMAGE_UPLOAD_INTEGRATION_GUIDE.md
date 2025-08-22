# Complete Product Image Upload Integration Guide

## ✅ Backend Status: FULLY WORKING

The backend image upload system has been tested and is working perfectly:
- ✅ Supabase storage bucket accessible
- ✅ Image upload endpoint functioning
- ✅ Authentication working
- ✅ File processing working

## API Endpoints

### 1. Upload Product Images
```
POST /api/v1/admin/products/:productId/images
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**Request Body:**
```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2); // Multiple files supported
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Product images uploaded successfully",
  "data": [
    {
      "id": "bczzcvhdvand85k5mcee",
      "url": "https://rqvymrvqtkdzkeoaynfr.supabase.co/storage/v1/object/public/products/images/1755899542978-zfmr0eb5e5n.png",
      "isMain": false,
      "sortOrder": 0
    }
  ],
  "timestamp": "2025-08-22T21:52:25.082Z"
}
```

### 2. Set Main Product Image
```
PUT /api/v1/admin/products/:productId/images/:imageId/main
Authorization: Bearer {admin_token}
```

### 3. Delete Product Image
```
DELETE /api/v1/admin/products/:productId/images/:imageId
Authorization: Bearer {admin_token}
```

## Frontend Implementation

### React Component Example

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface ProductImageUploadProps {
  productId: string;
  authToken: string;
  onUploadSuccess?: (images: any[]) => void;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  productId,
  authToken,
  onUploadSuccess
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Add all selected files
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await axios.post(
        `http://localhost:3000/api/v1/admin/products/${productId}/images`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.status === 201) {
        console.log('Upload successful:', response.data);
        onUploadSuccess?.(response.data.data);
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload-component">
      <div className="upload-section">
        <label htmlFor="product-images" className="upload-label">
          {uploading ? 'Uploading...' : 'Choose Images'}
        </label>
        <input
          id="product-images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}

      {uploading && (
        <div className="loading-indicator">
          Uploading images...
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload;
```

### Complete Product Form with Image Upload

```typescript
import React, { useState } from 'react';
import axios from 'axios';
import ProductImageUpload from './ProductImageUpload';

const ProductForm: React.FC = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    categoryId: '',
    isActive: true
  });
  const [productId, setProductId] = useState<string | null>(null);
  const [authToken] = useState(localStorage.getItem('adminToken')); // Get from your auth system
  const [images, setImages] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        'http://localhost:3000/api/v1/admin/products',
        {
          ...productData,
          price: parseFloat(productData.price),
          stock: parseInt(productData.stock)
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        setProductId(response.data.data.id);
        alert('Product created successfully! You can now upload images.');
      }
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleImageUploadSuccess = (uploadedImages: any[]) => {
    setImages(prev => [...prev, ...uploadedImages]);
    alert(`${uploadedImages.length} image(s) uploaded successfully!`);
  };

  return (
    <div className="product-form">
      <h2>Create New Product</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name:</label>
          <input
            type="text"
            value={productData.name}
            onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={productData.description}
            onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Price:</label>
          <input
            type="number"
            step="0.01"
            value={productData.price}
            onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Stock:</label>
          <input
            type="number"
            value={productData.stock}
            onChange={(e) => setProductData(prev => ({ ...prev, stock: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>SKU:</label>
          <input
            type="text"
            value={productData.sku}
            onChange={(e) => setProductData(prev => ({ ...prev, sku: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Category ID:</label>
          <input
            type="text"
            value={productData.categoryId}
            onChange={(e) => setProductData(prev => ({ ...prev, categoryId: e.target.value }))}
            placeholder="e.g., 6717c6b6-8e30-4bb7-bfcf-a37cc08c8570"
            required
          />
        </div>

        <button type="submit" disabled={!authToken}>
          Create Product
        </button>
      </form>

      {productId && (
        <div className="image-upload-section" style={{ marginTop: '30px' }}>
          <h3>Upload Product Images</h3>
          <ProductImageUpload
            productId={productId}
            authToken={authToken!}
            onUploadSuccess={handleImageUploadSuccess}
          />
          
          {images.length > 0 && (
            <div className="uploaded-images" style={{ marginTop: '20px' }}>
              <h4>Uploaded Images:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {images.map((image, index) => (
                  <div key={image.id} style={{ border: '1px solid #ccc', padding: '10px' }}>
                    <img
                      src={image.url}
                      alt={`Product ${index + 1}`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                    />
                    <p style={{ fontSize: '12px', marginTop: '5px' }}>
                      {image.isMain ? '⭐ Main' : `#${image.sortOrder}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductForm;
```

## Error Handling

### Common Frontend Issues & Solutions

1. **401 Unauthorized**
   ```javascript
   // Ensure admin token is valid
   const token = localStorage.getItem('adminToken');
   if (!token) {
     // Redirect to login
   }
   ```

2. **400 Bad Request**
   ```javascript
   // Check FormData construction
   const formData = new FormData();
   formData.append('images', file); // 'images' field name is required
   ```

3. **404 Not Found**
   ```javascript
   // Ensure product exists before uploading
   const productExists = await checkProductExists(productId);
   ```

4. **413 Payload Too Large**
   ```javascript
   // Check file sizes (backend limit: 5MB per file)
   const maxSize = 5 * 1024 * 1024; // 5MB
   if (file.size > maxSize) {
     throw new Error('File too large');
   }
   ```

## Testing Your Implementation

### 1. Test with Postman/curl
```bash
# Get admin token first
curl -X POST http://localhost:3000/api/v1/auth/admin/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"jadesola0518@gmail.com","password":"Amoke1805"}'

# Upload image
curl -X POST http://localhost:3000/api/v1/admin/products/{PRODUCT_ID}/images \
  -H "Authorization: Bearer {TOKEN}" \
  -F "images=@/path/to/image.jpg"
```

### 2. Test with our JavaScript test
```bash
cd /Users/macbook/JJ-ESSENCIAL
node test-image-upload.js
```

## Backend Configuration ✅

The backend is properly configured with:
- ✅ Supabase storage bucket "products"
- ✅ Service role authentication
- ✅ File validation (5MB limit, image types only)
- ✅ Image processing and URL generation
- ✅ Database integration (images stored in product.images JSON field)

## Next Steps

1. **Implement the React component** using the examples above
2. **Set up authentication** to get admin tokens
3. **Test with your frontend** - the backend is ready!
4. **Add image preview** and management features
5. **Implement set main image** and delete functionality

## Support

If you encounter issues:
1. Check browser network tab for actual error responses
2. Verify admin token is being sent correctly
3. Ensure FormData is constructed properly
4. Check file types and sizes
5. The backend is working - focus on frontend implementation!

---

**Backend Status: ✅ FULLY FUNCTIONAL**  
**Ready for frontend integration!**
