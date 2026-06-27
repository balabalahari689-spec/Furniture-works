import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { ArrowLeft, UserPlus, ClipboardCheck } from "lucide-react";

export const CreateOrder: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Lists for dropdowns
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [furnitureType, setFurnitureType] = useState("");
  const [category, setCategory] = useState("Living Room");
  const [woodType, setWoodType] = useState("Teak Wood");
  const [dimensions, setDimensions] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [carpenterId, setCarpenterId] = useState("");

  // Customer inline form toggle & states
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [ncName, setNcName] = useState("");
  const [ncPhone, setNcPhone] = useState("");
  const [ncEmail, setNcEmail] = useState("");
  const [ncAddress, setNcAddress] = useState("");
  const [ncSubmitting, setNcSubmitting] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const loadDropdownData = async () => {
    setLoading(true);
    try {
      const custData = await api.get("/customers");
      const empData = await api.get("/employees");
      setCustomers(custData);
      // Filter employees to show only carpenters / workers in carpentry
      const carpenters = empData.filter(
        (emp: any) => emp.department === "Carpentry" || emp.user.role === "WORKER"
      );
      setEmployees(carpenters);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load directory items", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !furnitureType || !dimensions || !estimatedCost || !deliveryDate) {
      toast("Validation Error", "Please fill in all required operational inputs.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const order = await api.post("/orders", {
        customerId,
        furnitureType,
        category,
        woodType,
        dimensions,
        quantity,
        priority,
        estimatedCost,
        deliveryDate,
        notes,
        carpenterId: carpenterId || null,
      });

      toast("Order Initialized", `Production Order ${order.orderNumber} successfully routed!`, "success");
      navigate("/orders");
    } catch (e: any) {
      toast("Routing Failed", e.message || "Failed to create order", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncName || !ncPhone || !ncAddress) {
      toast("Validation Error", "Please input customer name, phone, and address.", "warning");
      return;
    }

    setNcSubmitting(true);
    try {
      const customer = await api.post("/customers", {
        name: ncName,
        phone: ncPhone,
        email: ncEmail || null,
        address: ncAddress,
      });

      toast("Customer Registered", `${customer.name} added to database.`, "success");
      setCustomers((prev) => [...prev, customer]);
      setCustomerId(customer.id);
      setShowNewCustModal(false);
      // Reset form
      setNcName("");
      setNcPhone("");
      setNcEmail("");
      setNcAddress("");
    } catch (e: any) {
      toast("Registration Failed", e.message || "Failed to add customer", "error");
    } finally {
      setNcSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Production Order</h1>
          <p className="text-xs text-app-text-muted mt-1">
            Initialize a new furniture order and map its workflow routing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <form onSubmit={handleCreateOrder} className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          {/* Customer selection */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Select Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                required
              >
                <option value="">-- Select customer profile --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowNewCustModal(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-2 border border-slate-200/40 dark:border-slate-700/50 h-10 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Customer
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-850" />

          {/* Furniture Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Furniture Product / Description *
              </label>
              <input
                type="text"
                placeholder="e.g. 6-Seater Royal Teak Sofa Set"
                value={furnitureType}
                onChange={(e) => setFurnitureType(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Dimensions / Size Specs *
              </label>
              <input
                type="text"
                placeholder="e.g. 7.5ft x 3ft x 2.5ft"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
              >
                <option value="Living Room">Living Room</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Office">Office</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Primary Wood Type
              </label>
              <select
                value={woodType}
                onChange={(e) => setWoodType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
              >
                <option value="Teak Wood">Royal Teak Wood</option>
                <option value="Mahogany">Mahogany</option>
                <option value="Rosewood">Rosewood</option>
                <option value="Plywood">Waterproof Plywood</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Allocation & Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Estimated Project Cost (INR) *
              </label>
              <input
                type="number"
                placeholder="e.g. 75000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Est. Delivery Deadline *
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Assigned Carpenter
              </label>
              <select
                value={carpenterId}
                onChange={(e) => setCarpenterId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
              >
                <option value="">-- Assign carpenter --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.user.id}>
                    {emp.user.name} ({emp.productivity}% Rating)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Priority
            </label>
            <div className="flex gap-4">
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((prio) => (
                <label key={prio} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="priority"
                    value={prio}
                    checked={priority === prio}
                    onChange={() => setPriority(prio)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  <span>{prio}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Design specifications / Woodwork Notes
            </label>
            <textarea
              rows={4}
              placeholder="Detail out custom carvings, drawer alignments, handle spacing, cushion velvet shade swap preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl focus:border-blue-500 outline-none resize-y"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/15 flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-4.5 h-4.5" />
            {submitting ? "Routing production stages..." : "Launch Order Workflow"}
          </button>
        </form>

        {/* Instructions Pane */}
        <div className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 p-6 rounded-[18px] space-y-4 h-fit">
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Manufacturing Workflow Stages
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Placing this order auto-initiates the manufacturing stage pipeline. The tracking board will map progress across these ten sequential stages:
          </p>
          <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-decimal pl-4">
            <li><strong>Design Approved</strong> (Mockups and dimensions)</li>
            <li><strong>Raw Material Sourced</strong> (Timber and hardware checkout)</li>
            <li><strong>Carpentry</strong> (Rough framing and sawing)</li>
            <li><strong>Assembly</strong> (Glue, hydraulic hinges and joints)</li>
            <li><strong>Finishing</strong> (Sanding and cushion upholstery)</li>
            <li><strong>Polishing</strong> (Staining and melamine gloss spray)</li>
            <li><strong>Quality Check</strong> (Inspection & defect clearance)</li>
            <li><strong>Packaging</strong> (Protective foam wrap)</li>
            <li><strong>Ready for Dispatch</strong> (Logistics bay loading)</li>
            <li><strong>Delivered</strong> (Client site installation)</li>
          </ol>
        </div>
      </div>

      {/* Inline Add Customer Modal */}
      {showNewCustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm text-slate-950 dark:text-white">Register Customer Profile</h3>
              <button
                onClick={() => setShowNewCustModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="Sai Vignesh Builders"
                  value={ncName}
                  onChange={(e) => setNcName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    placeholder="+91 99887 76655"
                    value={ncPhone}
                    onChange={(e) => setNcPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="vignesh@builders.com"
                    value={ncEmail}
                    onChange={(e) => setNcEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Delivery Site Address *
                </label>
                <textarea
                  rows={2}
                  placeholder="Plot 104, Madhapur, Road No 10, Hyderabad"
                  value={ncAddress}
                  onChange={(e) => setNcAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewCustModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ncSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  {ncSubmitting ? "Adding..." : "Add to Directory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Close Icon
const X = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
