# Product Management Frontend Integration Guide

This guide provides comprehensive information on integrating the product management features of the JJ-ESSENCIAL e-commerce backend with your frontend application.

## Table of Contents
- [API Endpoints Overview](#api-endpoints-overview)
- [Authentication Requirements](#authentication-requirements)
- [Product Data Structures](#product-data-structures)
- [Common Operations](#common-operations)
- [Image Handling](#image-handling)
- [Category Integration](#category-integration)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## API Endpoints Overview

### Public Product Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List all active products (paginated) |
| GET | `/api/v1/products/:id` | Get a single product by ID |
| GET | `/api/v1/products/slug/:slug` | Get a single product by slug |
| GET | `/api/v1/products/category/:categoryId` | Get products by category ID |
| GET | `/api/v1/products/featured` | Get featured products |
| GET | `/api/v1/categories` | Get all active categories |

### Admin Product Endpoints (Admin Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/products` | Create a new product |
| PUT | `/api/v1/admin/products/:id` | Update an existing product |
| DELETE | `/api/v1/admin/products/:id` | Soft delete a product (marks as inactive) |
| GET | `/api/v1/admin/products` | List all products (including inactive ones) |
| POST | `/api/v1/admin/products/image-upload` | Upload product images |
| GET | `/api/v1/admin/categories` | Get all categories (including inactive ones if requested) |

## Authentication Requirements

### Public Access
Public product endpoints don't require authentication. They only return active products.

### Admin Access
For admin operations, include the JWT token in the Authorization header:

```javascript
const headers = {
  'Authorization': `Bearer ${adminToken}`,
  'Content-Type': 'application/json'
};
```

## Product Data Structures

### Product Response Structure

```typescript
interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string; // Decimal as string, format with toFixed(2)
  salePrice: string | null; // Decimal as string when on sale
  stock: number;
  sku: string;
  images: ProductImage[];
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  featured: boolean;
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  attributes: ProductAttribute[];
}

interface ProductImage {
  id: string;
  url: string;
  isMain: boolean;
  sortOrder: number;
}

interface ProductAttribute {
  id: string;
  name: string;
  value: string;
}
```

### Create/Update Product DTO

```typescript
interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  sku: string;
  categoryId: string; // Category ID to associate with the product
  featured?: boolean;
  attributes?: {
    name: string;
    value: string;
  }[];
  // Note: Images are uploaded separately
}
```

## Common Operations

### Fetching Products (Paginated)

```javascript
// Example: Fetch products with pagination, sorting and filtering
async function fetchProducts(page = 1, limit = 10, sort = 'createdAt', order = 'DESC', search = '', categoryId = '') {
  const url = `http://localhost:3000/api/v1/products?page=${page}&limit=${limit}&sortBy=${sort}&sortOrder=${order}&search=${encodeURIComponent(search)}${categoryId ? `&categoryId=${categoryId}` : ''}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return {
        products: data.data.items,
        pagination: {
          total: data.data.meta.totalItems,
          pages: data.data.meta.totalPages,
          current: data.data.meta.currentPage
        }
      };
    } else {
      throw new Error(data.message || 'Failed to fetch products');
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}
```

### Getting a Single Product

```javascript
// Fetch by ID
async function getProductById(productId) {
  const url = `http://localhost:3000/api/v1/products/${productId}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch product');
    }
  } catch (error) {
    console.error(`Error fetching product with ID ${productId}:`, error);
    throw error;
  }
}

// Fetch by slug (for SEO-friendly URLs)
async function getProductBySlug(productSlug) {
  const url = `http://localhost:3000/api/v1/products/slug/${productSlug}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch product');
    }
  } catch (error) {
    console.error(`Error fetching product with slug ${productSlug}:`, error);
    throw error;
  }
}
```

### Creating a Product (Admin)

```javascript
async function createProduct(productData, adminToken) {
  const url = 'http://localhost:3000/api/v1/admin/products';
  
  try {
    // Ensure the product data has the categoryId field
    if (!productData.categoryId) {
      throw new Error('Product must have a category');
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create product');
    }
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}
```

### Updating a Product (Admin)

```javascript
async function updateProduct(productId, productData, adminToken) {
  const url = `http://localhost:3000/api/v1/admin/products/${productId}`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update product');
    }
  } catch (error) {
    console.error(`Error updating product with ID ${productId}:`, error);
    throw error;
  }
}
```

### Deleting a Product (Admin)

```javascript
async function deleteProduct(productId, adminToken) {
  const url = `http://localhost:3000/api/v1/admin/products/${productId}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return true; // Successfully deleted
    } else {
      throw new Error(data.message || 'Failed to delete product');
    }
  } catch (error) {
    console.error(`Error deleting product with ID ${productId}:`, error);
    throw error;
  }
}
```

## Image Handling

### Uploading Product Images (Admin)

```javascript
async function uploadProductImages(productId, files, adminToken) {
  const url = 'http://localhost:3000/api/v1/admin/products/image-upload';
  
  const formData = new FormData();
  formData.append('productId', productId);
  
  // Add all image files
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }
  
  // Set main image if it's the first upload
  if (files.length > 0) {
    formData.append('isMain', 'true');
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
        // Don't set Content-Type here, FormData will set it automatically with boundary
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data; // Returns uploaded image details
    } else {
      throw new Error(data.message || 'Failed to upload images');
    }
  } catch (error) {
    console.error('Error uploading product images:', error);
    throw error;
  }
}
```

### Managing Product Images (Admin)

```javascript
// Set an image as the main product image
async function setMainImage(imageId, productId, adminToken) {
  const url = `http://localhost:3000/api/v1/admin/products/${productId}/images/${imageId}/main`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || 'Failed to set main image');
    }
  } catch (error) {
    console.error('Error setting main product image:', error);
    throw error;
  }
}

