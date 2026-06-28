import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Coins,
  TrendingDown,
  Warehouse,
  Save,
  Loader2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  woodType?: string;
  supplier?: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
  costPerUnit: number;
  purchaseDate: string;
}

export const RawMaterial: React.FC = () => {
  const { token, user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);

  // New Item form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wood');
  const [woodType, setWoodType] = useState('');
  const [supplier, setSupplier] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [unit, setUnit] = useState('CFT');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Adjust stock form states
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustAction, setAdjustAction] = useState<'IN' | 'OUT'>('IN');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchInventory = async () => {
    if (!token) return;
    try {
      const response = await fetch('${API_BASE_URL}/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !currentStock || !lowStockThreshold || !unit || !costPerUnit) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('${API_BASE_URL}/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          category,
          woodType: category === 'Wood' ? woodType : null,
          supplier: supplier || null,
          currentStock,
          lowStockThreshold,
          unit,
          costPerUnit
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add item');

      setItems(prev => [...prev, data]);
      setShowAddModal(false);
      
      // Reset form
      setName('');
      setCategory('Wood');
      setWoodType('');
      setSupplier('');
      setCurrentStock('');
      setLowStockThreshold('');
      setUnit('CFT');
      setCostPerUnit('');
      alert('Inventory item created successfully!');
    } catch (err: any) {
      alert(err.message || 'Error creating inventory item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setActiveItem(item);
    setAdjustQty('');
    setAdjustAction('IN');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !adjustQty || !token) return;

    setIsAdjusting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/inventory/${activeItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: adjustQty,
          action: adjustAction
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to adjust stock');

      setItems(prev => prev.map(item => (item.id === activeItem.id ? data : item)));
      setShowAdjustModal(false);
      alert(`Stock level adjusted successfully!`);
    } catch (err: any) {
      alert(err.message || 'Error adjusting stock levels');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Calculations
  const lowStockItems = items.filter(item => item.currentStock <= item.lowStockThreshold);
  const totalValuation = items.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);

  return (
    <div className="p-6 space-y-6 text-left">
      {/* Header and Add button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Raw Material Inventory</h1>
          <p className="text-xs text-slate-400">Track and adjust stock levels for furniture manufacturing supplies.</p>
        </div>
        {['ADMIN', 'PRODUCTION_MANAGER'].includes(user?.role || '') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus size={14} /> Add Raw Material
          </button>
        )}
      </div>

      {/* Visual Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Inventory Value</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">₹{totalValuation.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Across all warehouse categories</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
            <Coins size={20} />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Critical Low stock</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{lowStockItems.length} Items</h3>
            {lowStockItems.length > 0 ? (
              <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                <AlertTriangle size={10} /> Sourcing delays possible
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-bold">All items healthy</span>
            )}
          </div>
          <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Unique SKU Registry</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">{items.length} materials</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Active stock items</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
            <Warehouse size={20} />
          </div>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full enterprise-table text-left border-collapse">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Category</th>
                <th>Supplier Brand</th>
                <th>Current Stock</th>
                <th>Alert Threshold</th>
                <th>Cost Per Unit</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="shimmer h-16"><td colSpan={7}></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs font-semibold">
                    No materials registered in inventory.
                  </td>
                </tr>
              ) : (
                items.map(item => {
                  const isLow = item.currentStock <= item.lowStockThreshold;
                  return (
                    <tr key={item.id}>
                      <td className="font-extrabold text-slate-800 dark:text-slate-200">
                        {item.name} {item.woodType && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal px-2 py-0.5 rounded ml-1.5">{item.woodType}</span>}
                      </td>
                      <td>
                        <span className="font-semibold text-slate-500">{item.category}</span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-400">
                        {item.supplier || 'N/A'}
                      </td>
                      <td>
                        <span className={`font-black ${isLow ? 'text-red-500 flex items-center gap-1' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.currentStock} {item.unit}
                          {isLow && <AlertTriangle size={12} className="text-red-500" />}
                        </span>
                      </td>
                      <td className="font-semibold text-slate-500">
                        {item.lowStockThreshold} {item.unit}
                      </td>
                      <td className="font-semibold text-slate-700 dark:text-slate-300">
                        ₹{item.costPerUnit.toLocaleString('en-IN')} / {item.unit}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleOpenAdjustModal(item)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline bg-blue-50/50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20"
                        >
                          <Boxes size={12} /> Stock Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Material Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4 shadow-xl">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Register Raw Material Item</h3>
              <p className="text-[10px] text-slate-400 mt-1">Configure stock thresholds and catalog classifications.</p>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Premium Teak Wood 4x4"
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                  >
                    <option value="Wood">Wood</option>
                    <option value="Plywood">Plywood</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Paint">Paint</option>
                    <option value="Polish">Polish</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                {category === 'Wood' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Wood Type</label>
                    <input
                      type="text"
                      value={woodType}
                      onChange={e => setWoodType(e.target.value)}
                      placeholder="e.g. Teak, Mahogany"
                      className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Stock Unit *</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="e.g. CFT, Sheets, Litres"
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Cost Per Unit (₹) *</label>
                  <input
                    type="number"
                    required
                    value={costPerUnit}
                    onChange={e => setCostPerUnit(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Initial Stock *</label>
                  <input
                    type="number"
                    required
                    value={currentStock}
                    onChange={e => setCurrentStock(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Low Limit Alert *</label>
                  <input
                    type="number"
                    required
                    value={lowStockThreshold}
                    onChange={e => setLowStockThreshold(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Supplier Brand Details</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="e.g. Asian Paints Depot"
                    className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                  />
                </div>
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
                      Save Material
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock level modal */}
      {showAdjustModal && activeItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4 shadow-xl">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Adjust Stock Level</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Record material check-ins or usage for **{activeItem.name}**. Current Stock: {activeItem.currentStock} {activeItem.unit}.
              </p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAdjustAction('IN')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                    adjustAction === 'IN' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ArrowUpRight size={14} /> Stock In (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction('OUT')}
                  className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                    adjustAction === 'OUT' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <ArrowDownRight size={14} /> Stock Out (-)
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-350 block mb-1">Adjustment Quantity ({activeItem.unit}) *</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  value={adjustQty}
                  onChange={e => setAdjustQty(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full text-xs py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="btn-primary text-xs font-semibold flex items-center gap-1.5"
                >
                  {isAdjusting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Adjusting...
                    </>
                  ) : (
                    <>
                      Apply Adjustment
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
