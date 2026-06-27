import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Search, Sparkles, LayoutDashboard, PlusCircle, KanbanSquare, PackageCheck, Boxes, Users, Briefcase, Settings } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    { name: "Go to Dashboard", path: "/", icon: LayoutDashboard, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM", "SUPERVISOR", "QUALITY_INSPECTOR", "WORKER"] },
    { name: "Create New Order", path: "/orders/new", icon: PlusCircle, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM"] },
    { name: "View Production Orders", path: "/orders", icon: KanbanSquare, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR", "QUALITY_INSPECTOR"] },
    { name: "Workflow Stage Board", path: "/workflow", icon: KanbanSquare, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR", "WORKER"] },
    { name: "Quality Inspections", path: "/quality", icon: PackageCheck, roles: ["ADMIN", "PRODUCTION_MANAGER", "QUALITY_INSPECTOR"] },
    { name: "Check Material Inventory", path: "/inventory", icon: Boxes, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR"] },
    { name: "Customer CRM", path: "/customers", icon: Users, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM"] },
    { name: "Employee Productivity", path: "/employees", icon: Briefcase, roles: ["ADMIN", "PRODUCTION_MANAGER", "SUPERVISOR"] },
    { name: "System Settings", path: "/settings", icon: Settings, roles: ["ADMIN", "PRODUCTION_MANAGER", "SALES_TEAM", "SUPERVISOR", "QUALITY_INSPECTOR"] },
  ];

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(query.toLowerCase()) &&
      (!user || cmd.roles.includes(user.role))
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length)
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          navigate(filteredCommands[selectedIndex].path);
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or route..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-white text-sm placeholder-slate-400"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-400 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-64 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Sparkles className="w-8 h-8 text-slate-300" />
              <span>No commands found matching "{query}"</span>
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.name}
                  onClick={() => {
                    navigate(cmd.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  <span className="flex-1">{cmd.name}</span>
                  {isSelected && (
                    <span className="text-[10px] bg-blue-500/30 text-white px-2 py-0.5 rounded-md">
                      Go
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
