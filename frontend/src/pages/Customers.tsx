import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Eye,
  Plus,
  Loader2,
  Save,
  Search
} from 'lucide-react';

interface CustomerItem {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  orders: Array<{ id: string; orderNumber: string; status: string; progressPercentage: number }>;
}

export const Customers: React.FC = () => {
  const { token, user } = useAuth();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Add Client Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      alert('Name, phone and delivery address are required.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          address,
          email: email || null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create customer');

      setCustomers(prev => [...prev, { ...data, orders: [] }]);
      setShowAddModal(false);
      
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      alert('Customer account registered successfully!');
    } catch (err: any) {
      alert(err.message || 'Error creating customer account');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Customer Accounts Index</h1>
          <p className="text-xs text-slate-400">View customer profile directories, billing records, and active order counts.</p>
        </div>
        <div className="flex gap-2">
          {['ADMIN', 'PRODUCTION_MANAGER', 'SALES'].includes(user?.role || '') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-1.5 text-xs font-semibold"
            >
              <Plus size={14} /> New Customer
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-[14px]">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search client directory by name or phone..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full text-xs py-1.5 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] shimmer" />
          ))
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-12">No client accounts found.</div>
        ) : (
          filteredCustomers.map(cust => (
            <div key={cust.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-sm">
                  {cust.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{cust.name}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Client Profile</span>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-1.5 text-[10px] text-slate-500 font-semibold border-y border-slate-50 dark:border-slate-850/80 py-3">
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-slate-400" /> <span>{cust.phone}</span>
                </div>
                {cust.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-slate-400" /> <span>{cust.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-slate-400 mt-0.5" /> <span className="leading-normal break-words">{cust.address}</span>
                </div>
              </div>

              {/* Orders summary */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registered Orders</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-250 flex items-center gap-1">
                  <ClipboardList size={14} className="text-blue-500" /> {cust.orders.length} items
                </span>
              </div>

              {/* Mini details list */}
              {cust.orders.length > 0 && (
                <div className="space-y-1 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl text-[9px] text-slate-400 font-bold">
                  <span className="uppercase tracking-wider block mb-1">Active items:</span>
                  <div className="max-h-16 overflow-y-auto space-y-1">
                    {cust.orders.map(o => (
                      <div key={o.id} className="flex justify-between items-center text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        <span>{o.orderNumber}</span>
                        <span className="text-blue-500">{o.status.replace(/_/g, ' ')} ({o.progressPercentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4 shadow-xl">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Register Buyer Account</h3>
              <p className="text-[10px] text-slate-400 mt-1">Create client records to link custom woodwork jobs.</p>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Buyer Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Swamy Reddy"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 9848011223"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="buyer@gmail.com"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Site Delivery Address *</label>
                <textarea
                  required
                  rows={3}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Jubilee Hills, Hyderabad"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      Save Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
