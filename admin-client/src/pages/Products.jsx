import { useEffect, useState } from 'react';
import { productAPI, categoryAPI } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    totalStock: '',
    isUnlimitedPurchase: false,
    maxUnitsPerUser: '',
    imageUrl: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productAPI.getAll(),
        categoryAPI.getActive(),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        totalStock: parseInt(formData.totalStock),
        maxUnitsPerUser: formData.isUnlimitedPurchase
          ? parseInt(formData.totalStock)
          : parseInt(formData.maxUnitsPerUser),
      };

      if (editingProduct) {
        await productAPI.update(editingProduct._id, data);
        setSuccess('Product updated successfully');
      } else {
        await productAPI.create(data);
        setSuccess('Product created successfully');
      }

      resetForm();
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      categoryId: product.categoryId._id,
      price: product.price,
      totalStock: product.totalStock,
      isUnlimitedPurchase: product.isUnlimitedPurchase,
      maxUnitsPerUser: product.maxUnitsPerUser,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleToggleStatus = async (id) => {
    try {
      await productAPI.toggleStatus(id);
      setSuccess('Product status updated');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productAPI.delete(id);
      setSuccess('Product deleted successfully');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      categoryId: '',
      price: '',
      totalStock: '',
      isUnlimitedPurchase: false,
      maxUnitsPerUser: '',
      imageUrl: '',
      isActive: true,
    });
    setError('');
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? product.categoryId._id === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark">Products</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Product'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingProduct ? 'Edit Product' : 'Create New Product'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Price (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Total Stock *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalStock}
                  onChange={(e) => setFormData({ ...formData, totalStock: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Image URL *</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isUnlimitedPurchase}
                    onChange={(e) =>
                      setFormData({ ...formData, isUnlimitedPurchase: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Unlimited Purchase</span>
                </label>
              </div>

              {!formData.isUnlimitedPurchase && (
                <div>
                  <label className="form-label">Max Units Per User *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUnitsPerUser}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUnitsPerUser: e.target.value })
                    }
                    className="form-input"
                    required={!formData.isUnlimitedPurchase}
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="submit" className="btn-primary">
                {editingProduct ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Search Products</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  placeholder="Search by name..."
                />
              </div>
              <div>
                <label className="form-label">Filter by Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="form-input"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td>{product.categoryId?.name}</td>
                        <td>{formatCurrency(product.price)}</td>
                        <td>
                          <span
                            className={`font-medium ${
                              product.totalStock === 0 ? 'text-red-600' : 'text-gray-900'
                            }`}
                          >
                            {product.totalStock}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              product.isActive ? 'badge-success' : 'badge-danger'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(product._id)}
                              className={`px-3 py-1 text-sm rounded text-white ${
                                product.isActive
                                  ? 'bg-yellow-500 hover:bg-yellow-600'
                                  : 'bg-green-500 hover:bg-green-600'
                              }`}
                            >
                              {product.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
