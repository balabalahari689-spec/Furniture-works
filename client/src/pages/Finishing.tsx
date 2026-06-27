import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { Sparkles, Hammer, PlayCircle, ClipboardCheck } from "lucide-react";

export const Finishing: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tasks, setTasks] = useState([
    { id: 1, text: "Surface sanding (180 grit)", completed: true },
    { id: 2, text: "Apply wood filler on joints", completed: false },
    { id: 3, text: "Base sealer coat spray", completed: false },
    { id: 4, text: "Final lacquer/melamine coat", completed: false },
    { id: 5, text: "Upholstery foam verification", completed: false },
  ]);

  const fetchFinishingOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get("/orders");
      // Filter for orders in FINISHING, POLISHING, or PACKAGING stages
      const finishingList = data.filter((o: any) =>
        ["FINISHING", "POLISHING", "PACKAGING"].includes(o.currentStage)
      );
      setOrders(finishingList);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load finishing logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinishingOrders();
  }, []);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finishing & Polishing</h1>
        <p className="text-xs text-app-text-muted mt-1">
          Monitor sanding checks, lacquer spraying, wood staining, and velvet upholstery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active finishing orders */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-805 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
            Active Finishing Bays
          </h3>

          {loading ? (
            <div className="text-xs text-slate-400 py-6 text-center">Loading finishing logs...</div>
          ) : orders.length === 0 ? (
            <div className="text-xs text-slate-400 py-12 text-center flex flex-col items-center gap-2">
              <Sparkles className="w-8 h-8 text-slate-350" />
              <span>No orders currently in Finishing, Polishing, or Packaging stages.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-colors"
                >
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">
                      {o.orderNumber}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {o.furnitureType}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Material: {o.woodType} | Category: {o.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40 rounded-full text-[9px] font-bold capitalize">
                      {o.currentStage.replace("_", " ").toLowerCase()}
                    </span>
                    <Link
                      to={`/orders/${o.id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-750 text-[10px] font-bold text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> Start Workspace
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Finishing Checklists */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-850 pb-2">
            Polish Checklist
          </h3>
          <div className="space-y-3.5 pt-2">
            {tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="mt-0.5 w-4.5 h-4.5 accent-blue-600 cursor-pointer rounded"
                />
                <span className={task.completed ? "line-through text-slate-400" : "font-semibold"}>
                  {task.text}
                </span>
              </label>
            ))}
          </div>
          <div className="p-3 bg-blue-50/25 border border-blue-100/50 rounded-xl text-[10px] text-blue-700 leading-relaxed mt-4">
            Polishing coats must dry for 12 hours under dust-free conditions before packaging wrap can be applied.
          </div>
        </div>
      </div>
    </div>
  );
};
