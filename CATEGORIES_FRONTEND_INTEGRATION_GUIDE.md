# Categories Frontend Integration Guide
*Complete implementation guide for category management in the admin frontend*

## 🎯 Overview
This guide provides everything you need to implement category management in your frontend admin panel, including API endpoints, React components, state management, and styling.

## 🔗 API Endpoints

### **Base Configuration**
```javascript
const API_BASE = 'http://localhost:3000/api/v1';

// Admin authentication required for all endpoints
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});
```

### **1. Get All Categories**
```javascript
// ✅ Correct endpoint and parameters
GET /api/v1/admin/categories?includeInactive=true&search=&sortBy=name&sortOrder=ASC

// API Call
const fetchCategories = async (token, options = {}) => {
  const {
    includeInactive = true,
    search = '',
    sortBy = 'name',
    sortOrder = 'ASC'
  } = options;

  const params = new URLSearchParams({
    includeInactive: includeInactive.toString(),
    search,
    sortBy,
    sortOrder
  });

  const response = await fetch(`${API_BASE}/admin/categories?${params}`, {
    headers: getAuthHeaders(token)
  });

  return response.json();
};
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": "234bc082-2fec-4b6f-98d2-cc20fbf4e834",
      "name": "Electronics",
      "description": "Electronic products and gadgets",
      "slug": "electronics",
      "parent_id": null,
      "image_url": "https://example.com/image.jpg",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2025-08-22T10:00:00Z",
      "updated_at": "2025-08-22T10:00:00Z"
    }
  ],
  "message": "Categories retrieved successfully",
  "timestamp": "2025-08-22T18:39:53.754Z"
}
```

### **2. Create Category**
```javascript
POST /api/v1/admin/categories

const createCategory = async (token, categoryData) => {
  const response = await fetch(`${API_BASE}/admin/categories`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(categoryData)
  });

  return response.json();
};

// Request payload
const categoryData = {
  name: "Kitchen Appliances",
  description: "Modern kitchen appliances and gadgets",
  parentId: null, // Optional: for subcategories
  imageUrl: "https://example.com/kitchen.jpg", // Optional
  sortOrder: 1, // Optional
  isActive: true // Optional, defaults to true
};
```

### **3. Create Category with Image Upload**
```javascript
POST /api/v1/categories/with-image

const createCategoryWithImage = async (token, categoryData, imageFile) => {
  const formData = new FormData();
  formData.append('name', categoryData.name);
  formData.append('description', categoryData.description || '');
  formData.append('parentId', categoryData.parentId || '');
  formData.append('sortOrder', categoryData.sortOrder || '0');
  formData.append('image', imageFile);

  const response = await fetch(`${API_BASE}/categories/with-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData
    },
    body: formData
  });

  return response.json();
};
```

### **4. Update Category**
```javascript
PUT /api/v1/admin/categories/{id}

