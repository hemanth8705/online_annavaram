import { useEffect, useState } from 'react';
import { orderAPI, productAPI } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [orderStats, productsData] = await Promise.all([
        orderAPI.getStats(),
        productAPI.getAll({ limit: 1 }),
      ]);

      setStats({
        totalProducts: productsData.pagination?.total || 0,
        totalOrders: orderStats.data?.totalOrders || 0,
        totalRevenue: orderStats.data?.totalRevenue || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}`}>{value}</p>
        </div>
        <div className={`text-5xl opacity-20`}>{icon}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-dark mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon="📦"
          color="primary"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon="🛒"
          color="secondary"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon="💰"
          color="green-600"
        />
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-dark mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/categories"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📁</div>
            <div className="font-medium">Categories</div>
          </a>
          <a
            href="/products"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
          >
            <div className="text-3xl mb-2">📦</div>
            <div className="font-medium">Products</div>
          </a>
          <a
            href="/orders"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
          >
            <div className="text-3xl mb-2">🛒</div>
            <div className="font-medium">Orders</div>
          </a>
          <a
            href="/reviews"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
          >
            <div className="text-3xl mb-2">⭐</div>
            <div className="font-medium">Reviews</div>
          </a>
        </div>
      </div>
    </div>
  );
}
