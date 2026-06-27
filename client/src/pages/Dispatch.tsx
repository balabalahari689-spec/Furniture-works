import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { Truck, CheckCircle2, MapPin, Calendar, PlayCircle } from "lucide-react";

export const Dispatch: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDispatchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get("/orders");
      // Filter for orders in READY_FOR_DISPATCH or DELIVERED stages
      const dispatchList = data.filter((o: any) =>
        ["READY_FOR_DISPATCH", "DELIVERED"].includes(o.currentStage)
      );
      setOrders(dispatchList);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load dispatch records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchOrders();
  }, []);

  const handleDeliver = async (orderId: string, orderNo: string) => {
    try {
      // Set the DELIVERED stage to COMPLETED via workflow API
      await api.put(`/workflow/${orderId}/stage/READY_FOR_DISPATCH`, {
        status: "COMPLETED",
        completionPercent: 100,
      });

      toast("Order Delivered", `Order ${orderNo} successfully delivered to client!`, "success");
      fetchDispatchOrders();
    } catch (e: any) {
      toast("Delivery Failed", e.message || "Failed to deliver order", "error");
    }
  };

  const readyList = orders.filter((o) => o.currentStage === "READY_FOR_DISPATCH");
  const deliveredList = orders.filter((o) => o.currentStage === "DELIVERED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logistics & Dispatch</h1>
        <p className="text-xs text-app-text-muted mt-1">
          Manage shipping queues, customer deliveries, and installation statuses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-805 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
              Awaiting Dispatch Load
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {readyList.length} Orders
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-805 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
              Total Deliveries Dispatched
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {deliveredList.length} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Queue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-805 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
            Shipping Queue
          </h3>

          {loading ? (
            <div className="text-xs text-slate-400 py-6 text-center">Loading logistics data...</div>
          ) : readyList.length === 0 ? (
            <div className="text-xs text-slate-400 py-12 text-center flex flex-col items-center gap-2">
              <Truck className="w-8 h-8 text-slate-350" />
              <span>No orders currently awaiting dispatch loading.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {readyList.map((o) => (
                <div
                  key={o.id}
                  className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 font-bold">
                        {o.orderNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {o.furnitureType}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleDeliver(o.id, o.orderNumber)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white rounded-lg transition-colors shadow-xs"
                    >
                      Confirm Delivery
                    </button>
                  </div>
                  <div className="text-xs text-app-text-muted space-y-1 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span className="truncate">{o.customer.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Deadline: {new Date(o.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History logs */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
            Logistics History
          </h3>

          {loading ? (
            <div className="text-xs text-slate-400 py-6 text-center">Loading logistics history...</div>
          ) : deliveredList.length === 0 ? (
            <div className="text-xs text-slate-400 py-12 text-center">No delivered orders logs.</div>
          ) : (
            <div className="space-y-3">
              {deliveredList.map((o) => (
                <div
                  key={o.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {o.orderNumber} - {o.customer.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {o.furnitureType}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 rounded-full text-[9px] font-bold">
                    Delivered
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