const updateCategory = async (token, categoryId, updateData) => {
  const response = await fetch(`${API_BASE}/admin/categories/${categoryId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updateData)
  });

  return response.json();
};
```

### **5. Delete Category**
```javascript
DELETE /api/v1/admin/categories/{id}

const deleteCategory = async (token, categoryId) => {
  const response = await fetch(`${API_BASE}/admin/categories/${categoryId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });

  return response.json();
};
```

---

## ⚛️ React Components

### **1. Category Management Component**
```jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Get admin token from your auth context/state
  const adminToken = localStorage.getItem('adminToken'); // Adjust based on your auth implementation

  useEffect(() => {
    fetchCategories();
  }, [searchTerm, sortBy, sortOrder, includeInactive]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        includeInactive: includeInactive.toString(),
        search: searchTerm,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/v1/admin/categories?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Error fetching categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      const response = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        fetchCategories(); // Refresh the list
        // Show success notification
        alert('Category created successfully!');
      } else {
        // Handle error (e.g., duplicate category)
        alert(data.message || 'Failed to create category');
      }
    } catch (err) {
      alert('Error creating category: ' + err.message);
    }
  };

  const handleUpdateCategory = async (categoryId, updateData) => {
    try {
      const response = await fetch(`/api/v1/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.success) {
        fetchCategories(); // Refresh the list
        alert('Category updated successfully!');
      } else {
        alert(data.message || 'Failed to update category');
      }
    } catch (err) {
      alert('Error updating category: ' + err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await fetch(`/api/v1/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        fetchCategories(); // Refresh the list
        alert('Category deleted successfully!');
      } else {
        alert(data.message || 'Failed to delete category');
      }
    } catch (err) {
      alert('Error deleting category: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
              <p className="text-gray-600 mt-1">Manage your product categories and organization</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="created_at">Sort by Date</option>
              <option value="sort_order">Sort by Order</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ASC">Ascending</option>
              <option value="DESC">Descending</option>
            </select>

            {/* Include Inactive */}
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Include inactive</span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading categories...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">Error: {error}</p>
              <button
                onClick={fetchCategories}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No categories found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create your first category
              </button>
            </div>
          ) : (
            <CategoryTable
              categories={categories}
              onEdit={setSelectedCategory}
              onDelete={handleDeleteCategory}
              onToggleStatus={(category) => handleUpdateCategory(category.id, { isActive: !category.is_active })}
            />
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CategoryCreateModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCategory}
        />
      )}

      {/* Edit Modal */}
      {selectedCategory && (
        <CategoryEditModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onSubmit={(updateData) => {
            handleUpdateCategory(selectedCategory.id, updateData);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default CategoryManagement;
```

### **2. Category Table Component**
```jsx
const CategoryTable = ({ categories, onEdit, onDelete, onToggleStatus }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sort Order
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {categories.map((category) => (
            <tr key={category.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {category.image_url && (
                    <img
                      className="h-10 w-10 rounded-lg object-cover mr-3"
                      src={category.image_url}
                      alt={category.name}
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{category.description || 'No description'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onToggleStatus(category)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {category.is_active ? (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {category.sort_order}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(category.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onEdit(category)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(category.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### **3. Category Create Modal**
```jsx
import { useState } from 'react';
import { X, Upload, Image } from 'lucide-react';

const CategoryCreateModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 0,
    isActive: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [useImageUpload, setUseImageUpload] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (useImageUpload && imageFile) {
        // Use the image upload endpoint
        const adminToken = localStorage.getItem('adminToken');
        const formDataWithImage = new FormData();
        formDataWithImage.append('name', formData.name);
        formDataWithImage.append('description', formData.description);
        formDataWithImage.append('sortOrder', formData.sortOrder.toString());
        formDataWithImage.append('image', imageFile);

        const response = await fetch('/api/v1/categories/with-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          },
          body: formDataWithImage
        });

        const data = await response.json();
        if (data.success) {
          onSubmit(data.data);
        } else {
          alert(data.message || 'Failed to create category');
        }
      } else {
        // Use regular create endpoint
        onSubmit(formData);
      }
    } catch (error) {
      alert('Error creating category: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Create New Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              name="sortOrder"
              value={formData.sortOrder}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Image Upload Option */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useImageUpload}
                onChange={(e) => setUseImageUpload(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Upload category image</span>
            </label>
          </div>

          {useImageUpload && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <>
                      <Image className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload a file</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

### **4. Category Edit Modal**
```jsx
const CategoryEditModal = ({ category, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || '',
    sortOrder: category.sort_order,
    isActive: category.is_active
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      onSubmit(formData);
    } catch (error) {
      alert('Error updating category: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Edit Category</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              name="sortOrder"
              value={formData.sortOrder}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 🔧 State Management

### **Using React Context**
```jsx
// contexts/CategoryContext.js
import React, { createContext, useContext, useReducer } from 'react';

const CategoryContext = createContext();

const categoryReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, categories: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? action.payload : cat
        )
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload)
      };
    default:
      return state;
  }
};

export const CategoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(categoryReducer, {
    categories: [],
    loading: false,
    error: null
  });

  return (
    <CategoryContext.Provider value={{ state, dispatch }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryContext must be used within CategoryProvider');
  }
  return context;
};
```

### **Custom Hook**
```jsx
// hooks/useCategories.js
import { useState, useEffect } from 'react';
import { useCategoryContext } from '../contexts/CategoryContext';

export const useCategories = (options = {}) => {
  const { state, dispatch } = useCategoryContext();
  const [filters, setFilters] = useState({
    includeInactive: true,
    search: '',
    sortBy: 'name',
    sortOrder: 'ASC',
    ...options
  });

  const adminToken = localStorage.getItem('adminToken');

  const fetchCategories = async () => {
    dispatch({ type: 'FETCH_START' });

    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/v1/admin/categories?${params}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        dispatch({ type: 'FETCH_SUCCESS', payload: data.data });
      } else {
        dispatch({ type: 'FETCH_ERROR', payload: data.message });
      }
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', payload: error.message });
    }
  };

  const createCategory = async (categoryData) => {
    const response = await fetch('/api/v1/admin/categories', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    });

    const data = await response.json();

    if (data.success) {
      dispatch({ type: 'ADD_CATEGORY', payload: data.data });
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to create category');
    }
  };

  const updateCategory = async (categoryId, updateData) => {
    const response = await fetch(`/api/v1/admin/categories/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();

    if (data.success) {
      dispatch({ type: 'UPDATE_CATEGORY', payload: data.data });
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update category');
    }
  };

  const deleteCategory = async (categoryId) => {
    const response = await fetch(`/api/v1/admin/categories/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      dispatch({ type: 'DELETE_CATEGORY', payload: categoryId });
      return true;
    } else {
      throw new Error(data.message || 'Failed to delete category');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filters]);

  return {
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    filters,
    setFilters,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  };
};
```

---

## 🎨 Styling with Tailwind CSS

### **Color Scheme**
```css
/* Custom color variables */
:root {
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  --success-50: #f0fdf4;
  --success-500: #22c55e;
  --success-600: #16a34a;
  
  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;
  
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;
}
```

### **Responsive Design Classes**
```jsx
// Mobile-first responsive classes
const responsiveClasses = {
  container: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  grid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6",
  button: "px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base",
  input: "w-full px-3 py-2 text-sm sm:text-base",
  modal: "w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
};
```

---

## ⚠️ Error Handling

### **Common Error Scenarios**
```jsx
const handleApiError = (error, response) => {
  if (response?.status === 401) {
    // Redirect to login
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
    return;
  }

  if (response?.status === 400) {
    // Handle validation errors
    const data = response.json();
    if (data.message.includes('already exists')) {
      return 'A category with this name already exists. Please choose a different name.';
    }
    return data.message || 'Invalid request. Please check your input.';
  }

  if (response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (response?.status === 404) {
    return 'Category not found. It may have been deleted.';
  }

  if (response?.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return error.message || 'An unexpected error occurred.';
};
```

### **Loading States**
```jsx
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`} />
  );
};

const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-3">
    <LoadingSpinner size="lg" />
    <p className="text-gray-600 text-sm">{message}</p>
  </div>
);
```

---

## 📱 Integration Steps

### **1. Install Dependencies**
```bash
npm install lucide-react
# or
yarn add lucide-react
```

### **2. Setup in Your App**
```jsx
// App.js or main layout
import { CategoryProvider } from './contexts/CategoryContext';
import CategoryManagement from './components/CategoryManagement';

function App() {
  return (
    <CategoryProvider>
      <div className="min-h-screen bg-gray-50">
        <CategoryManagement />
      </div>
    </CategoryProvider>
  );
}
```

### **3. Configure API Base URL**
```javascript
// config/api.js
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export default API_CONFIG;
```

---

## ✅ Testing Checklist

- [ ] Categories load correctly with proper sorting
- [ ] Search functionality works
- [ ] Create category with validation
- [ ] Update category information
- [ ] Toggle category status (active/inactive)
- [ ] Delete category with confirmation
- [ ] Image upload for categories
- [ ] Handle duplicate category names gracefully
- [ ] Responsive design on mobile/tablet
- [ ] Loading states and error handling
- [ ] Pagination if needed for large datasets

---

## 🚀 Production Considerations

### **Performance Optimization**
- Implement virtual scrolling for large category lists
- Use React.memo for component optimization
- Debounce search input to reduce API calls
- Cache category data using React Query or SWR

### **Security**
- Validate all inputs on frontend and backend
- Sanitize user uploads
- Implement proper file type validation
- Use HTTPS in production
- Implement rate limiting

### **Accessibility**
- Add proper ARIA labels
- Ensure keyboard navigation
- Implement screen reader support
- Use semantic HTML elements

This guide provides everything you need to implement a complete category management system in your frontend admin panel! 🎉
