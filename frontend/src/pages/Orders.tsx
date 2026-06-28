import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Download,
  Printer,
  Plus,
  ArrowRight,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hammer
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  furnitureType: string;
  category: string;
  woodType: string;
  dimensions: string;
  quantity: number;
  status: string;
  progressPercentage: number;
  estimatedCost: number;
  finalCost?: number;
  estimatedDeliveryDate: string;
  customer?: { name: string; phone: string };
  createdAt: string;
}

export const Orders: React.FC = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [woodTypeFilter, setWoodTypeFilter] = useState('');

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const response = await fetch('${API_BASE_URL}/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Apply filters client-side
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.furnitureType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    const matchesCategory = categoryFilter ? order.category === categoryFilter : true;
    const matchesWood = woodTypeFilter ? order.woodType === woodTypeFilter : true;

    return matchesSearch && matchesStatus && matchesCategory && matchesWood;
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'DESIGN_APPROVED':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'READY':
      case 'READY_FOR_DISPATCH':
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
      case 'QC_PENDING':
      case 'QUALITY_CHECK':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      default: // Carpentry, assembly, finishing, polishing, etc. (In Production)
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    }
  };

  const exportCSV = () => {
    const headers = ['Order Number', 'Customer', 'Furniture Type', 'Category', 'Wood Type', 'Dimensions', 'Qty', 'Status', 'Progress', 'Estimated Cost', 'Final Cost', 'Estimated Delivery'];
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.customer?.name || '',
      o.furnitureType,
      o.category,
      o.woodType,
      o.dimensions,
      o.quantity,
      o.status,
      `${o.progressPercentage}%`,
      o.estimatedCost,
      o.finalCost || '',
      new Date(o.estimatedDeliveryDate).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `svs_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Get unique categories and wood types for filter dropdowns
  const categories = Array.from(new Set(orders.map(o => o.category)));
  const woodTypes = Array.from(new Set(orders.map(o => o.woodType)));

  return (
    <div className="p-6 space-y-6 text-left">
      {/* Header operations */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Production Orders Registry</h1>
          <p className="text-xs text-slate-400">View details, track stage progressions, and manage logistics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Printer size={14} /> Print
          </button>
          {['ADMIN', 'PRODUCTION_MANAGER', 'SALES'].includes(user?.role || '') && (
            <Link
              to="/orders/new"
              className="btn-primary flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus size={14} /> Create Order
            </Link>
          )}
        </div>
      </div>

      {/* Filters grid bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-[18px]">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order no, items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs py-2 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="DESIGN_APPROVED">Design Approved</option>
            <option value="CARPENTRY">Carpentry</option>
            <option value="ASSEMBLY">Assembly</option>
            <option value="FINISHING">Finishing</option>
            <option value="POLISHING">Polishing</option>
            <option value="QUALITY_CHECK">Quality Check</option>
            <option value="QC_PENDING">QC Pending</option>
            <option value="READY">Ready for Dispatch</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Wood Type Filter */}
        <div className="relative">
          <select
            value={woodTypeFilter}
            onChange={e => setWoodTypeFilter(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 appearance-none cursor-pointer"
          >
            <option value="">All Wood Types</option>
            {woodTypes.map(wood => (
              <option key={wood} value={wood}>{wood}</option>
            ))}
          </select>
          <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full enterprise-table text-left border-collapse">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer Name</th>
                <th>Furniture Details</th>
                <th>Estimated Delivery</th>
                <th>Workflow Status</th>
                <th>Completion Progress</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="shimmer h-16"><td colSpan={7}></td></tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-semibold">
                    No matching production orders registered.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id}>
                    {/* Order ID */}
                    <td className="font-extrabold text-blue-600 dark:text-blue-400">
                      {order.orderNumber}
                    </td>
                    {/* Customer */}
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{order.customer?.name}</span>
                        <span className="text-[10px] text-slate-400">{order.customer?.phone}</span>
                      </div>
                    </td>
                    {/* Specs */}
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{order.furnitureType}</span>
                        <span className="text-[10px] text-slate-400">
                          {order.category} • {order.woodType} • {order.dimensions} • Qty: {order.quantity}
                        </span>
                      </div>
                    </td>
                    {/* Target Date */}
                    <td className="font-medium text-slate-700 dark:text-slate-350">
                      {new Date(order.estimatedDeliveryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    {/* Status Badge */}
                    <td>
                      <span className={`badge-status text-[9px] font-extrabold ${getStatusBadgeStyles(order.status)}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    {/* Progress Bar */}
                    <td className="w-44">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                          <span>{order.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${order.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline bg-blue-50/50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20"
                      >
                        <Eye size={12} /> View Stages
                      </Link>
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
};
