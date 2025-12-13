import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';

const ORDER_STATUSES = [
  'order_created',
  'payment_confirmed',
  'dispatched',
  'reached_city',
  'out_for_delivery',
  'delivered',
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: '',
  });

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const response = await orderAPI.getById(id);
      setOrder(response.data);
      setStatusForm({ status: response.data.status, notes: '' });
    } catch (err) {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      await orderAPI.updateStatus(id, statusForm.status, statusForm.notes);
      setSuccess('Order status updated successfully');
      setStatusForm({ ...statusForm, notes: '' });
      loadOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/orders')} className="btn-secondary">
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-dark">Order Details</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Order Information</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{order.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-sm">{order.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Products</h2>
            <div className="space-y-3">
              {order.products.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  {item.productId?.imageUrl && (
                    <img
                      src={item.productId.imageUrl}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-gray-600">
                      Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="font-bold">{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
              <div className="text-gray-700">
                <div className="font-medium">{order.shippingAddress.name}</div>
                {order.shippingAddress.phone && (
                  <div>{order.shippingAddress.phone}</div>
                )}
                <div>{order.shippingAddress.line1}</div>
                {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                  {order.shippingAddress.postalCode}
                </div>
                <div>{order.shippingAddress.country}</div>
              </div>
            </div>
          )}
        </div>

        {/* Status Management */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Update Status</h2>
            <form onSubmit={handleStatusUpdate}>
              <div className="mb-4">
                <label className="form-label">Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="form-input"
                  required
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  className="form-input"
                  rows="3"
                  placeholder="Add notes about status update..."
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full btn-primary disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </form>
          </div>

          {/* Status History */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Status History</h2>
            <div className="space-y-3">
              {order.statusHistory.map((history, index) => (
                <div key={index} className="border-l-4 border-primary pl-3">
                  <div className="font-medium">
                    {history.status.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDateTime(history.timestamp)}
                  </div>
                  {history.notes && (
                    <div className="text-sm text-gray-700 mt-1">{history.notes}</div>
                  )}
                  {history.updatedBy && (
                    <div className="text-xs text-gray-500 mt-1">
                      By: {history.updatedBy.email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
