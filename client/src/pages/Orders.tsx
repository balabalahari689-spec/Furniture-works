import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
  Eye,
  Trash2,
} from "lucide-react";

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;

      const data = await api.get("/orders", { params });
      setOrders(data);
      setCurrentPage(1); // reset to page 1
    } catch (e: any) {
      toast("Error", e.message || "Failed to load production orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchOrders();
    }, 300); // Debounce search changes

    return () => clearTimeout(delayDebounceFn);
  }, [search, status, priority, category]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this production order?")) return;
    try {
      await api.delete(`/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast("Order Deleted", "The order has been removed from operations database.", "success");
    } catch (e: any) {
      toast("Deletion Failed", e.message || "Unauthorized action", "error");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast("No Data", "There are no orders to export.", "warning");
      return;
    }

    const headers = [
      "Order Number",
      "Customer Name",
      "Customer Phone",
      "Furniture Type",
      "Category",
      "Wood Type",
      "Dimensions",
      "Quantity",
      "Current Stage",
      "Priority",
      "Estimated Cost",
      "Final Cost",
      "Delivery Date",
      "Created At",
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      o.customer.name,
      o.customer.phone,
      o.furnitureType,
      o.category,
      o.woodType,
      o.dimensions,
      o.quantity,
      o.currentStage,
      o.priority,
      o.estimatedCost,
      o.finalCost || "N/A",
      new Date(o.deliveryDate).toLocaleDateString(),
      new Date(o.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SVS_Production_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("CSV Exported", "CSV spreadsheet downloaded successfully.", "success");
  };

  // Sort and Paginate local records
  const sortedOrders = [...orders].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle nested fields
    if (sortField === "customer") {
      aVal = a.customer.name;
      bVal = b.customer.name;
    }

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / itemsPerPage));
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "DELIVERED":
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case "QUALITY_CHECK":
        return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50";
      case "READY_FOR_DISPATCH":
        return "bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50";
      default:
        return "bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Orders</h1>
          <p className="text-xs text-app-text-muted mt-1">
            Browse and query all active and archived furniture manufacturing orders.
          </p>
        </div>
        <div className="flex gap-2.5 no-print">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM"].includes(user?.role || "") && (
            <Link
              to="/orders/new"
              className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-xl transition-all shadow-md shadow-blue-500/15"
            >
              <Plus className="w-4 h-4" />
              New Order
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 no-print">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by order ID, item name, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              showFilters || status || priority || category
                ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {(status || priority || category) && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>

        {/* Extended Filters Drawer */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Workflow Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
              >
                <option value="">All Stages</option>
                <option value="DESIGN_APPROVED">Design Approved</option>
                <option value="MATERIAL_SOURCED">Raw Material Sourced</option>
                <option value="CARPENTRY">Carpentry</option>
                <option value="ASSEMBLY">Assembly</option>
                <option value="FINISHING">Finishing</option>
                <option value="POLISHING">Polishing</option>
                <option value="QUALITY_CHECK">Quality Check</option>
                <option value="PACKAGING">Packaging</option>
                <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
              >
                <option value="">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Furniture Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
              >
                <option value="">All Categories</option>
                <option value="Living Room">Living Room</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Office">Office</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden card-print">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-app-text-muted border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 font-bold cursor-pointer select-none" onClick={() => handleSort("orderNumber")}>
                  Order ID {sortField === "orderNumber" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 font-bold cursor-pointer select-none" onClick={() => handleSort("customer")}>
                  Customer {sortField === "customer" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 font-bold cursor-pointer select-none" onClick={() => handleSort("furnitureType")}>
                  Item Description {sortField === "furnitureType" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 font-bold cursor-pointer select-none" onClick={() => handleSort("currentStage")}>
                  Workflow Stage {sortField === "currentStage" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 font-bold cursor-pointer select-none" onClick={() => handleSort("deliveryDate")}>
                  Delivery Date {sortField === "deliveryDate" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 font-bold cursor-pointer select-none" onClick={() => handleSort("priority")}>
                  Priority {sortField === "priority" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 font-bold cursor-pointer select-none text-right" onClick={() => handleSort("estimatedCost")}>
                  Est. Cost {sortField === "estimatedCost" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-4 font-bold text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Querying operations logs...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No production orders match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">
                      <Link to={`/orders/${o.id}`} className="text-blue-500 hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-850 dark:text-slate-200">{o.customer.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{o.customer.phone}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-850 dark:text-slate-200">{o.furnitureType}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{o.category} | {o.woodType} ({o.dimensions})</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStageColor(o.currentStage)}`}>
                        {o.currentStage.replace("_", " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">
                      {new Date(o.deliveryDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          o.priority === "CRITICAL"
                            ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400"
                            : o.priority === "HIGH"
                            ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400"
                            : o.priority === "MEDIUM"
                            ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/15 dark:border-blue-900 dark:text-blue-400"
                            : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {o.priority}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-right text-slate-900 dark:text-white">
                      ₹{o.estimatedCost.toLocaleString()}
                    </td>
                    <td className="p-4 text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/orders/${o.id}`}
                          className="p-1.5 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {user?.role === "ADMIN" && (
                          <button
                            onClick={() => handleDelete(o.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
          <span className="text-xs text-app-text-muted">
            Showing Page <strong className="text-slate-900 dark:text-white">{currentPage}</strong> of{" "}
            <strong className="text-slate-900 dark:text-white">{totalPages}</strong> ({sortedOrders.length} orders total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors shadow-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
