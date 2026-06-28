import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Columns,
  Boxes,
  Hammer,
  Paintbrush,
  ShieldCheck,
  Truck,
  Plus,
  Clock,
  Eye,
  AlertTriangle
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  furnitureType: string;
  category: string;
  woodType: string;
  dimensions: string;
  quantity: number;
  status: string;
  progressPercentage: number;
  estimatedCost: number;
  estimatedDeliveryDate: string;
  customer?: { name: string };
  stages: Array<{ id: string; stageName: string; status: string }>;
}

interface Column {
  id: string;
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  statuses: string[];
}

export const Kanban: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const columns: Column[] = [
    {
      id: 'design',
      title: 'Design Approved',
      icon: Columns,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/5',
      borderColor: 'border-blue-500/20',
      statuses: ['DESIGN_APPROVED']
    },
    {
      id: 'materials',
      title: 'Prep & Materials',
      icon: Boxes,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/5',
      borderColor: 'border-amber-500/20',
      statuses: ['RAW_MATERIAL_SOURCED']
    },
    {
      id: 'fabrication',
      title: 'Fabrication',
      icon: Hammer,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/5',
      borderColor: 'border-orange-500/20',
      statuses: ['CARPENTRY', 'ASSEMBLY']
    },
    {
      id: 'finishing',
      title: 'Finishing & Polish',
      icon: Paintbrush,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/5',
      borderColor: 'border-violet-500/20',
      statuses: ['FINISHING', 'POLISHING']
    },
    {
      id: 'inspection',
      title: 'QC & Inspection',
      icon: ShieldCheck,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/5',
      borderColor: 'border-purple-500/20',
      statuses: ['QUALITY_CHECK', 'QC_PENDING', 'PACKAGING']
    },
    {
      id: 'logistics',
      title: 'Logistics / Ready',
      icon: Truck,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/5',
      borderColor: 'border-emerald-500/20',
      statuses: ['READY', 'READY_FOR_DISPATCH', 'DELIVERED']
    }
  ];

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const response = await fetch('${API_BASE_URL}/api/workflow/kanban', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  // Drag and Drop simulation functions
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('text/plain');
    const targetColumn = columns.find(c => c.id === targetColId);
    
    if (!targetColumn) return;

    // Determine the primary status to apply
    // If multiple are available, pick the first one (e.g. CARPENTRY for fabrication)
    const nextStatus = targetColumn.statuses[0];

    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (order.status === nextStatus) return; // No change

    // Optimistically update UI
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      fetchOrders(); // Refresh to sync stages
    } catch (err) {
      console.error(err);
      alert('Error updating order workflow status.');
      fetchOrders(); // Rollback UI
    }
  };

  return (
    <div className="p-6 space-y-6 text-left select-none">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Live Workflow Tracker</h1>
        <p className="text-xs text-slate-400">Drag and drop orders between milestones to transition production stages.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] shimmer" />
          ))}
        </div>
      ) : (
        /* Kanban Columns Container */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start overflow-x-auto min-h-[calc(100vh-200px)] pb-6">
          {columns.map(column => {
            const ColumnIcon = column.icon;
            // Filter orders belonging to this column based on status list
            const columnOrders = orders.filter(o => column.statuses.includes(o.status));

            return (
              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, column.id)}
                className={`flex flex-col rounded-[18px] border p-3 min-h-[480px] w-full min-w-[180px] ${column.bgColor} ${column.borderColor}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <ColumnIcon size={14} className={column.color} />
                    <h3 className="font-extrabold text-[11px] text-slate-700 dark:text-slate-350 truncate uppercase tracking-wider">{column.title}</h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                  {columnOrders.length === 0 ? (
                    <div className="h-32 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-semibold">
                      Drop orders here
                    </div>
                  ) : (
                    columnOrders.map(order => {
                      const isLate = new Date(order.estimatedDeliveryDate).getTime() < Date.now() && order.status !== 'DELIVERED';
                      return (
                        <div
                          key={order.id}
                          draggable
                          onDragStart={e => handleDragStart(e, order.id)}
                          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[10px] text-blue-600 dark:text-blue-400">
                              {order.orderNumber}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">{order.progressPercentage}%</span>
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate leading-normal">
                              {order.furnitureType}
                            </h4>
                            <span className="text-[9px] text-slate-400 block truncate">
                              Client: {order.customer?.name}
                            </span>
                          </div>

                          {/* Progress bar visual */}
                          <div className="w-full bg-slate-100 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${order.progressPercentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider pt-1 border-t border-slate-50 dark:border-slate-850/80">
                            {isLate ? (
                              <span className="text-red-500 flex items-center gap-0.5">
                                <AlertTriangle size={10} /> Overdue
                              </span>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-0.5">
                                <Clock size={10} /> {new Date(order.estimatedDeliveryDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <Link
                              to={`/orders/${order.id}`}
                              className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
                            >
                              Details <Eye size={10} />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
