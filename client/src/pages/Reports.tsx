import React, { useState } from "react";
import { useToast } from "../components/Toast";
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  Boxes,
  Award,
  Sparkles,
  ClipboardList,
  Activity,
  Play,
} from "lucide-react";

export const Reports: React.FC = () => {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState("Monthly");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const reportTypes = [
    {
      id: "production",
      title: "Woodwork Production Summary",
      desc: "Logs completed furniture items, stage bottlenecks, average completion times and delayed order indicators.",
      icon: ClipboardList,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      id: "revenue",
      title: "Revenue & Fabrication Billing",
      desc: "Financial billing audit logs, profit margins, estimated cost versus final invoice margins and supplier costs.",
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    {
      id: "inventory",
      title: "Inventory Stock Refill Log",
      desc: "Track raw material purchases, stock levels, usage values and upcoming minimum threshold triggers.",
      icon: Boxes,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    {
      id: "productivity",
      title: "Artisan Productivity Ledger",
      desc: "Operator attendance patterns, average stage completion rate scores, and woodcrafting quality ratings.",
      icon: Award,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    },
  ];

  const handleDownload = (id: string, title: string, type: "PDF" | "EXCEL") => {
    setGeneratingId(`${id}-${type}`);
    toast("Generating Report", `Processing database logs for: ${title}`, "info");

    setTimeout(() => {
      setGeneratingId(null);
      // Simulate file download
      const element = document.createElement("a");
      const file = new Blob([`SVS Furniture Works - ${title} (${timeframe})\n\nReport generated: ${new Date().toLocaleString()}\nThis is a simulated ${type} export data sheet.`], {
        type: "text/plain",
      });
      element.href = URL.createObjectURL(file);
      element.download = `SVS_${title.replace(/\s+/g, "_")}_${timeframe}_${new Date().toISOString().slice(0, 10)}.${type === "PDF" ? "pdf" : "xlsx"}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast("Download Completed", `${title} successfully downloaded as ${type}.`, "success");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-app-text-muted mt-1">
            Export production metrics and operational statements to PDF/Excel files.
          </p>
        </div>

        {/* Timeframe picker */}
        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-1 rounded-xl shadow-xs">
          {["Daily", "Weekly", "Monthly", "Yearly"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                timeframe === t
                  ? "bg-slate-900 text-white dark:bg-slate-800"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((rep) => {
          const isPdfGen = generatingId === `${rep.id}-PDF`;
          const isXlsGen = generatingId === `${rep.id}-EXCEL`;

          return (
            <div
              key={rep.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-[18px] border border-slate-200 dark:border-slate-850 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${rep.color}`}>
                    <rep.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    {rep.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-4">
                  {rep.desc}
                </p>
              </div>

              <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                <button
                  onClick={() => handleDownload(rep.id, rep.title, "PDF")}
                  disabled={generatingId !== null}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  {isPdfGen ? "Compiling..." : "Export PDF"}
                </button>
                <button
                  onClick={() => handleDownload(rep.id, rep.title, "EXCEL")}
                  disabled={generatingId !== null}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                  {isXlsGen ? "Packaging..." : "Export Excel"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
