import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  FileCheck2,
  FileSpreadsheet,
  Clock,
  Printer,
  Sparkles,
  QrCode,
  Tag,
} from "lucide-react";

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load order specs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetails();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading order operation details...</div>;
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-400">Production order not found.</p>
        <Link to="/orders" className="text-blue-500 underline text-xs">
          Back to database
        </Link>
      </div>
    );
  }

  // Calculate overall completion percent
  const completedStages = order.workflowStages.filter((s: any) => s.status === "COMPLETED").length;
  const activeStage = order.workflowStages.find((s: any) => s.stageName === order.currentStage);
  const activeStagePercent = activeStage ? activeStage.completionPercent : 0;
  const overallPercent = Math.min(
    100,
    Math.round(((completedStages * 100 + activeStagePercent) / (order.workflowStages.length * 100)) * 100)
  );

  // QR Code url
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=SVS-ORDER-${order.orderNumber}`;

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              Production Details sheet
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Order {order.orderNumber}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                order.priority === "CRITICAL"
                  ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20"
                  : "bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-950/20"
              }`}>
                {order.priority}
              </span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-950 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-white rounded-xl shadow-md transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / PDF Invoice
        </button>
      </div>

      {/* Main Spec Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Specification Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Tracker Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overall Workflow Progress
              </h3>
              <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                {overallPercent}%
              </span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${overallPercent}%` }}
              />
            </div>

            {/* Visual stage bubbles */}
            <div className="relative pt-6">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2" />
              <div className="relative flex justify-between">
                {order.workflowStages.map((stage: any, idx: number) => {
                  const isCompleted = stage.status === "COMPLETED";
                  const isActive = order.currentStage === stage.stageName;
                  const isDelayed = stage.delayIndicator;

                  return (
                    <div
                      key={stage.id}
                      className="flex flex-col items-center group relative cursor-help"
                      title={`${stage.stageName.replace("_", " ")}: ${stage.status} (${stage.completionPercent}%)`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 z-10 transition-all ${
                          isCompleted
                            ? "bg-blue-600 border-blue-600 text-white"
                            : isDelayed
                            ? "bg-rose-500 border-rose-500 text-white"
                            : isActive
                            ? "bg-amber-400 border-amber-400 text-slate-950 animate-pulse"
                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="absolute top-8 text-[9px] font-bold text-slate-400 whitespace-nowrap hidden group-hover:block px-2 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-md z-25">
                        {stage.stageName.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Furniture Specifications */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
              Furniture Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Furniture Type</span>
                <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                  {order.furnitureType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Wood Category</span>
                <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                  {order.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Wood Type / Material</span>
                <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                  {order.woodType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Dimensions Specs</span>
                <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                  {order.dimensions}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Quantity</span>
                <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                  {order.quantity} unit(s)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Assigned Artisan</span>
                <span className="font-bold text-slate-800 dark:text-white mt-1 block">
                  {order.carpenter?.name || "Unassigned"}
                </span>
              </div>
            </div>

            {order.notes && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                <span className="text-slate-400 text-xs block font-medium">Special Woodwork Instructions</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                  {order.notes}
                </p>
              </div>
            )}
          </div>

          {/* Quality check Inspection Report */}
          {order.qcReport && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
                Quality Inspection Report
              </h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    order.qcReport.status === "PASSED"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20"
                      : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20"
                  }`}>
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">
                      Audit Verdict
                    </span>
                    <span className={`text-sm font-bold mt-1 block ${
                      order.qcReport.status === "PASSED" ? "text-emerald-500" : "text-rose-500"
                    }`}>
                      {order.qcReport.status}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-app-text-muted space-y-1">
                  <div>Inspector: <strong className="text-slate-800 dark:text-white">{order.qcReport.inspectorName}</strong></div>
                  <div>Date: <strong className="text-slate-850 dark:text-slate-350">{new Date(order.qcReport.createdAt).toLocaleDateString()}</strong></div>
                </div>
              </div>
              {order.qcReport.status === "FAILED" && (
                <div className="p-3.5 bg-rose-50/10 border border-rose-100/30 rounded-xl">
                  <span className="text-xs font-bold text-rose-500 block">Inspection Failure Reason:</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{order.qcReport.reason}</p>
                </div>
              )}
              {order.qcReport.remarks && (
                <div className="text-xs text-app-text-muted">
                  Remarks: <span className="italic">"{order.qcReport.remarks}"</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: customer details & pricing */}
        <div className="space-y-6">
          {/* QR Code Tracker Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 w-full">
              Production Router QR Code
            </h3>
            <div className="p-3 bg-white border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <img src={qrCodeUrl} alt="Order QR Code" className="w-36 h-36" />
            </div>
            <span className="text-[10px] text-slate-400 font-semibold mt-3.5 leading-relaxed">
              Scan from mobile/tablet to check active workflow stage instantly.
            </span>
          </div>

          {/* Customer Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
              Customer Directory Details
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="font-bold text-slate-850 dark:text-white text-sm">
                {order.customer.name}
              </div>
              <div className="flex items-center gap-2 text-app-text-muted">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{order.customer.phone}</span>
              </div>
              {order.customer.email && (
                <div className="flex items-center gap-2 text-app-text-muted">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{order.customer.email}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-app-text-muted">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{order.customer.address}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Costs Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
              Financial Summary
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">Estimated Fabrication Cost</span>
                <span className="font-bold text-slate-850 dark:text-white">
                  ₹{order.estimatedCost.toLocaleString()}
                </span>
              </div>
              {order.finalCost && (
                <div className="flex justify-between items-center text-sm pt-2.5 border-t border-slate-100 dark:border-slate-850">
                  <span className="text-slate-500 font-bold">Final Cost Invoiced</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">
                    ₹{order.finalCost.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400 font-semibold">Scheduled Deadline</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Invoice Page Layout (Visible only when printing) */}
      <div className="hidden print-only p-8 text-black bg-white border border-slate-300 rounded-lg max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold">Sri Venkata Sai Furniture Works</h1>
            <p className="text-xs mt-1 text-slate-500">Miyapur, Hyderabad | Phone: +91 98480 22338</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800">INVOICE / ROUTER</h2>
            <p className="text-xs mt-1">Invoice: <strong>{order.orderNumber}</strong></p>
            <p className="text-xs">Date: <strong>{new Date().toLocaleDateString()}</strong></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-xs border-b pb-6">
          <div>
            <h3 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Billed To</h3>
            <p className="font-bold">{order.customer.name}</p>
            <p className="mt-1">{order.customer.address}</p>
            <p className="mt-1">Phone: {order.customer.phone}</p>
          </div>
          <div>
            <h3 className="font-bold text-slate-700 uppercase tracking-wider mb-2">Project Specifications</h3>
            <p>Product: <strong>{order.furnitureType}</strong></p>
            <p className="mt-1">Material: <strong>{order.woodType} ({order.dimensions})</strong></p>
            <p className="mt-1">Delivery Deadline: <strong>{new Date(order.deliveryDate).toLocaleDateString()}</strong></p>
          </div>
        </div>

        <table className="w-full text-xs text-left border-collapse border-b pb-6">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="py-2 px-3 font-bold">Item Description</th>
              <th className="py-2 px-3 font-bold text-center">Qty</th>
              <th className="py-2 px-3 font-bold text-right">Estimated Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3 px-3">
                <p className="font-bold">{order.furnitureType}</p>
                <p className="text-[10px] text-slate-500 mt-1">Custom woodwork category: {order.category}</p>
              </td>
              <td className="py-3 px-3 text-center">{order.quantity}</td>
              <td className="py-3 px-3 text-right">₹{order.estimatedCost.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between items-center text-sm font-bold pt-4">
          <span>Total Payable Amount</span>
          <span className="text-lg">₹{order.estimatedCost.toLocaleString()}</span>
        </div>

        <div className="text-center pt-12 text-[10px] text-slate-400">
          Thank you for choosing Sri Venkata Sai Furniture Works!
        </div>
      </div>
    </div>
  );
};
