import { useEffect, useState } from 'react';
import { categoryAPI } from '../lib/api';
import { formatDate } from '../lib/utils';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, formData);
        setSuccess('Category updated successfully');
      } else {
        await categoryAPI.create(formData);
        setSuccess('Category created successfully');
      }
      
      setFormData({ name: '' });
      setEditingCategory(null);
      setShowForm(false);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleToggleStatus = async (id) => {
    try {
      await categoryAPI.toggleStatus(id);
      setSuccess('Category status updated');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryAPI.delete(id);
      setSuccess('Category deleted successfully');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '' });
    setError('');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark">Categories</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Category'}
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
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">Category Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                className="form-input"
                placeholder="Enter category name"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingCategory ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={cancelForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No categories found. Create one to get started.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id}>
                    <td className="font-medium">{category.name}</td>
                    <td>
                      <span
                        className={`badge ${
                          category.isActive ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="text-gray-600">{formatDate(category.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(category._id)}
                          className={`px-3 py-1 text-sm rounded text-white ${
                            category.isActive
                              ? 'bg-yellow-500 hover:bg-yellow-600'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {category.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
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
    </div>
  );
}
