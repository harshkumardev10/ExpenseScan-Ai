import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Capture from './components/Capture';
import ReviewTable from './components/ReviewTable';
import ShareView from './components/ShareView';
import InstallPrompt from './components/InstallPrompt';
import { exportExpensesToExcel } from './services/excelService';
import { 
  saveSheetToFirestore, 
  loadAllSheetsFromFirestore, 
  deleteSheetFromFirestore 
} from './services/firebaseService';

const LOCAL_STORAGE_KEY = 'expense_scan_history';

export default function App() {
  const [activeView, setActiveView] = useState('home'); // 'home', 'capture', 'review'
  const [scanHistory, setScanHistory] = useState([]);
  const [activeScan, setActiveScan] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Load history from Firestore (sync to local)
  useEffect(() => {
    if (location.pathname === '/') {
      syncHistory();
    }
  }, [location.pathname]);

  const syncHistory = async () => {
    setSyncing(true);
    try {
      const dbSheets = await loadAllSheetsFromFirestore();
      setScanHistory(dbSheets);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dbSheets));
    } catch (error) {
      console.error("Failed to sync history from Firestore, falling back to local:", error);
      // Fallback to local storage if offline
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setScanHistory(JSON.parse(stored));
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleNavigate = (view) => {
    setActiveView(view);
  };

  const handleScanSuccess = async (newScan) => {
    // Add default meta values matching your spreadsheet headers
    const scanToSave = {
      ...newScan,
      meta: {
        employeeName: 'SURENDRA KUMAR',
        designation: 'Sr,RSM',
        fromDate: '01/06/2026',
        toDate: '30/06/2026'
      }
    };
    
    // Save locally
    const updatedHistory = [scanToSave, ...scanHistory];
    setScanHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
    
    // Save to Firestore
    try {
      await saveSheetToFirestore(scanToSave);
    } catch (e) {
      console.error("Failed to upload scan to Firestore:", e);
    }

    setActiveScan(scanToSave);
    setActiveView('review');
  };

  const handleSaveScan = async (scanId, updatedData) => {
    const updatedHistory = scanHistory.map(scan => {
      if (scan.id === scanId) {
        const merged = {
          ...scan,
          name: updatedData.name,
          expenses: updatedData.expenses,
          meta: updatedData.meta || scan.meta || {},
          timestamp: Date.now()
        };
        // Upload updated sheet to firestore in background
        saveSheetToFirestore(merged).catch(console.error);
        return merged;
      }
      return scan;
    });
    
    setScanHistory(updatedHistory);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const handleDeleteScan = async (scanId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this scan? This action cannot be undone.");
    if (confirmDelete) {
      const updatedHistory = scanHistory.filter(scan => scan.id !== scanId);
      setScanHistory(updatedHistory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedHistory));
      
      // Delete from Firestore in background
      try {
        await deleteSheetFromFirestore(scanId);
      } catch (e) {
        console.error("Failed to delete scan from Firestore:", e);
      }

      if (activeScan && activeScan.id === scanId) {
        setActiveScan(null);
        setActiveView('home');
      }
    }
  };

  const handleExportScan = async (scan) => {
    await exportExpensesToExcel(scan.name, scan.expenses, scan.meta);
  };

  const handleSelectScan = (scan) => {
    setActiveScan(scan);
    setActiveView('review');
  };

  const MainDashboard = () => (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="glass-panel border-b border-slate-900 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => handleNavigate('home')} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform duration-200">
              ES
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-200 group-hover:text-white transition-colors">
              ExpenseScan
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-semibold rounded-full uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-blue-500 animate-spin' : 'bg-emerald-500 animate-pulse'}`}></span>
              {syncing ? 'Syncing Firebase...' : 'Firebase Connected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-4">
        {activeView === 'home' && (
          <Home
            scanHistory={scanHistory}
            onNavigate={handleNavigate}
            onDeleteScan={handleDeleteScan}
            onSelectScan={handleSelectScan}
            onExportScan={handleExportScan}
          />
        )}

        {activeView === 'capture' && (
          <Capture
            onBack={() => handleNavigate('home')}
            onScanSuccess={handleScanSuccess}
          />
        )}

        {activeView === 'review' && (
          <ReviewTable
            activeScan={activeScan}
            onBack={() => handleNavigate('home')}
            onSaveScan={handleSaveScan}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900/60 text-center text-slate-655 text-xs mt-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ExpenseScan. Cloud sync powered by Firebase Firestore.</p>
          <div className="flex gap-4 text-slate-500 font-medium">
            <span>made with harsh</span>
          </div>
        </div>
      </footer>
    </div>
  );

  return (
    <>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/sheet/:id" element={<ShareView />} />
      </Routes>
      <InstallPrompt />
    </>
  );
}
