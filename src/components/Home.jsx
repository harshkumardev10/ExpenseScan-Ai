import React from 'react';
import { Camera, FileSpreadsheet, Trash2, ChevronRight, AlertCircle } from 'lucide-react';

export default function Home({ scanHistory, onNavigate, onDeleteScan, onSelectScan, onExportScan }) {
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col justify-between">
      
      {/* Welcome Banner */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          ExpenseScan
        </h1>
        <p className="mt-2 text-slate-400 font-medium max-w-md mx-auto">
          Scan paper expense sheets using Gemini AI and immediately convert them into editable spreadsheets.
        </p>
      </div>

      {/* Main CTA */}
      <div className="mb-10 text-center">
        <button
          onClick={() => onNavigate('capture')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-8 py-5 rounded-2xl shadow-xl hover:shadow-blue-900/30 transform hover:-translate-y-0.5 transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 text-lg"
          id="btn-scan-new-sheet"
        >
          <Camera className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          Scan New Sheet
        </button>
      </div>

      {/* Scanned History List */}
      <div className="flex-1 flex flex-col min-h-[300px]">
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>Previous Scans</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
            {scanHistory.length}
          </span>
        </h2>

        {scanHistory.length === 0 ? (
          /* Empty State */
          <div className="flex-1 glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 mb-4 border border-slate-800">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300">No Sheets Scanned Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              Your scanned expenses will appear here. Press the scan button above to capture your first sheet.
            </p>
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {scanHistory.map((scan) => {
              return (
                <div 
                  key={scan.id}
                  className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div 
                    onClick={() => { onSelectScan(scan); onNavigate('review'); }}
                    className="flex-1 cursor-pointer w-full"
                  >
                    <div className="flex justify-between sm:justify-start items-center gap-3">
                      <h4 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {scan.name || "Unnamed Scan"}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                      <span>{formatDate(scan.timestamp)}</span>
                      <span className="hidden sm:inline text-slate-700">•</span>
                      <span>{scan.expenses.length} row{scan.expenses.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t border-slate-800/50 sm:border-t-0 pt-3 sm:pt-0">
                    <button
                      onClick={() => onExportScan(scan)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-emerald-950 hover:text-emerald-400 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl transition-all text-sm font-medium"
                      title="Export to Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="sm:hidden">Export</span>
                    </button>
                    <button
                      onClick={() => { onSelectScan(scan); onNavigate('review'); }}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-blue-950 hover:text-blue-400 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-xl transition-all text-sm font-medium"
                      title="View / Edit"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => onDeleteScan(scan.id)}
                      className="inline-flex items-center justify-center bg-slate-900 hover:bg-rose-950 hover:text-rose-400 border border-slate-800 text-slate-400 p-2.5 rounded-xl transition-all"
                      title="Delete Scan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
        <span>All sheets are synced in real-time to Firebase Firestore cloud database</span>
      </div>
    </div>
  );
}
