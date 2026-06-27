import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { ClipboardCheck, ShieldAlert, CheckSquare, AlertCircle, Sparkles, User, FileText } from "lucide-react";

export const QualityCheck: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [qcQueue, setQcQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspection states
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [verdict, setVerdict] = useState<"PASSED" | "FAILED">("PASSED");
  const [failReason, setFailReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQcQueue = async () => {
    setLoading(true);
    try {
      const orders = await api.get("/orders");
      // Filter for orders in QUALITY_CHECK stage
      const queue = orders.filter((o: any) => o.currentStage === "QUALITY_CHECK");
      setQcQueue(queue);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load Quality Check list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQcQueue();
  }, []);

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (verdict === "FAILED" && !failReason) {
      toast("Validation Error", "Please specify the failure reason.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/qc/report", {
        orderId: selectedOrder.id,
        status: verdict,
        reason: verdict === "FAILED" ? failReason : null,
        remarks,
      });

      toast("Inspection Completed", `Inspection report saved for Order ${selectedOrder.orderNumber}`, "success");
      setQcQueue((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setSelectedOrder(null);
      setFailReason("");
      setRemarks("");
      setVerdict("PASSED");
    } catch (e: any) {
      toast("Submission Failed", e.message || "Failed to submit QC report", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const failureCategories = [
    "Hydraulic storage alignment off-spec",
    "Structural wood joints have gaps (>2mm)",
    "Wood surface polishing has uneven shade",
    "Cabinet hinges are not soft-closing",
    "Upholstery fabric contains stains/wrinkles",
    "Physical scratches on wood surface",
    "Dimensional mismatch from CAD mockup",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quality Control (QC) console</h1>
        <p className="text-xs text-app-text-muted mt-1">
          Perform audits, file inspection logs, and clearance checklists.
        </p>
      </div>

      {/* Grid: Queue list on left, Inspection panel on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QC Queue List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Inspection Queue
            </h3>
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
              {qcQueue.length} Pending
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 text-xs">Querying QC queue...</div>
          ) : qcQueue.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
              <ClipboardCheck className="w-8 h-8 text-slate-350" />
              <span>Inspection queue is empty. All orders are cleared.</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {qcQueue.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 bg-slate-50 dark:bg-slate-950 border rounded-xl cursor-pointer hover:border-blue-400 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    selectedOrder?.id === order.id ? "border-blue-500 ring-2 ring-blue-500/15" : "border-slate-200 dark:border-slate-850"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {order.orderNumber}
                    </span>
                    <h4 className="text-xs font-bold text-slate-850 dark:text-white">
                      {order.furnitureType}
                    </h4>
                    <div className="flex gap-4 text-[10px] text-slate-400 font-bold">
                      <span>Wood: {order.woodType}</span>
                      <span>Artisan: {order.carpenter?.name || "Unassigned"}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white rounded-lg transition-colors shadow-xs"
                  >
                    Start Inspection
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inspection Form Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
            Inspection Panel
          </h3>

          {!selectedOrder ? (
            <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-2">
              <CheckSquare className="w-8 h-8 text-slate-350" />
              <span>Select an order from the queue to start audit report.</span>
            </div>
          ) : (
            <form onSubmit={handleInspectionSubmit} className="space-y-4 pt-3.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-semibold space-y-1">
                <span className="text-[10px] text-slate-400">Selected Item</span>
                <span className="block font-bold text-slate-850 dark:text-white">
                  {selectedOrder.orderNumber}
                </span>
                <span className="block text-slate-500 text-[10px]">
                  {selectedOrder.furnitureType}
                </span>
              </div>

              {/* Verdict Buttons */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Inspection Verdict *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerdict("PASSED")}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition-all ${
                      verdict === "PASSED"
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/10"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Passed (Clear)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerdict("FAILED")}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition-all ${
                      verdict === "FAILED"
                        ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-500/10"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    Failed (Defects)
                  </button>
                </div>
              </div>

              {/* Failure reason details */}
              {verdict === "FAILED" && (
                <div className="animate-fade-in space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Defect Category *
                    </label>
                    <select
                      value={failReason}
                      onChange={(e) => setFailReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                      required
                    >
                      <option value="">-- Select defect --</option>
                      {failureCategories.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Inspection Remarks / Audit Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail out structural joints alignments, custom polishing coats thickness verification checks..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 ${
                  verdict === "PASSED"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10"
                    : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/10"
                }`}
              >
                <FileText className="w-4 h-4" />
                {submitting ? "Filing report..." : "Submit Audit Report"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
