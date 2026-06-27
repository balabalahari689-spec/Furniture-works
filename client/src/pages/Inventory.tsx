import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  Boxes,
  Plus,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingDown,
  Warehouse,
  History,
} from "lucide-react";

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");

  // Create new item states
  const [showAddModal, setShowAddModal] = useState(false);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("Wood");
  const [cost, setCost] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minStockAlert, setMinStockAlert] = useState("10");
  const [unit, setUnit] = useState("pcs");
  const [submitting, setSubmitting] = useState(false);

  // Edit stock states
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState("");
  const [adjustType, setAdjustType] = useState<"IN" | "OUT">("IN");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const data = await api.get("/inventory");
      setInventory(data);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load inventory stock levels", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !cost || currentStock === "") {
      toast("Validation Error", "Please fill in item name, cost, and starting stock.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const item = await api.post("/inventory", {
        itemName,
        category,
        cost: parseFloat(cost),
        currentStock: parseFloat(currentStock),
        minStockAlert: parseFloat(minStockAlert),
        unit,
      });

      toast("Item Added", `${item.itemName} successfully added to inventory.`, "success");
      setInventory((prev) => [...prev, item]);
      setShowAddModal(false);
      // Reset form
      setItemName("");
      setCost("");
      setCurrentStock("");
      setMinStockAlert("10");
      setUnit("pcs");
    } catch (e: any) {
      toast("Addition Failed", e.message || "Failed to add inventory", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !stockAdjustment) return;

    setAdjustSubmitting(true);
    try {
      const adjustmentValue = parseFloat(stockAdjustment);
      const newStock =
        adjustType === "IN"
          ? selectedItem.currentStock + adjustmentValue
          : selectedItem.currentStock - adjustmentValue;

      if (newStock < 0) {
        toast("Invalid Action", "Stock level cannot drop below zero.", "warning");
        setAdjustSubmitting(false);
        return;
      }

      const updated = await api.put(`/inventory/${selectedItem.id}`, {
        currentStock: newStock,
      });

      toast("Stock Level Adjusted", `Updated ${selectedItem.itemName} stock to ${newStock} ${selectedItem.unit}`, "success");
      setInventory((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? { ...item, currentStock: newStock } : item))
      );
      setSelectedItem(null);
      setStockAdjustment("");
    } catch (e: any) {
      toast("Adjustment Failed", e.message || "Failed to edit stock", "error");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const categories = ["ALL", "Wood", "Plywood", "Hardware", "Polish", "Accessories"];

  const filteredInventory = inventory.filter((item) => {
    if (activeCategory !== "ALL" && item.category !== activeCategory) return false;
    return true;
  });

  // Calculations
  const totalValuation = inventory.reduce((sum, item) => sum + item.currentStock * item.cost, 0);
  const lowStockItems = inventory.filter((item) => item.currentStock <= item.minStockAlert);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Raw Material & Inventory</h1>
          <p className="text-xs text-app-text-muted mt-1">
            Track, restock, and audit materials for wood fabrication projects.
          </p>
        </div>
        {["ADMIN", "PRODUCTION_MANAGER"].includes(user?.role || "") && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Material
          </button>
        )}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
              Total Stock Valuation
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              ₹{totalValuation.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
              Low Stock Items
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {lowStockItems.length} Materials
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
              Total Material Types
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {inventory.length} Categories
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeCategory === cat
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Low Stock Warning Box */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-200/40 dark:border-rose-900/30 p-4 rounded-[18px] flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400">Critical Supply Deficit</h4>
            <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 leading-relaxed">
              The following items are running below minimum safety levels:{" "}
              {lowStockItems.map((item) => `${item.itemName} (${item.currentStock} ${item.unit})`).join(", ")}.
            </p>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading inventory lists...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => {
            const isLow = item.currentStock <= item.minStockAlert;
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 p-5 rounded-[18px] border shadow-xs flex flex-col justify-between transition-all ${
                  isLow ? "border-rose-200 dark:border-rose-950/50" : "border-slate-200 dark:border-slate-850"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 rounded-full capitalize">
                      {item.category}
                    </span>
                    {isLow && (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/40 rounded-full text-[9px] font-bold animate-pulse">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-slate-850 dark:text-white mt-3 leading-snug">
                    {item.itemName}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] text-slate-400 font-bold">
                    <div>
                      <span>Stock Level</span>
                      <span className={`text-sm font-extrabold block mt-1 ${isLow ? "text-rose-500" : "text-slate-850 dark:text-slate-200"}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span>Unit Cost</span>
                      <span className="text-sm font-extrabold text-slate-850 dark:text-slate-200 block mt-1">
                        ₹{item.cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setAdjustType("IN");
                    }}
                    className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    Stock In
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setAdjustType("OUT");
                    }}
                    className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    Stock Out
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm text-slate-950 dark:text-white">Add Raw Material</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Item Description / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 18mm Marine Plywood Sheets"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  >
                    <option value="Wood">Timber Wood</option>
                    <option value="Plywood">Plywood</option>
                    <option value="Hardware">Hardware fittings</option>
                    <option value="Polish">Polishes</option>
                    <option value="Paint">Paints & Coats</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Measurement Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. cft, sheets, pcs, kg"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Cost *
                  </label>
                  <input
                    type="number"
                    placeholder="INR"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Stock *
                  </label>
                  <input
                    type="number"
                    placeholder="Qty"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Min Alert
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add to Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Level Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                Adjust Stock: {adjustType}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAdjustStock} className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Item: <strong>{selectedItem.itemName}</strong><br />
                Current stock: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong>
              </p>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Quantity to adjust ({selectedItem.unit}) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  value={stockAdjustment}
                  onChange={(e) => setStockAdjustment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  {adjustSubmitting ? "Adjusting..." : `Apply Stock ${adjustType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
