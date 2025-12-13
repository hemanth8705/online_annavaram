import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'order_created', label: 'Order Created' },
  { value: 'payment_confirmed', label: 'Payment Confirmed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'reached_city', label: 'Reached City' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [filters]);

  const loadOrders = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await orderAPI.getAll(params);
      setOrders(response.data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await orderAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      startDate: '',
      endDate: '',
    });
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'order_created':
        return `${baseClass} bg-gray-200 text-gray-700`;
      case 'payment_confirmed':
        return `${baseClass} bg-blue-100 text-blue-700`;
      case 'dispatched':
        return `${baseClass} bg-purple-100 text-purple-700`;
      case 'reached_city':
        return `${baseClass} bg-indigo-100 text-indigo-700`;
      case 'out_for_delivery':
        return `${baseClass} bg-yellow-100 text-yellow-700`;
      case 'delivered':
        return `${baseClass} bg-green-100 text-green-700`;
      default:
        return `${baseClass} bg-gray-100 text-gray-600`;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark">Orders</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-2xl font-bold text-dark">{stats.totalOrders}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Avg Order Value</div>
            <div className="text-2xl font-bold text-secondary">
              {formatCurrency(stats.averageOrderValue)}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Pending Orders</div>
            <div className="text-2xl font-bold text-dark">
              {stats.ordersByStatus?.order_created || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="form-label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-input"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="form-label">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="form-input"
            />
          </div>

          <button onClick={handleClearFilters} className="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User ID</th>
                <th>Products</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-gray-500 py-8">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-medium">{order.orderId}</td>
                    <td className="font-mono text-xs">{order.userId.slice(0, 8)}...</td>
                    <td>
                      <div className="text-sm">
                        {order.products.length} item{order.products.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.products.map((p) => p.productName).join(', ').slice(0, 40)}
                        {order.products.map((p) => p.productName).join(', ').length > 40 &&
                          '...'}
                      </div>
                    </td>
                    <td className="font-bold text-primary">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(order.status)}>
                        {order.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/orders/${order._id}`)}
                        className="btn-primary text-sm py-1 px-3"
                      >
                        View Details
                      </button>
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
