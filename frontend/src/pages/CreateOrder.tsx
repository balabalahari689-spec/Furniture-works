import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Loader2, Save, FilePlus, UserPlus } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export const CreateOrder: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCust, setLoadingCust] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [furnitureType, setFurnitureType] = useState('');
  const [category, setCategory] = useState('Living Room');
  const [woodType, setWoodType] = useState('Teak');
  const [dimensions, setDimensions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [designer, setDesigner] = useState('');
  const [assignedCarpenter, setAssignedCarpenter] = useState('');
  const [notes, setNotes] = useState('');

  // Quick Customer Creation modal toggles
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [isCreatingCust, setIsCreatingCust] = useState(false);

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const response = await fetch('${API_BASE_URL}/api/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
        if (data.length > 0) {
          setCustomerId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCust(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone || !newCustAddress) {
      alert('Please fill out customer name, phone and address.');
      return;
    }

    setIsCreatingCust(true);
    try {
      const response = await fetch('${API_BASE_URL}/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCustName,
          phone: newCustPhone,
          address: newCustAddress,
          email: newCustEmail || null
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create customer');

      setCustomers(prev => [data, ...prev]);
      setCustomerId(data.id);
      setShowAddCustomer(false);
      
      // Reset form
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setNewCustEmail('');
      alert('Customer created and selected successfully!');
    } catch (err: any) {
      alert(err.message || 'Error creating customer');
    } finally {
      setIsCreatingCust(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !furnitureType || !dimensions || !quantity || !estimatedCost || !estimatedDeliveryDate) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('${API_BASE_URL}/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId,
          furnitureType,
          category,
          woodType,
          dimensions,
          quantity,
          estimatedCost,
          estimatedDeliveryDate,
          designer,
          assignedCarpenter,
          notes
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create production order');

      navigate('/orders');
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 text-left max-w-4xl mx-auto">
      {/* Back to registry */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Register New Production Order</h1>
          <p className="text-xs text-slate-400">Initialize design parameters and configure stage-based workflow tracks.</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold leading-relaxed">
          {error}
        </div>
      )}

      {/* Main Form Box */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-6 space-y-6 shadow-sm">
        
        {/* Customer Link Group */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">1. Customer Link</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Select Customer *</label>
              {loadingCust ? (
                <div className="h-10 bg-slate-50 dark:bg-slate-800 rounded-xl shimmer" />
              ) : (
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 cursor-pointer"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 h-[38px]"
            >
              <UserPlus size={14} /> New Client
            </button>
          </div>
        </div>

        {/* Furniture Specifications */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">2. Furniture Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Furniture Item Name *</label>
              <input
                type="text"
                required
                value={furnitureType}
                onChange={e => setFurnitureType(e.target.value)}
                placeholder="e.g. Royal Teak Wardrobe"
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 cursor-pointer"
              >
                <option value="Living Room">Living Room</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Bedroom">Bedroom</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Office">Office</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Wood Type *</label>
              <select
                value={woodType}
                onChange={e => setWoodType(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 cursor-pointer"
              >
                <option value="Teak">Teak</option>
                <option value="Rosewood">Rosewood</option>
                <option value="Mahogany">Mahogany</option>
                <option value="Walnut">Walnut</option>
                <option value="Oak">Oak</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Dimensions (LxWxH) *</label>
              <input
                type="text"
                required
                value={dimensions}
                onChange={e => setDimensions(e.target.value)}
                placeholder="e.g. 6ft x 3ft x 2.5ft"
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Quantity *</label>
              <input
                type="number"
                required
                min={1}
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value, 10))}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Estimated Cost (₹) *</label>
              <input
                type="number"
                required
                value={estimatedCost}
                onChange={e => setEstimatedCost(e.target.value)}
                placeholder="e.g. 75000"
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Team Allocation */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">3. Schedule & Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Target Delivery Date *</label>
              <input
                type="date"
                required
                value={estimatedDeliveryDate}
                onChange={e => setEstimatedDeliveryDate(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Assigned Designer</label>
              <input
                type="text"
                value={designer}
                onChange={e => setDesigner(e.target.value)}
                placeholder="e.g. Praveen Rao"
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Assigned Carpenter</label>
              <input
                type="text"
                value={assignedCarpenter}
                onChange={e => setAssignedCarpenter(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Project Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Production Specifications & Custom Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="Type any wood grain requirements, fabric choices, lock types, or custom carving notes here..."
            className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100 transition-colors"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-1.5 text-xs font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving Order...
              </>
            ) : (
              <>
                <Save size={14} /> Register Order
              </>
            )}
          </button>
        </div>

      </form>

      {/* Quick Customer Creation Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4 shadow-xl">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <UserPlus size={18} className="text-blue-500" /> Create Client Profile
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Add a new buyer directory record to associate with this order.</p>
            </div>
            
            <form onSubmit={handleAddCustomerSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="e.g. Venkata Swamy"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9848022338"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={e => setNewCustEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  placeholder="e.g.miyapur main road, Hyderabad"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCust}
                  className="btn-primary text-xs font-semibold flex items-center gap-1.5"
                >
                  {isCreatingCust ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={12} /> Save Client
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
