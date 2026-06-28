import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Boxes,
  Award,
  DollarSign,
  Loader2,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface ReportData {
  reportName: string;
  period: string;
  metrics: any;
}

export const Reports: React.FC = () => {
  const { token } = useAuth();
  const [reportType, setReportType] = useState('production');
  const [reportRange, setReportRange] = useState('monthly');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports?type=${reportType}&range=${reportRange}`, {
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
    fetchReport();
  }, [token, reportType, reportRange]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 text-left">
      {/* Header and Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Operations Reports</h1>
          <p className="text-xs text-slate-400">Generate, review, and print operational logs across SVS workflows.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Control selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-[18px]">
        {/* Report Type */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Report Category</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 cursor-pointer"
          >
            <option value="production">Production & Workflow Milestones</option>
            <option value="revenue">Financial Revenue & Pipelines</option>
            <option value="inventory">Raw Material Valuation & Alerts</option>
            <option value="performance">Worker Attendance & Performance</option>
          </select>
        </div>

        {/* Time range */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Reporting Time Range</label>
          <select
            value={reportRange}
            disabled={reportType === 'inventory' || reportType === 'performance'}
            onChange={e => setReportRange(e.target.value)}
            className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 cursor-pointer disabled:opacity-50"
          >
            <option value="daily">Daily Log (Last 24 Hours)</option>
            <option value="weekly">Weekly Summary (Last 7 Days)</option>
            <option value="monthly">Monthly Audit (Last 30 Days)</option>
            <option value="yearly">Annual Statement (Last 365 Days)</option>
          </select>
        </div>
      </div>

      {/* Main Report Display Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-6 shadow-sm min-h-[300px] flex flex-col justify-between" id="printable-report">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
            <span className="text-xs font-semibold">Compiling metrics database...</span>
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            No report data generated.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="font-extrabold text-base text-slate-800 dark:text-slate-200">{data.reportName}</h2>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  SVS Works Operations • Range: {data.period}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                Ref: {new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            {/* Production Report View */}
            {reportType === 'production' && (() => {
              const pieColors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
              const formatStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
              const pieData = data?.metrics?.statusDistribution?.map((item: any) => ({
                name: formatStatus(item.status),
                value: item._count
              })) || [];

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">New Orders Registered</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">{data.metrics.totalCreated}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Deliveries</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">{data.metrics.totalDelivered}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Jobs in Pipeline</span>
                      <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">{data.metrics.activeProduction}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Stage Distribution Pie Chart */}
                    <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-[18px] flex flex-col min-h-[300px]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">Stage Distribution</span>
                      {pieData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                          No active workflow stages found.
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4">
                          <div className="w-40 h-40">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {pieData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} Orders`, 'Volume']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-2">
                            {pieData.map((item: any, idx: number) => (
                              <div key={item.name} className="flex items-center gap-2 text-[10px]">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pieColors[idx % pieColors.length] }}></span>
                                <span className="font-semibold text-slate-600 dark:text-slate-350">{item.name}:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Completion Times Trend Line */}
                    <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-[18px] flex flex-col min-h-[300px]">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">Order Completion Times (Days)</span>
                      {!data.metrics.completionTrends || data.metrics.completionTrends.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                          No completed orders in this time range.
                        </div>
                      ) : (
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height="90%">
                            <LineChart data={data.metrics.completionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="orderNumber" stroke="#94a3b8" fontSize={9} />
                              <YAxis stroke="#94a3b8" fontSize={9} />
                              <Tooltip formatter={(value) => [`${value} Days`, 'Duration']} labelFormatter={(label) => `Order: ${label}`} />
                              <Legend wrapperStyle={{ fontSize: 9 }} />
                              <Line type="monotone" dataKey="durationDays" name="Days to Complete" stroke="#10B981" strokeWidth={2} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Revenue Report View */}
            {reportType === 'revenue' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Contracted Pipeline</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1 block">₹{data.metrics.totalEstimatedRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl"><TrendingUp size={16} /></div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Realized Revenue</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1 block">₹{data.metrics.totalRealizedRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><DollarSign size={16} /></div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Collections</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1 block">₹{data.metrics.pendingRevenue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl"><Clock size={16} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Report View */}
            {reportType === 'inventory' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Stock Valuation</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1 block">₹{data.metrics.totalValuation.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Unique SKUs Cataloged</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1 block">{data.metrics.totalUniqueItems}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Low Stock Alerts</span>
                    <span className={`text-xl font-black mt-1 block ${data.metrics.lowStockAlertsCount > 0 ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                      {data.metrics.lowStockAlertsCount}
                    </span>
                  </div>
                </div>

                {data.metrics.lowStockItems.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Restocking Checklist</span>
                    <div className="grid grid-cols-2 gap-3">
                      {data.metrics.lowStockItems.map((i: any) => (
                        <div key={i.name} className="flex justify-between p-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{i.name}</span>
                          <span className="font-bold text-red-500">Only {i.stock} {i.unit} left</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Performance Report View */}
            {reportType === 'performance' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Team Productivity</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1 block">{data.metrics.averagePerformanceScore.toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Roster Size</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-200 mt-1 block">{data.metrics.totalActiveStaff} employees</span>
                  </div>
                </div>

                <div className="h-60 border border-slate-200 dark:border-slate-800 p-4 rounded-[18px]">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">Productivity Comparison Chart</span>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={data.metrics.roster}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                      <YAxis stroke="#94a3b8" fontSize={9} />
                      <Tooltip />
                      <Bar dataKey="performanceScore" name="Score (%)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
