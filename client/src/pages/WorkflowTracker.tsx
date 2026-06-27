import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  Calendar,
  User,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Hammer,
  Boxes,
  Truck,
  PackageCheck,
  CheckCircle,
  Eye,
  Percent,
} from "lucide-react";

export const WorkflowTracker: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCarpenter, setSelectedCarpenter] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  // Slide-over detail panel
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);

  // Stage modification inputs
  const [stageCompletion, setStageCompletion] = useState(0);
  const [stageStatus, setStageStatus] = useState("PENDING");
  const [stageComment, setStageComment] = useState("");
  const [isDelayed, setIsDelayed] = useState(false);

  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      const allOrders = await api.get("/orders");
      const allEmployees = await api.get("/employees");
      setOrders(allOrders);
      setEmployees(allEmployees);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load workflow data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, []);

  const handleOpenPanel = (order: any) => {
    setSelectedOrder(order);
    const activeStage = order.workflowStages.find(
      (s: any) => s.stageName === order.currentStage
    );
    if (activeStage) {
      setStageCompletion(activeStage.completionPercent);
      setStageStatus(activeStage.status);
      setStageComment(activeStage.comments || "");
      setIsDelayed(activeStage.delayIndicator);
    }
    setPanelOpen(true);
  };

  const handleUpdateStage = async () => {
    if (!selectedOrder) return;
    setUpdatingStage(true);

    try {
      const activeStageName = selectedOrder.currentStage;
      await api.put(`/workflow/${selectedOrder.id}/stage/${activeStageName}`, {
        status: stageStatus,
        completionPercent: stageCompletion,
        comments: stageComment,
        delayIndicator: isDelayed,
      });

      toast("Stage Updated", `Successfully saved changes for stage: ${activeStageName.replace("_", " ")}`, "success");
      setPanelOpen(false);
      // Reload database values
      fetchTrackerData();
    } catch (e: any) {
      toast("Update Failed", e.message || "Failed to update workflow state", "error");
    } finally {
      setUpdatingStage(false);
    }
  };

  const stagesList = [
    { key: "DESIGN_APPROVED", label: "Design Approved", icon: Sparkles, color: "border-t-blue-500" },
    { key: "MATERIAL_SOURCED", label: "Material Sourced", icon: Boxes, color: "border-t-indigo-500" },
    { key: "CARPENTRY", label: "Carpentry", icon: Hammer, color: "border-t-amber-500" },
    { key: "ASSEMBLY", label: "Assembly", icon: Hammer, color: "border-t-yellow-500" },
    { key: "FINISHING", label: "Finishing & Polish", icon: Sparkles, color: "border-t-purple-500" },
    { key: "QUALITY_CHECK", label: "Quality Check", icon: PackageCheck, color: "border-t-rose-500" },
    { key: "READY_FOR_DISPATCH", label: "Ready / Dispatch", icon: Truck, color: "border-t-emerald-500" },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle, color: "border-t-slate-500" },
  ];

  // Apply filters
  const filteredOrders = orders.filter((order) => {
    if (selectedCarpenter && order.carpenterId !== selectedCarpenter) return false;
    if (selectedPriority && order.priority !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflow Stage Tracker</h1>
          <p className="text-xs text-app-text-muted mt-1">
            Track and progress orders across structural manufacturing stages in real-time.
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2.5">
          <select
            value={selectedCarpenter}
            onChange={(e) => setSelectedCarpenter(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl outline-none shadow-sm"
          >
            <option value="">All Workers</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.user.id}>
                {emp.user.name} ({emp.department})
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl outline-none shadow-sm"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading Kanban workflow states...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 select-none h-[calc(100vh-220px)] items-start">
          {stagesList.map((stage) => {
            const stageOrders = filteredOrders.filter(
              (o) => o.currentStage === stage.key || 
              (stage.key === "FINISHING" && ["FINISHING", "POLISHING", "PACKAGING"].includes(o.currentStage))
            );

            return (
              <div
                key={stage.key}
                className="w-72 shrink-0 bg-slate-100 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850 rounded-[18px] flex flex-col max-h-full"
              >
                {/* Column Header */}
                <div className={`p-4 border-t-4 ${stage.color} rounded-t-[18px] bg-white dark:bg-slate-900 flex justify-between items-center shadow-xs`}>
                  <div className="flex items-center gap-2">
                    <stage.icon className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-850 dark:text-white truncate max-w-[130px]">
                      {stage.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                    {stageOrders.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stageOrders.length === 0 ? (
                    <div className="text-center py-8 text-[10px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const activeStageObj = order.workflowStages.find(
                        (s: any) => s.stageName === order.currentStage
                      );
                      const isOrderDelayed = activeStageObj?.delayIndicator;

                      return (
                        <div
                          key={order.id}
                          onClick={() => handleOpenPanel(order)}
                          className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all ${
                            isOrderDelayed ? "border-l-4 border-l-rose-500" : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                                order.priority === "CRITICAL"
                                  ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20"
                                  : order.priority === "HIGH"
                                  ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20"
                                  : "bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800"
                              }`}
                            >
                              {order.priority}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-850 dark:text-white mt-2 leading-snug">
                            {order.furnitureType}
                          </h4>

                          <p className="text-[10px] text-app-text-muted mt-1 truncate">
                            Client: {order.customer.name}
                          </p>

                          {/* Progress bar */}
                          <div className="mt-3.5 space-y-1">
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                              <span>Stage Completion</span>
                              <span>{activeStageObj?.completionPercent || 0}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
                                style={{ width: `${activeStageObj?.completionPercent || 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 text-[9px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(order.deliveryDate).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {isOrderDelayed && (
                              <span className="text-rose-500 flex items-center gap-0.5 font-bold">
                                <AlertTriangle className="w-3 h-3" />
                                Delayed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Update Panel */}
      {panelOpen && selectedOrder && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col animate-slide-in">
            {/* Slide Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Manage stage progress
                </span>
                <h3 className="font-bold text-sm text-slate-950 dark:text-white mt-1">
                  Order {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400"
              >
                Close
              </button>
            </div>

            {/* Slide Content */}
            <div className="flex-1 p-5 space-y-6">
              {/* Product description card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedOrder.furnitureType}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold">
                  <span>Wood: {selectedOrder.woodType}</span>
                  <span>Dimensions: {selectedOrder.dimensions}</span>
                  <span>Category: {selectedOrder.category}</span>
                  <span>Priority: {selectedOrder.priority}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800/40 flex justify-between items-center">
                  <Link
                    to={`/orders/${selectedOrder.id}`}
                    className="text-[10px] text-blue-500 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Order Specs
                  </Link>
                </div>
              </div>

              {/* Active Stage Parameters */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Current Stage: {selectedOrder.currentStage.replace("_", " ")}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-[10px] font-bold">
                    Active
                  </span>
                </div>

                {/* Status selector */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Stage Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["PENDING", "IN_PROGRESS", "COMPLETED"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setStageStatus(st);
                          if (st === "COMPLETED") setStageCompletion(100);
                        }}
                        className={`py-2 px-3 text-center text-xs font-bold rounded-xl border transition-all ${
                          stageStatus === st
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Completion Percent Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Stage Completion %
                    </label>
                    <span className="text-xs font-bold text-blue-500 flex items-center">
                      {stageCompletion}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={stageCompletion}
                    onChange={(e) => setStageCompletion(parseInt(e.target.value))}
                    disabled={stageStatus === "COMPLETED"}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                {/* Delay toggle */}
                <div className="flex items-center justify-between p-3.5 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-900/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <div>
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block leading-none">
                        Delay Indicator
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        Flag this stage as bottlenecked
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isDelayed}
                    onChange={(e) => setIsDelayed(e.target.checked)}
                    className="w-4.5 h-4.5 accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Comments box */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Comments / Remarks
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about active problems, material shortages, or wood sanding notes..."
                    value={stageComment}
                    onChange={(e) => setStageComment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Slide Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-850 flex gap-3 bg-slate-50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStage}
                onClick={handleUpdateStage}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
              >
                <ArrowRight className="w-4.5 h-4.5" />
                {updatingStage ? "Saving..." : "Save Progress"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
