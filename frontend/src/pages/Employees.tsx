import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Phone,
  Mail,
  UserCheck,
  Edit,
  Save,
  Loader2
} from 'lucide-react';

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  attendanceStatus: string;
  performanceScore: number;
  stagesAssigned: Array<{ id: string; stageName: string; status: string; order: { orderNumber: string; status: string } }>;
}

export const Employees: React.FC = () => {
  const { token, user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [selectedEmp, setSelectedEmp] = useState<EmployeeItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [attendance, setAttendance] = useState('PRESENT');
  const [score, setScore] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchEmployees = async () => {
    if (!token) return;
    try {
      const response = await fetch('${API_BASE_URL}/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  const handleOpenEdit = (emp: EmployeeItem) => {
    setSelectedEmp(emp);
    setAttendance(emp.attendanceStatus);
    setScore(String(emp.performanceScore));
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !token) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${selectedEmp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          attendanceStatus: attendance,
          performanceScore: score
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update employee');

      setEmployees(prev => prev.map(emp => (emp.id === selectedEmp.id ? { ...emp, ...data } : emp)));
      setShowEditModal(false);
      alert('Employee details adjusted successfully!');
    } catch (err: any) {
      alert(err.message || 'Error updating employee details');
    } finally {
      setIsSaving(false);
    }
  };

  const getAttendanceBadge = (status: string) => {
    if (status === 'PRESENT') return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    if (status === 'ABSENT') return 'bg-red-500/10 text-red-500 border border-red-500/20';
    return 'bg-amber-500/10 text-amber-500 border border-amber-500/20'; // ON_LEAVE
  };

  const getAttendanceIcon = (status: string) => {
    if (status === 'PRESENT') return <CheckCircle size={12} />;
    if (status === 'ABSENT') return <XCircle size={12} />;
    return <Clock size={12} />;
  };

  return (
    <div className="p-6 space-y-6 text-left">
      <div>
        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Employee Resource Directory</h1>
        <p className="text-xs text-slate-400">Track worker attendance, manage active workloads, and review productivity scores.</p>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] shimmer" />
          ))
        ) : employees.length === 0 ? (
          <div className="col-span-full text-center text-slate-400 py-12">No employee roster records registered.</div>
        ) : (
          employees.map(emp => (
            <div key={emp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[18px] p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              
              {/* Header profile */}
              <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(emp.name)}`}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full border border-blue-500/30"
                  />
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{emp.name}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">{emp.role}</span>
                  </div>
                </div>

                <span className={`badge-status text-[8px] font-black flex items-center gap-1.5 ${getAttendanceBadge(emp.attendanceStatus)}`}>
                  {getAttendanceIcon(emp.attendanceStatus)} {emp.attendanceStatus.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-850/80 pt-3 text-xs leading-normal">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Productivity Score</span>
                  <span className="font-black text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <Award size={14} className="text-amber-500" /> {emp.performanceScore}%
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Tasks</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {emp.stagesAssigned.filter(s => s.status === 'IN_PROGRESS').length} Orders
                  </span>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-1.5 text-[10px] text-slate-500 font-semibold border-t border-slate-50 dark:border-slate-850/80 pt-3">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-slate-400" /> <span>{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-slate-400" /> <span>{emp.phone}</span>
                </div>
              </div>

              {/* Assigned lists */}
              <div className="space-y-1 pt-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Current Operations</span>
                <div className="flex flex-wrap gap-1">
                  {emp.stagesAssigned.filter(s => s.status === 'IN_PROGRESS').length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">No tasks currently in progress</span>
                  ) : (
                    emp.stagesAssigned
                      .filter(s => s.status === 'IN_PROGRESS')
                      .map(s => (
                        <span key={s.id} className="text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-md font-bold">
                          {s.order.orderNumber} ({s.stageName})
                        </span>
                      ))
                  )}
                </div>
              </div>

              {/* Edit button */}
              {['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR'].includes(user?.role || '') && (
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="absolute bottom-4 right-4 p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all"
                >
                  <Edit size={14} />
                </button>
              )}

            </div>
          ))
        )}
      </div>

      {/* Adjust Details Modal */}
      {showEditModal && selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-left space-y-4 shadow-xl">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Adjust Roster Status: {selectedEmp.name}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Modify worker attendance registries and operational scores.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 block mb-1">Attendance Status</label>
                <select
                  value={attendance}
                  onChange={e => setAttendance(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-355 block mb-1">Productivity Score (0-100%) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.5"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                      <Save size={12} /> Save Status
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
