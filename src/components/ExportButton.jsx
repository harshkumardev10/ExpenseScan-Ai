import React, { useState } from 'react';
import { FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { exportExpensesToExcel } from '../services/excelService';

export default function ExportButton({ sheetName, expenses, className = "" }) {
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'

  const handleExport = () => {
    try {
      setStatus('exporting');
      
      const success = exportExpensesToExcel(sheetName || 'Expense Scan', expenses);
      
      if (success) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2500);
      } else {
        throw new Error("Failed to write XLSX file.");
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <button
      onClick={handleExport}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all px-5 py-3 rounded-xl shadow-md active:scale-95 ${
        status === 'success'
          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
          : status === 'error'
          ? 'bg-rose-600 text-white hover:bg-rose-500'
          : 'bg-slate-900 border border-slate-800 text-slate-350 hover:bg-slate-800 hover:text-white'
      } ${className}`}
    >
      {status === 'exporting' ? (
        <>
          <span className="w-4 h-4 border-2 border-slate-350 border-t-transparent rounded-full animate-spin"></span>
          <span>Exporting...</span>
        </>
      ) : status === 'success' ? (
        <>
          <Check className="w-4 h-4" />
          <span>Downloaded!</span>
        </>
      ) : status === 'error' ? (
        <>
          <AlertCircle className="w-4 h-4" />
          <span>Error Exporting</span>
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export to Excel</span>
        </>
      )}
    </button>
  );
}
