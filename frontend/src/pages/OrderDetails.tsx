import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Hammer,
  QrCode,
  CheckCircle,
  Clock,
  AlertTriangle,
  ClipboardList,
  Edit,
  Loader2,
  FileText,
  Printer
} from 'lucide-react';

interface Stage {
  id: string;
  stageName: string;
  status: string;
  completionPercentage: number;
  expectedCompletionDate: string;
  actualCompletionDate?: string;
  delayIndicator: boolean;
  comments?: string;
  photos?: string;
  assignedEmployee?: { name: string; role: string };
}

interface OrderDetailsItem {
  id: string;
  orderNumber: string;
  furnitureType: string;
  category: string;
  woodType: string;
  dimensions: string;
  quantity: number;
  designer?: string;
  assignedCarpenter?: string;
  status: string;
  progressPercentage: number;
  estimatedCost: number;
  finalCost?: number;
  estimatedDeliveryDate: string;
  deliveryDate?: string;
  notes?: string;
  qrCode?: string;
  createdAt: string;
  customer?: { name: string; phone: string; address: string; email?: string };
  stages: Stage[];
}

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetailsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);

  // Form states for stage update
  const [stageStatus, setStageStatus] = useState('IN_PROGRESS');
  const [completion, setCompletion] = useState(10);
  const [comments, setComments] = useState('');
  const [delayIndicator, setDelayIndicator] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state for custom invoice trigger
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const fetchOrderDetails = async () => {
    if (!token || !id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [token, id]);

  const handleOpenStageUpdate = (stage: Stage) => {
    setActiveStage(stage);
    setStageStatus(stage.status);
    setCompletion(stage.completionPercentage);
    setComments(stage.comments || '');
    setDelayIndicator(stage.delayIndicator);
    setShowStageModal(true);
  };

  const handleStageUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStage || !token) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/workflow/stage/${activeStage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: stageStatus,
          completionPercentage: completion,
          comments,
          delayIndicator
        })
      });

      if (response.ok) {
        setShowStageModal(false);
        fetchOrderDetails(); // Reload data
        alert('Workflow stage updated successfully!');
      } else {
        const err = await response.json();
        alert(err.message || 'Failed to update stage');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating workflow stage.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStageIcon = (status: string) => {
    if (status === 'COMPLETED') return <CheckCircle size={18} className="text-emerald-500" />;
    if (status === 'IN_PROGRESS') return <Clock size={18} className="text-blue-500 animate-pulse" />;
    if (status === 'DELAYED') return <AlertTriangle size={18} className="text-red-500" />;
    return <Clock size={18} className="text-slate-300" />;
  };

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
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      default:
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl shimmer" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[18px] shimmer" />
          <div className="h-[450px] bg-slate-200 dark:bg-slate-800 rounded-[18px] shimmer" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-slate-400">
        <h3>Order not found.</h3>
        <Link to="/orders" className="text-blue-500 hover:underline mt-2 inline-block">Back to orders</Link>
      </div>
    );
  }

  // Check if current user is allowed to edit workflow stages
  // Admin, PM, Supervisor, or the worker assigned as employee in that stage
  const canEditStage = (stage: Stage) => {
    if (['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR'].includes(user?.role || '')) return true;
    if (user?.role === 'WORKER') {
      // Allow if name matches the assigned employee
      return stage.assignedEmployee?.name === user.name;
    }
    if (user?.role === 'INSPECTOR' && stage.stageName === 'Quality Check') return true;
    return false;
  };

  return (
    <div className="p-6 space-y-6 text-left">
      {/* Header Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">
              Stage History: {order.orderNumber}
            </h1>
            <p className="text-xs text-slate-400">Tracking SVS fabrication milestones.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setInvoiceOpen(true)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
          >
            <FileText size={14} /> View Invoice
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Order Specifications */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Metadata Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className={`badge-status text-[9px] font-extrabold ${getStatusBadgeStyles(order.status)}`}>
                {order.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold text-slate-400">Progress: {order.progressPercentage}%</span>
            </div>

            {/* Progress line */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${order.progressPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Furniture Type</span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">{order.furnitureType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Category</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{order.category}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Wood Type</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{order.woodType}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dimensions</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{order.dimensions}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Quantity</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{order.quantity} units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Est. Cost</span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">₹{order.estimatedCost.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {order.notes && (
              <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Production Notes</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-850 p-3 rounded-xl">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          {/* Customer & Staff info card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">Client & Team Allocation</h3>
            
            {order.customer && (
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <User size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">{order.customer.name}</span>
                    <span className="text-[10px] text-slate-400">Phone: {order.customer.phone} {order.customer.email ? `• ${order.customer.email}` : ''}</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <MapPin size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{order.customer.address}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Designer Lead</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{order.designer || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Carpenter Lead</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{order.assignedCarpenter || 'Not allocated'}</span>
              </div>
            </div>
          </div>

          {/* QR Code tracking card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 flex items-center justify-between shadow-sm">
            <div className="space-y-1 pr-4">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <QrCode size={16} className="text-blue-500" /> Physical Item Tagging
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Scan this barcode/QR code on the shop floor to quickly update stages on tablet terminals.
              </p>
            </div>
            {order.qrCode ? (
              <img src={order.qrCode} alt="QR Code Tag" className="w-16 h-16 border border-slate-200 p-1 rounded-lg bg-white" />
            ) : (
              <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-300">
                <QrCode size={24} />
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Workflow Stage Progress Timeline */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">Milestone Progress timeline</h3>
          
          <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
            {order.stages.map((stage, idx) => {
              const isPast = stage.status === 'COMPLETED';
              const isCurrent = stage.status === 'IN_PROGRESS';
              const isFuture = stage.status === 'PENDING';
              
              return (
                <div key={stage.id} className="relative pl-8 flex gap-3 text-xs">
                  {/* Timeline bullet icon */}
                  <div className="absolute left-1.5 top-0.5 -translate-x-1/2 z-10 bg-white dark:bg-slate-900 p-0.5 rounded-full">
                    {getStageIcon(stage.status)}
                  </div>

                  {/* Stage Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-extrabold ${isPast ? 'text-slate-800 dark:text-slate-200' : isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                        {stage.stageName}
                      </h4>
                      {canEditStage(stage) && (isCurrent || isPast) && (
                        <button
                          onClick={() => handleOpenStageUpdate(stage)}
                          className="text-[10px] text-blue-500 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <Edit size={10} /> Update
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400 font-semibold">
                      <span>Progress: {stage.completionPercentage}%</span>
                      {stage.assignedEmployee && (
                        <span>Assigned: {stage.assignedEmployee.name}</span>
                      )}
                      <span>Est: {new Date(stage.expectedCompletionDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>

                    {stage.comments && (
                      <p className="text-[10px] bg-slate-50 dark:bg-slate-850 p-2 rounded-xl text-slate-500 dark:text-slate-400 leading-normal">
                        {stage.comments}
                      </p>
                    )}

                    {stage.delayIndicator && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/15">
                        <AlertTriangle size={10} /> Late Alert Triggered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Stage Update Modal Dialog */}
      {showStageModal && activeStage && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4 shadow-xl">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">
                Update Milestone Stage: {activeStage.stageName}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Adjust completion levels and log updates for order {order.orderNumber}.</p>
            </div>

            <form onSubmit={handleStageUpdateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Stage Status</label>
                <select
                  value={stageStatus}
                  onChange={e => {
                    setStageStatus(e.target.value);
                    if (e.target.value === 'COMPLETED') setCompletion(100);
                  }}
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                >
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed (100%)</option>
                  <option value="DELAYED">Delayed / Blocked</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1 flex justify-between">
                  Completion Progress
                  <span className="font-bold text-blue-500">{completion}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={completion}
                  disabled={stageStatus === 'COMPLETED'}
                  onChange={e => setCompletion(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="delayIndicatorCheck"
                  checked={delayIndicator}
                  onChange={e => setDelayIndicator(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
                />
                <label htmlFor="delayIndicatorCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  Flag as Delayed (Triggers Production Alert)
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Work Comments / Remarks</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  placeholder="Record what materials were used, any dimensions verified, or causes for delay..."
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowStageModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary text-xs font-semibold flex items-center gap-1.5"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal Box */}
      {invoiceOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left shadow-2xl relative">
            <button
              onClick={() => setInvoiceOpen(false)}
              className="absolute right-4 top-4 p-2 hover:bg-slate-105 rounded-full text-slate-400"
            >
              ✕
            </button>

            {/* Printable Invoice Header */}
            <div className="space-y-6 pt-4" id="printable-invoice">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">Sri Venkata Sai Furniture Works</h2>
                  <p className="text-[10px] text-slate-400">Industrial Area, Miyapur, Hyderabad • GSTIN: 36AASFS8892D1Z8</p>
                </div>
                <div className="text-right">
                  <h3 className="text-xs font-extrabold text-blue-600 dark:text-blue-400">INVOICE BILL</h3>
                  <span className="text-[10px] text-slate-400 font-bold block">{order.orderNumber}</span>
                  <span className="text-[9px] text-slate-400 block">Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Client & Billing specifics */}
              <div className="grid grid-cols-2 gap-6 text-xs leading-relaxed">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Billed To:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{order.customer?.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 block">{order.customer?.address}</span>
                  <span className="text-slate-500 dark:text-slate-400 block">Phone: {order.customer?.phone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Project Details:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">{order.furnitureType}</span>
                  <span className="text-slate-500 dark:text-slate-400 block">Material: {order.woodType} Wood</span>
                  <span className="text-slate-500 dark:text-slate-400 block">Dimensions: {order.dimensions}</span>
                </div>
              </div>

              {/* Item calculations table */}
              <table className="w-full text-xs text-left border-collapse border-y border-slate-100 dark:border-slate-800">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850/40 text-slate-500 font-bold">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-3">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">{order.furnitureType}</span>
                      <span className="text-[9px] text-slate-400">Custom hand-crafted furniture in {order.woodType} Wood. Specifications: {order.dimensions}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{order.quantity}</td>
                    <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">₹{order.estimatedCost.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-100">₹{(order.estimatedCost * order.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total calculation rows */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{(order.estimatedCost * order.quantity).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Estimated CGST (9%):</span>
                    <span>₹{(order.estimatedCost * order.quantity * 0.09).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Estimated SGST (9%):</span>
                    <span>₹{(order.estimatedCost * order.quantity * 0.09).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-800 dark:text-slate-100 border-t border-slate-200 dark:border-slate-800 pt-2">
                    <span>Grand Total:</span>
                    <span>₹{((order.finalCost || order.estimatedCost * order.quantity) * 1.18).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signature block */}
              <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Authorized Signatory SVS Works</span>
                <span>Date of Issue: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setInvoiceOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer size={12} /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
