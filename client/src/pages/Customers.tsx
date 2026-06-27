import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { Users, Plus, Phone, Mail, MapPin, Search } from "lucide-react";

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create new customer states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.get("/customers");
      setCustomers(data);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load customer directory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      toast("Validation Error", "Please fill in customer name, phone, and address.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const customer = await api.post("/customers", { name, phone, email: email || null, address });
      toast("Customer Registered", `${customer.name} has been added.`, "success");
      setCustomers((prev) => [...prev, customer]);
      setShowAddModal(false);
      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
    } catch (e: any) {
      toast("Registration Failed", e.message || "Failed to add customer", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers CRM</h1>
          <p className="text-xs text-app-text-muted mt-1">
            Access client metadata, delivery routes, and custom order history.
          </p>
        </div>
        {["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM"].includes(user?.role || "") && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white rounded-xl shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        )}
      </div>

      {/* Roster Metrics */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
            Total Client Profiles
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {customers.length} Accounts
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Query by customer name, phone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
        />
      </div>

      {/* Roster List Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading client directory...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">No customer profiles found matching your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-xs space-y-4"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</h3>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] font-bold rounded-full">
                  {c.orders?.length || 0} order(s)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-app-text-muted">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2 text-app-text-muted">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>{c.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-app-text-muted">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-relaxed truncate max-w-[200px]" title={c.address}>{c.address}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm text-slate-950 dark:text-white">Register Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hyderabad Elite Homes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Delivery Site Address *
                </label>
                <textarea
                  rows={3}
                  placeholder="Building No. 42, Gachibowli, Hyderabad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  required
                />
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
                  {submitting ? "Registering..." : "Add to CRM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
