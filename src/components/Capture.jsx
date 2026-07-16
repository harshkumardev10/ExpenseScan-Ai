import React, { useState, useRef } from 'react';
import { Camera, Upload, ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { scanExpenseImage } from '../services/ocrService';

export default function Capture({ onBack, onScanSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sheetName, setSheetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported file format. Please upload a JPG, JPEG, or PNG image.");
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    if (!sheetName) {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      setSheetName(`Scan - ${dateStr} ${timeStr}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setOcrProgress(0);
    setError(null);

    try {
      // Execute OCR engine
      const rawExpenses = await scanExpenseImage(selectedFile, '', (progress) => {
        setOcrProgress(progress);
      });

      // Map sNo → date, set default from = FIROZABAD
      const expenses = rawExpenses.map(r => ({
        ...r,
        date: r.date || r.sNo || '',
        from: r.from || 'FIROZABAD',
        mode: r.mode || '',
        km:   r.km   || '',
        fareA: r.fareA || '',
        fareB: r.fareB || '',
      }));

      onScanSuccess({
        id: `scan-${Date.now()}`,
        name: sheetName.trim() || 'Untitled Expense Sheet',
        timestamp: Date.now(),
        expenses,
        image: imagePreview
      });
    } catch (err) {
      setError(err.message || "OCR analysis failed. Please try again with a clearer image or manually add rows.");
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
  };

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          disabled={loading}
          className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-200">Scan Expense Sheet</h2>
          <p className="text-xs text-slate-400">Perform local OCR text extraction directly in your browser</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Scan Failed: </span>
            {error}
          </div>
        </div>
      )}

      {loading ? (
        /* Progress Screen */
        <div className="flex-1 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-6 min-h-[400px]">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border border-blue-500/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
            <div className="absolute inset-0 border border-blue-500/30 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">Analyzing Image Locally</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto">
              Running Tesseract OCR to read text columns without sending data to servers.
            </p>
            {/* Progress Bar */}
            <div className="w-48 bg-slate-800 h-2.5 rounded-full mx-auto mt-5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              ></div>
            </div>
            <span className="block text-xs font-semibold text-blue-400 mt-2">{ocrProgress}% complete</span>
          </div>
        </div>
      ) : imagePreview ? (
        /* Image Preview Screen */
        <div className="flex-1 flex flex-col gap-6">
          <div className="relative h-60 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            <img
              src={imagePreview}
              alt="Scan preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="sheet-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Sheet Name / Label
              </label>
              <input
                type="text"
                id="sheet-name"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="e.g. June Expenses"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={resetSelection}
                className="flex-1 border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900 hover:text-white py-4 rounded-xl transition-all text-sm font-semibold active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retake / Change
              </button>
              
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-900/30 transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
              >
                Start OCR Scan
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Capture Area Screen */
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Mobile Camera CTA */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-8 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-3 transition-all duration-200 active:scale-95 border border-blue-500/10 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <div className="p-3 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
              <Camera className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="block text-lg font-bold">Use Device Camera</span>
              <span className="block text-xs text-blue-200 mt-0.5 font-normal">Take a clear, straight photo of the sheet</span>
            </div>
          </button>

          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-slate-850"></div>
            <span className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Or</span>
            <div className="flex-1 border-t border-slate-850"></div>
          </div>

          {/* Desktop/File Upload Drag-and-Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-5 sm:p-8 text-center cursor-pointer transition-all duration-250 min-h-[140px] sm:min-h-[220px] ${
              isDragOver 
                ? 'border-blue-500 bg-blue-950/20 text-blue-300' 
                : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:bg-slate-900/50'
            }`}
          >
            <Upload className={`w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 transition-transform duration-200 ${isDragOver ? 'scale-110 text-blue-400' : 'text-slate-500'}`} />
            <p className="font-semibold text-slate-350 text-sm sm:text-base">Upload Image File</p>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
              Drag & drop your JPG, JPEG, or PNG here, or click to browse files
            </p>
          </div>

          {/* Hidden inputs */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
