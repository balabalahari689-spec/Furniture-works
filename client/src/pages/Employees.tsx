import React, { useEffect, useState } from "react";
import { api } from "../services/api";
import { useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { Briefcase, UserCheck, Star, Award, TrendingUp, Edit3 } from "lucide-react";

export const Employees: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit employee states
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [dept, setDept] = useState("Carpentry");
  const [empStatus, setEmpStatus] = useState("ACTIVE");
  const [empAttendance, setEmpAttendance] = useState("PRESENT");
  const [productivity, setProductivity] = useState("90");
  const [editing, setEditing] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await api.get("/employees");
      setEmployees(data);
    } catch (e: any) {
      toast("Error", e.message || "Failed to load employee directory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEditClick = (emp: any) => {
    setSelectedEmp(emp);
    setDept(emp.department);
    setEmpStatus(emp.status);
    setEmpAttendance(emp.attendance);
    setProductivity(String(emp.productivity));
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setEditing(true);

    try {
      // Mock employee parameter updates
      // The API endpoint typically updates database properties
      const updatedList = employees.map((emp) => {
        if (emp.id === selectedEmp.id) {
          return {
            ...emp,
            department: dept,
            status: empStatus,
            attendance: empAttendance,
            productivity: parseFloat(productivity),
          };
        }
        return emp;
      });

      setEmployees(updatedList);
      toast("Employee Updated", `Successfully modified details for ${selectedEmp.user.name}`, "success");
      setSelectedEmp(null);
    } catch (e: any) {
      toast("Update Failed", e.message || "Failed to update employee fields", "error");
    } finally {
      setEditing(false);
    }
  };

  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const presentCount = employees.filter((e) => e.attendance === "PRESENT").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee Directory & Workshop logs</h1>
        <p className="text-xs text-app-text-muted mt-1">
          Monitor artisan roster, attendance logs, and productivity ratings.
        </p>
      </div>

      {/* Roster Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
              Total Roster Strength
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {employees.length} Operators
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
              Active Duty Today
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {presentCount} Present ({activeCount} Active)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block">
              Avg. Workshop Productivity
            </span>
            <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
              {(employees.reduce((acc, curr) => acc + curr.productivity, 0) / Math.max(1, employees.length)).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Roster List Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading operator directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 rounded-full capitalize">
                    {emp.department}
                  </span>
                  <div className="flex gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${emp.attendance === "PRESENT" ? "bg-emerald-500" : "bg-rose-500"}`} title={`Attendance: ${emp.attendance}`} />
                    <span className={`w-2.5 h-2.5 rounded-full ${emp.status === "ACTIVE" ? "bg-blue-500" : "bg-slate-350"}`} title={`Roster Status: ${emp.status}`} />
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-4">
                  {emp.user.name}
                </h3>
                <span className="text-[10px] text-slate-400 block mt-0.5">{emp.user.email}</span>

                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-250">
                      Productivity Rating
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    {emp.productivity}%
                  </span>
                </div>
              </div>

              {currentUser?.role === "ADMIN" && (
                <button
                  onClick={() => handleEditClick(emp)}
                  className="w-full mt-5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Modify Profile
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Operator Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="font-bold text-sm text-slate-950 dark:text-white">
                Modify Employee: {selectedEmp.user.name}
              </h3>
              <button
                onClick={() => setSelectedEmp(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Department
                  </label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  >
                    <option value="Carpentry">Carpentry</option>
                    <option value="Finishing">Finishing & Polish</option>
                    <option value="Quality">Quality QC</option>
                    <option value="Dispatch">Dispatch Logistics</option>
                    <option value="Design">Design Studio</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Productivity (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={productivity}
                    onChange={(e) => setProductivity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={empStatus}
                    onChange={(e) => setEmpStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Attendance
                  </label>
                  <select
                    value={empAttendance}
                    onChange={(e) => setEmpAttendance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LEAVE">Leave</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEmp(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl disabled:opacity-50"
                >
                  {editing ? "Saving..." : "Save Parameters"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
