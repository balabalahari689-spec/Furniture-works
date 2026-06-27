import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  Boxes,
  Users,
  DollarSign,
  ArrowRight,
  Hammer
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface DashboardData {
  summary: {
    pendingOrders: number;
    completedOrders: number;
    inProduction: number;
    qcPending: number;
    readyForDispatch: number;
    totalRevenue: number;
    estimatedPipelineRevenue: number;
    lowStockItemsCount: number;
    activeStaffCount: number;
  };
  charts: {
    monthlyProduction: Array<{ month: string; completed: number; target: number }>;
    statusBreakdown: Array<{ name: string; value: number }>;
    materialUsage: Array<{ name: string; stock: number; lowLimit: number }>;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    details: string;
    timestamp: string;
    user?: { name: string; role: string };
  }>;
}

export const Dashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5000/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const COLORS = ['#F59E0B', '#2563EB', '#8B5CF6', '#10B981', '#64748B'];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 glass-card shimmer rounded-[18px]" />
          ))}
        </div>
        {/* Main Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 glass-card shimmer rounded-[18px]" />
          <div className="h-96 glass-card shimmer rounded-[18px]" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    pendingOrders: 0,
    completedOrders: 0,
    inProduction: 0,
    qcPending: 0,
    readyForDispatch: 0,
    totalRevenue: 0,
    estimatedPipelineRevenue: 0,
    lowStockItemsCount: 0,
    activeStaffCount: 0
  };

  const activity = data?.recentActivity || [];

  return (
    <div className="p-6 space-y-6 text-left">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-[24px] shadow-lg shadow-blue-500/10">
        <div>
          <h3 className="text-xl font-bold">Welcome Back, {user?.name}!</h3>
          <p className="text-xs text-blue-100 mt-1">
            Sri Venkata Sai Furniture Works operations are running smoothly. Here is today's overview.
          </p>
        </div>
        <div className="flex gap-2">
          {['ADMIN', 'PRODUCTION_MANAGER', 'SALES'].includes(user?.role || '') && (
            <Link
              to="/orders/new"
              className="px-4 py-2 bg-white text-blue-600 font-semibold text-xs rounded-xl shadow-md shadow-slate-900/10 hover:bg-slate-50 transition-all"
            >
              Add New Order
            </Link>
          )}
          <Link
            to="/workflow"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs rounded-xl border border-blue-400/30 transition-all flex items-center gap-1.5"
          >
            Track Workflow <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Numerical Indicators grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Realized Revenue */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed Revenue</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              ₹{summary.totalRevenue.toLocaleString('en-IN')}
            </h3>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
              Pipeline: ₹{summary.estimatedPipelineRevenue.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 rounded-2xl">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Active Production */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">In Production</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {summary.inProduction} Orders
            </h3>
            <span className="text-[10px] text-amber-500 font-bold">
              QC Pending: {summary.qcPending}
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 rounded-2xl">
            <Hammer size={24} />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Low Stock alerts</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {summary.lowStockItemsCount} Items
            </h3>
            {summary.lowStockItemsCount > 0 ? (
              <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                <AlertTriangle size={10} /> Requires restocking
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-bold">Inventory Healthy</span>
            )}
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 dark:bg-red-500/20 rounded-2xl">
            <Boxes size={24} />
          </div>
        </div>

        {/* Ready for Dispatch */}
        <div className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ready for Dispatch</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {summary.readyForDispatch} Orders
            </h3>
            <span className="text-[10px] text-blue-500 font-bold">
              Total Staff active: {summary.activeStaffCount}
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 rounded-2xl">
            <Truck size={24} />
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly output Area Chart */}
        <div className="glass-card p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Monthly Production Output</h3>
            <p className="text-[10px] text-slate-400">Comparing actual deliveries against target quotas.</p>
          </div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.charts.monthlyProduction}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="completed" name="Completed Units" stroke="#2563EB" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                <Area type="monotone" dataKey="target" name="Target Quota" stroke="#94a3b8" fillOpacity={0} strokeWidth={1} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current status Pie Chart */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Production Status Pipeline</h3>
            <p className="text-[10px] text-slate-400">Distribution of active and completed orders.</p>
          </div>
          <div className="h-60 mt-4 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.charts.statusBreakdown.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.charts.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] mt-2">
            {data?.charts.statusBreakdown.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-500 font-medium">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Materials and Audit Log widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Raw Materials Bar Chart */}
        <div className="glass-card p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Raw Material Stock Register</h3>
            <p className="text-[10px] text-slate-400">Comparing current inventory levels against restock limits.</p>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.charts.materialUsage}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} interval={0} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="stock" name="Current Stock" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lowLimit" name="Alert Threshold" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Log list */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent System Activity</h3>
            <p className="text-[10px] text-slate-400">Audit logs tracking user modifications.</p>
          </div>
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto max-h-64 pr-1">
            {activity.length === 0 ? (
              <span className="text-xs text-slate-400 block text-center py-8">No activity logs recorded.</span>
            ) : (
              activity.map(item => (
                <div key={item.id} className="text-xs flex gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80 last:border-0 last:pb-0">
                  <div className="flex-1 overflow-hidden">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">{item.details}</span>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                      <span>User: {item.user?.name || 'System'} ({item.user?.role || 'Daemon'})</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
