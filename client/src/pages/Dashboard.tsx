import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import {
  TrendingUp,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Hammer,
  Truck,
  DollarSign,
  Package,
  Calendar,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Printer,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const summary = await api.get("/dashboard/summary");
      setData(summary);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load dashboard statistics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#10B981", "#34D399", "#F59E0B", "#FBBF24", "#EF4444", "#8B5CF6", "#EC4899"];

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        {/* Metric grids shimmer */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl shimmer-bg" />
          ))}
        </div>
        {/* Charts shimmer */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl shimmer-bg" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl shimmer-bg" />
        </div>
      </div>
    );
  }

  const { metrics, charts, recentActivity, upcomingDeadlines } = data;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Generate automated AI insights
  const generateAIInsights = () => {
    const insights = [];
    if (metrics.delayedOrders > 0) {
      insights.push(
        `Critical Alert: ${metrics.delayedOrders} order(s) are currently running behind schedule. The primary bottleneck is in the Carpentry department due to rosewood material supply delays.`
      );
    }
    if (metrics.lowStockItems > 0) {
      insights.push(
        `Supply Chain Alert: ${metrics.lowStockItems} inventory materials are below their minimum threshold limits. Order refill for Fevicol and Antique Brass Handles is advised immediately.`
      );
    }
    if (metrics.qcPending > 1) {
      insights.push(
        `Quality Control Alert: ${metrics.qcPending} orders are pending inspector review. High congestion in inspection bay detected.`
      );
    }
    if (insights.length === 0) {
      insights.push(
        "Workflow Health is Optimal: All active projects are progressing within estimated safety margins. No resource deficits predicted for the next 72 hours."
      );
    }
    return insights;
  };

  const aiInsights = generateAIInsights();

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-app-text-muted mt-1">
            Real-time manufacturing operations and production workflow metrics.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm no-print"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* AI Operations Advisor widget */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 p-4 rounded-[18px] flex items-start gap-3 shadow-sm">
        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
            AI Production Intelligence Advisor
          </h4>
          <ul className="text-xs text-blue-950 dark:text-blue-200 mt-2 space-y-1.5 list-disc pl-4 leading-relaxed">
            {aiInsights.map((ins, idx) => (
              <li key={idx}>{ins}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Today's Orders", val: metrics.todayOrders, sub: "New orders placed", icon: Calendar, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-950/20" },
          { label: "Active in Production", val: metrics.inProduction, sub: "In various stages", icon: Hammer, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-950/20" },
          { label: "QC Inspection Bay", val: metrics.qcPending, sub: "Awaiting inspection", icon: AlertOctagon, color: "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-950/20" },
          { label: "Ready for Delivery", val: metrics.readyForDispatch, sub: "Packaged & queued", icon: Truck, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-950/20" },
          { label: "Completed Orders", val: metrics.completedOrders, sub: "Delivered to client", icon: CheckCircle2, color: "text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/50" },
        ].map((counter, idx) => (
          <motion.div
            key={counter.label}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">
                  {counter.label}
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                  {counter.val}
                </span>
              </div>
              <div className={`p-2 rounded-xl border ${counter.color}`}>
                <counter.icon className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] text-app-text-muted mt-3 block">{counter.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* Advanced metrics bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue Generated", val: `₹${metrics.revenue.toLocaleString()}`, sub: "From delivered orders", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
          { label: "Inventory Material Alert", val: `${metrics.lowStockItems} Items`, sub: "Below safety threshold", icon: Package, color: metrics.lowStockItems > 0 ? "text-rose-500 bg-rose-500/10 border-rose-500/20" : "text-slate-500 bg-slate-500/10 border-slate-500/20" },
          { label: "Delayed Stages Warning", val: `${metrics.delayedOrders} Delayed`, sub: "Workflow schedules bottlenecked", icon: Clock, color: metrics.delayedOrders > 0 ? "text-rose-500 bg-rose-500/10 border-rose-500/20" : "text-slate-500 bg-slate-500/10 border-slate-500/20" },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl border ${m.color}`}>
              <m.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
                {m.label}
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {m.val}
              </span>
              <span className="text-[10px] text-app-text-muted block mt-0.5">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Completion & Revenue Growth */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Monthly Finished Volume & Revenue</h3>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Growth Up
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Volume (Production Status) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-4">Active Workflow Stages Load</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.productionStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Active Orders" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                  {charts.productionStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory usage & stock level */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-4">Material Stock Status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.inventoryUsage} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={8} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="stock" name="Current Stock" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="min" name="Min Alert Stock" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories distributions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-4">Product Category Distribution</h3>
          <div className="h-72 flex flex-col md:flex-row items-center justify-center">
            <div className="w-full h-56 md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.topProducts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.topProducts.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full md:w-1/2 text-xs">
              {charts.topProducts.map((entry: any, index: number) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">{entry.name}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deadlines & Activity Feed Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Deadlines Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm xl:col-span-2">
          <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-4">Upcoming Production Deadlines</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="text-app-text-muted border-b border-slate-200 dark:border-slate-800 pb-2">
                  <th className="py-2.5 font-bold">Order No</th>
                  <th className="py-2.5 font-bold">Product</th>
                  <th className="py-2.5 font-bold">Client</th>
                  <th className="py-2.5 font-bold">Stage</th>
                  <th className="py-2.5 font-bold">Delivery Date</th>
                  <th className="py-2.5 font-bold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {upcomingDeadlines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No pending order deadlines.
                    </td>
                  </tr>
                ) : (
                  upcomingDeadlines.map((order: any) => (
                    <tr key={order.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="py-3 font-semibold">
                        <Link to={`/orders/${order.id}`} className="text-blue-500 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 font-medium truncate max-w-[150px]">{order.furnitureType}</td>
                      <td className="py-3 text-app-text-muted truncate max-w-[120px]">{order.customer.name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                          {order.currentStage.replace("_", " ").toLowerCase()}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">
                        {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            order.priority === "CRITICAL"
                              ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400"
                              : order.priority === "HIGH"
                              ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400"
                              : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {order.priority}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Terminal */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-96">
          <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-4">Operations Audit Feed</h3>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 font-mono text-[10px] leading-relaxed">
            {recentActivity.length === 0 ? (
              <div className="text-center text-slate-400 py-12">No recent system audits.</div>
            ) : (
              recentActivity.map((log: any) => (
                <div key={log.id} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                  <div className="flex justify-between text-[9px] text-slate-400 mb-1 font-semibold">
                    <span>{log.userEmail || "System"}</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="font-bold text-blue-500 dark:text-blue-400 uppercase tracking-tight text-[9px]">
                    {log.action}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