// Delete a product image
async function deleteProductImage(imageId, productId, adminToken) {
  const url = `http://localhost:3000/api/v1/admin/products/${productId}/images/${imageId}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || 'Failed to delete product image');
    }
  } catch (error) {
    console.error('Error deleting product image:', error);
    throw error;
  }
}
```

## Category Integration

Products are associated with categories. You'll need to fetch categories to populate dropdown menus when creating or editing products.

### Fetching Categories for Product Management

The admin endpoints provide a dedicated endpoint for retrieving categories. This endpoint should be used when displaying categories in product management forms:

```javascript
async function fetchCategories(adminToken) {
  const url = 'http://localhost:3000/api/v1/admin/categories?includeInactive=false';
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch categories');
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Example usage in a product creation form
async function populateCategoryDropdown() {
  try {
    const adminToken = await getAdminToken(); // Your function to get the admin token
    const categories = await fetchCategories(adminToken);
    
    const categorySelect = document.getElementById('product-category');
    categorySelect.innerHTML = '';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load categories:', error);
    showErrorMessage('Unable to load categories. Please try again.');
  }
}
```

## Error Handling

Always handle errors appropriately in your frontend integration:

```javascript
try {
  const products = await fetchProducts();
  // Update UI with products
} catch (error) {
  if (error.message.includes('401')) {
    // Authentication error - redirect to login
    redirectToLogin();
  } else if (error.message.includes('403')) {
    // Authorization error - show permission denied message
    showErrorMessage('You do not have permission to access this resource');
  } else if (error.message.includes('404')) {
    // Not found error
    showErrorMessage('The requested product could not be found');
  } else {
    // General error
    showErrorMessage('An error occurred while fetching products');
  }
  
  console.error('Error details:', error);
}
```

## Best Practices

1. **Price Formatting**: Always format price values for display:
   ```javascript
   const formattedPrice = parseFloat(product.price).toFixed(2);
   ```

2. **Image Fallbacks**: Implement fallback images when product images fail to load:
   ```javascript
   <img 
     src={product.images[0]?.url || '/path/to/fallback-image.jpg'} 
     onError={(e) => { e.target.src = '/path/to/fallback-image.jpg'; }}
     alt={product.name}
   />
   ```

3. **Lazy Loading**: Implement lazy loading for product images to improve performance:
   ```html
   <img src="..." loading="lazy" alt="Product" />
   ```

4. **Input Validation**: Validate all inputs before sending to the API:
   ```javascript
   function validateProduct(product) {
     const errors = {};
     
     if (!product.name || product.name.trim() === '') 
       errors.name = 'Product name is required';
     
     if (!product.price || isNaN(product.price) || parseFloat(product.price) <= 0)
       errors.price = 'Product price must be greater than zero';
     
     if (!product.categoryId)
       errors.categoryId = 'Category is required';
     
     return {
       isValid: Object.keys(errors).length === 0,
       errors
     };
   }
   ```

5. **Caching**: Implement caching for frequently accessed products:
   ```javascript
   // Simple cache implementation
   const productCache = new Map();
   
   async function getProductByIdWithCache(productId) {
     // Check cache first
     if (productCache.has(productId)) {
       return productCache.get(productId);
     }
     
     // Fetch from API if not in cache
     const product = await getProductById(productId);
     
     // Store in cache (with 5-minute expiry)
     productCache.set(productId, product);
     setTimeout(() => productCache.delete(productId), 5 * 60 * 1000);
     
     return product;
   }
   ```

6. **Optimistic Updates**: Implement optimistic UI updates for better user experience:
   ```javascript
   async function updateProductStock(productId, newStock, adminToken) {
     // Update UI immediately (optimistically)
     updateProductInUI(productId, { stock: newStock });
     
     try {
       // Attempt to update on the server
       await updateProduct(productId, { stock: newStock }, adminToken);
     } catch (error) {
       // If server update fails, revert the UI
       const originalProduct = await getProductById(productId);
       updateProductInUI(productId, { stock: originalProduct.stock });
       showErrorMessage('Failed to update product stock');
     }
   }
   ```

7. **Debounced Search**: Implement debounced search for product filtering:
   ```javascript
   function debounce(func, timeout = 300) {
     let timer;
     return (...args) => {
       clearTimeout(timer);
       timer = setTimeout(() => { func.apply(this, args); }, timeout);
     };
   }
   
   const debouncedSearch = debounce((searchTerm) => {
     fetchProducts(1, 10, 'createdAt', 'DESC', searchTerm)
       .then(data => updateProductList(data))
       .catch(error => handleError(error));
   }, 500);
   
   // Usage in a search input
   searchInput.addEventListener('input', (e) => {
     debouncedSearch(e.target.value);
   });
   ```
