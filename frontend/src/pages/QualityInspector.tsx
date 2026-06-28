import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  UserCheck,
  Save,
  Loader2,
  Clock
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  furnitureType: string;
  category: string;
  woodType: string;
  progressPercentage: number;
  status: string;
  customer?: { name: string };
  stages: Array<{ id: string; stageName: string; status: string }>;
}

export const QualityInspector: React.FC = () => {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // QA Inspection modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [passed, setPassed] = useState(true);
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQAOrders = async () => {
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
    fetchQAOrders();
  }, [token]);

  // Orders that are currently in QC_PENDING or have active stage = Quality Check
  const pendingQAOrders = orders.filter(
    o => o.status === 'QC_PENDING' || o.status === 'QUALITY_CHECK'
  );

  // Orders that have passed QA (status is READY or PACKAGING or DELIVERED)
  const completedQAOrders = orders.filter(
    o => ['PACKAGING', 'READY', 'READY_FOR_DISPATCH', 'DELIVERED'].includes(o.status)
  );

  const handleOpenQA = (order: Order) => {
    setSelectedOrder(order);
    setPassed(true);
    setReason('');
    setRemarks('');
    setShowInspectorModal(true);
  };

  const handleQAInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !token) return;

    setIsSubmitting(true);
    try {
      // Find the QC stage in the order's stages
      const qcStage = selectedOrder.stages.find(s => s.stageName === 'Quality Check');
      if (!qcStage) {
        alert('Quality Check stage configuration not found for this order.');
        return;
      }

      // 1. Submit stage update to /api/workflow/stage/:id
      // If passed, stage status = COMPLETED, completionPercentage = 100
      // If failed, stage status = DELAYED, delayIndicator = true
      const response = await fetch(`${API_BASE_URL}/api/workflow/stage/${qcStage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: passed ? 'COMPLETED' : 'DELAYED',
          completionPercentage: passed ? 100 : 40, // Reset to 40% if failed
          delayIndicator: !passed,
          comments: passed
            ? `Inspection PASSED. Remarks: ${remarks || 'Meets SVS works quality guidelines.'}`
            : `Inspection FAILED. Reason: ${reason}. Remarks: ${remarks}`
        })
      });

      if (response.ok) {
        // Create custom notification for inspection
        await fetch('${API_BASE_URL}/api/notifications', {
          method: 'POST', // Simulation route inside notifications
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: passed ? 'QC Inspection Passed' : 'QC Inspection Failed',
            message: passed
              ? `Order ${selectedOrder.orderNumber} successfully passed quality verification.`
              : `Order ${selectedOrder.orderNumber} failed quality checks due to: ${reason}.`,
            type: passed ? 'ORDER_COMPLETED' : 'QC_FAILED',
            orderId: selectedOrder.id
          })
        });

        setShowInspectorModal(false);
        fetchQAOrders();
        alert(`Quality Check reported successfully as ${passed ? 'PASSED' : 'FAILED'}!`);
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to report quality check');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating quality inspection log.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 text-left">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Quality Assurance Inspection</h1>
        <p className="text-xs text-slate-400">Perform dimensional, wood finish, and structure stability quality checks.</p>
      </div>

      {/* Numerical summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 flex items-center justify-between border-l-4 border-l-amber-500">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">QC Check Queue</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{pendingQAOrders.length} Orders Awaiting</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Ready for visual & structural testing</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
            <Clock size={20} />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Checked & Passed</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{completedQAOrders.length} Orders</h3>
            <span className="text-[10px] text-emerald-500 font-bold">Passed quality thresholds</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Pending QA queue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">Awaiting Inspection</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-24 bg-slate-50 dark:bg-slate-850 rounded-2xl shimmer" />
            ) : pendingQAOrders.length === 0 ? (
              <span className="text-xs text-slate-400 block text-center py-12">No orders currently awaiting Quality Checks.</span>
            ) : (
              pendingQAOrders.map(order => (
                <div key={order.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <span className="font-extrabold text-[10px] text-blue-600 dark:text-blue-400">{order.orderNumber}</span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-normal">{order.furnitureType}</h4>
                    <span className="text-[9px] text-slate-400 block">Category: {order.category} • Wood: {order.woodType}</span>
                  </div>
                  {['ADMIN', 'PRODUCTION_MANAGER', 'INSPECTOR'].includes(user?.role || '') ? (
                    <button
                      onClick={() => handleOpenQA(order)}
                      className="px-3.5 py-2 bg-blue-600 text-white font-bold text-[10px] rounded-xl hover:bg-blue-500 transition-all flex items-center gap-1 shadow-sm"
                    >
                      <UserCheck size={12} /> Inspect Item
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">Inspect Pending</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quality Audit logs / Checked history */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">Quality Archives</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-24 bg-slate-50 dark:bg-slate-850 rounded-2xl shimmer" />
            ) : completedQAOrders.length === 0 ? (
              <span className="text-xs text-slate-400 block text-center py-12">No records found.</span>
            ) : (
              completedQAOrders.map(order => (
                <div key={order.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="space-y-1">
                    <span className="font-extrabold text-[10px] text-slate-400">{order.orderNumber}</span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-normal">{order.furnitureType}</h4>
                    <span className="text-[9px] text-slate-400 block">Status: {order.status} • Wood: {order.woodType}</span>
                  </div>
                  <Link
                    to={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline bg-slate-50 dark:bg-slate-850 p-2 rounded-lg"
                  >
                    <Eye size={12} /> Log Details
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* QC Reporting Modal Dialog */}
      {showInspectorModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4 shadow-xl">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Submit Quality Audit Report</h3>
              <p className="text-[10px] text-slate-400 mt-1">Order: **{selectedOrder.orderNumber}** ({selectedOrder.furnitureType})</p>
            </div>

            <form onSubmit={handleQAInspectionSubmit} className="space-y-4">
              {/* Pass / Fail selectors */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPassed(true)}
                  className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                    passed ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-105'
                  }`}
                >
                  <CheckCircle size={14} /> Passed
                </button>
                <button
                  type="button"
                  onClick={() => setPassed(false)}
                  className={`py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                    !passed ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-105'
                  }`}
                >
                  <XCircle size={14} /> Failed Check
                </button>
              </div>

              {/* Inspection points checklist */}
              <div className="bg-slate-50 dark:bg-slate-850/60 p-3 rounded-xl space-y-2 text-[10px] text-slate-500 font-semibold">
                <span className="font-bold text-slate-400 block mb-1">Standard Checklist:</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" required defaultChecked className="w-3.5 h-3.5 text-blue-600 bg-slate-150 rounded" />
                  <span>Wood Polish & Paint Coat consistency verified</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" required defaultChecked className="w-3.5 h-3.5 text-blue-600 bg-slate-150 rounded" />
                  <span>Structural joints & stability tested</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" required defaultChecked className="w-3.5 h-3.5 text-blue-600 bg-slate-150 rounded" />
                  <span>Dimensions match buyer specifications</span>
                </label>
              </div>

              {/* Fail Reason */}
              {!passed && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Reason for Failure *</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Scratches on front polish, drawer sliders stuck"
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                  />
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Inspector Remarks</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Record structural details, finish assessment, or recommendations for re-work..."
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectorModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Save size={12} /> Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
