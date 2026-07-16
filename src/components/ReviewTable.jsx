import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Download, Share2 } from 'lucide-react';
import { exportExpensesToExcel, isSpecialDay } from '../services/excelService';

/* ─── shared style constants (must match excelService.js exactly) ─── */
const BLUE      = '#1e5799';
const BLUE_B    = '#2a6db5';
const YELLOW    = '#FFFF00';
const RED       = '#cc0000';
const GREY_TOT  = '#d0d0d0';
const DATA_BOR  = '#c0c0c0';

/* column definitions */
const COLS = [
  { key: 'date',  label: 'DATE',                      w: 82  },
  { key: 'from',  label: 'FROM',                      w: 120 },
  { key: 'name',  label: 'TO',                        w: 230 },
  { key: 'mode',  label: 'MODE',                      w: 80  },
  { key: 'km',    label: 'KM.',                       w: 52  },
  { key: 'fareA', label: 'FARE A\n( TA )',            w: 90  },
  { key: 'fareB', label: 'FARE B\n(DA &Mobile exp.)', w: 118 },
  { key: 'total', label: 'TOTAL',                     w: 70  },
];
const DEL_W = 32;

/* inline editable cell */
const Cell = ({ value, onChange, placeholder, disabled, bold, color, upper, isMobile }) => (
  <input
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={disabled ? '' : (placeholder || '')}
    disabled={!!disabled}
    style={{
      width: '100%', border: 'none', background: 'transparent', outline: 'none',
      fontFamily: 'Arial, sans-serif', fontSize: 11,
      fontWeight: bold ? 700 : 400,
      textAlign: 'center', color: color || '#111',
      padding: isMobile ? '7px 4px' : '3px 4px', boxSizing: 'border-box',
      textTransform: upper ? 'uppercase' : 'none',
      cursor: disabled ? 'default' : 'text',
    }}
  />
);

/* blue info text input */
const InfoField = ({ label, value, onChange, w = 120, isMobile }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    width: isMobile ? 'calc(50% - 5px)' : '100%',
    minWidth: isMobile ? 'calc(50% - 5px)' : w, 
    maxWidth: isMobile ? 'calc(50% - 5px)' : w 
  }}>
    <span style={{ fontSize: 9, fontWeight: 700, color: '#b3d4ff', textTransform: 'uppercase', marginBottom: 2 }}>
      {label}
    </span>
    <input value={value} onChange={e => onChange(e.target.value)}
      style={{
        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
        color: '#fff', fontWeight: 700, fontSize: 11, padding: isMobile ? '6px 7px' : '3px 7px',
        borderRadius: 3, outline: 'none', fontFamily: 'Arial, sans-serif', width: '100%', boxSizing: 'border-box',
      }}
    />
  </div>
);

export default function ReviewTable({ activeScan, onBack, onSaveScan }) {
  const [expenses,    setExpenses]    = useState([]);
  const [sheetName,   setSheetName]   = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  
  // Share link modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied]                 = useState(false);

  const [empName,  setEmpName]  = useState('SURENDRA KUMAR');
  const [desig,    setDesig]    = useState('Sr,RSM');
  const [fromDate, setFromDate] = useState('01/06/2026');
  const [toDate,   setToDate]   = useState('30/06/2026');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeScan) {
      const rows = (activeScan.expenses || []).map(r => ({
        ...r,
        from:  r.from  || 'FIROZABAD',
        mode:  r.mode  || '',
        km:    r.km    || '',
        fareA: r.fareA || '',
        fareB: r.fareB || '',
      }));
      setExpenses(rows);
      setSheetName(activeScan.name || '');
      
      // Load meta fields if already saved in object
      if (activeScan.meta) {
        if (activeScan.meta.employeeName) setEmpName(activeScan.meta.employeeName);
        if (activeScan.meta.designation) setDesig(activeScan.meta.designation);
        if (activeScan.meta.fromDate) setFromDate(activeScan.meta.fromDate);
        if (activeScan.meta.toDate) setToDate(activeScan.meta.toDate);
      }
    }
  }, [activeScan]);

  const change = (id, field, val) =>
    setExpenses(expenses.map(r => r.id === id ? { ...r, [field]: val } : r));

  const addRow = () => setExpenses([...expenses, {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: '', from: 'FIROZABAD', name: '', mode: '', km: '', fareA: '', fareB: '',
  }]);

  const delRow = id => setExpenses(expenses.filter(r => r.id !== id));

  const save = async () => {
    await onSaveScan(activeScan.id, {
      name: sheetName.trim() || 'Untitled',
      expenses,
      meta: { employeeName: empName, designation: desig, fromDate, toDate }
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleShare = async () => {
    // Sync current changes to Firestore before opening share link
    const updatedData = {
      name: sheetName.trim() || 'Untitled',
      expenses,
      meta: { employeeName: empName, designation: desig, fromDate, toDate }
    };
    await onSaveScan(activeScan.id, updatedData);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/sheet/${activeScan?.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportSheet = async () => {
    try {
      await exportExpensesToExcel(sheetName || 'expense_statement', expenses,
        { employeeName: empName, designation: desig, fromDate, toDate });
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  /* running totals */
  const sumA = expenses.reduce((s, r) => s + (isSpecialDay(r.name) ? 0 : (parseInt(r.fareA) || 0)), 0);
  const sumB = expenses.reduce((s, r) => s + (isSpecialDay(r.name) ? 0 : (parseInt(r.fareB) || 0)), 0);
  const sumT = sumA + sumB;

  const tableW = COLS.reduce((s, c) => s + c.w, 0) + DEL_W;
  const gridCols = COLS.map(c => c.w + 'px').join(' ') + ` ${DEL_W}px`;

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '14px 8px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── action bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: isMobile ? '100%' : 'auto' }}>
          <button onClick={onBack} style={{ padding: 8, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            <ArrowLeft size={18} />
          </button>
          <input value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="Sheet Label"
            style={{ flex: isMobile ? 1 : 'none', background: 'transparent', border: 'none', borderBottom: '1px solid #334155', color: '#e2e8f0', fontWeight: 700, fontSize: 16, outline: 'none', padding: '2px 4px', width: isMobile ? 'auto' : '200px' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }}>
          <button onClick={handleShare}
            style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: isMobile ? '9px 10px' : '9px 18px', background: '#4f46e5', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, border: 'none' }}>
            <Share2 size={14} /> {isMobile ? 'Share' : 'Share Link'}
          </button>
          <button onClick={exportSheet}
            style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: isMobile ? '9px 10px' : '9px 18px', background: '#047857', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, border: 'none' }}>
            <Download size={14} /> {isMobile ? 'Excel' : 'Export Excel'}
          </button>
          <button onClick={save}
            style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: isMobile ? '9px 10px' : '9px 18px', background: saveSuccess ? '#059669' : '#2563eb', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, border: 'none' }}>
            <Save size={14} /> {saveSuccess ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Swipe/Scroll Hint for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-center gap-2 text-center text-xs text-indigo-400 bg-indigo-950/30 border border-indigo-900/50 py-2.5 px-4 rounded-xl">
          <span>↔</span>
          <span>Swipe left/right on the table to view and edit all columns</span>
        </div>
      )}

      {/* ══ SPREADSHEET PREVIEW ══════════════════════════════════════════════ */}
      <div style={{ overflowX: 'auto', borderRadius: 6, border: `1px solid ${BLUE}`, boxShadow: '0 6px 40px #0006' }}>
        <div style={{ minWidth: tableW, fontFamily: 'Arial, sans-serif' }}>

          {/* Row 0: AUSTRO LAB LIMITED */}
          <div style={{ background: BLUE, textAlign: 'center', padding: '11px 4px', borderBottom: `1px solid ${BLUE_B}` }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 3, textTransform: 'uppercase' }}>
              AUSTRO LAB LIMITED
            </span>
          </div>

          {/* Row 1: EXPENSE STATEMENT */}
          <div style={{ background: BLUE, textAlign: 'center', padding: '7px 4px', borderBottom: `1px solid ${BLUE_B}` }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
              EXPENSE STATEMENT
            </span>
          </div>

          {/* Row 2: Info bar (editable) */}
          <div style={{ background: BLUE, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? 8 : 14, padding: isMobile ? '12px 10px' : '8px 14px', borderBottom: `1px solid ${BLUE_B}` }}>
            <InfoField label="NAME"        value={empName}  onChange={setEmpName}  w={162} isMobile={isMobile} />
            <InfoField label="Designation" value={desig}    onChange={setDesig}    w={108} isMobile={isMobile} />
            <div style={{ display: 'flex', width: isMobile ? '100%' : 'auto', gap: 14, margin: isMobile ? '4px 0' : 0, justifyContent: isMobile ? 'flex-start' : 'center', alignItems: 'center', padding: isMobile ? '2px 4px' : '0' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>STATE : UP</span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>HQ :-FIROZBAD</span>
            </div>
            <InfoField label="FROM"        value={fromDate} onChange={setFromDate} w={100} isMobile={isMobile} />
            <InfoField label="TO"          value={toDate}   onChange={setToDate}   w={100} isMobile={isMobile} />
          </div>

          {/* Row 3: Column headers */}
          <div style={{ background: BLUE, display: 'grid', gridTemplateColumns: gridCols, borderBottom: `2px solid ${BLUE_B}` }}>
            {COLS.map(col => (
              <div key={col.key} style={{
                color: '#fff', fontWeight: 700, fontSize: 10, textAlign: 'center',
                padding: '9px 3px', borderRight: `1px solid ${BLUE_B}`,
                whiteSpace: 'pre-line', lineHeight: 1.25,
              }}>
                {col.label}
              </div>
            ))}
            <div />
          </div>

          {/* ── Data rows ── */}
          <div style={{ background: '#fff' }}>
            {expenses.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                No rows — scan an image or click "Add Row"
              </div>
            ) : expenses.map(row => {
              const special = isSpecialDay(row.name || '');
              const fareA   = parseInt(row.fareA || 0) || 0;
              const fareB   = parseInt(row.fareB || 0) || 0;
              const rowTot  = fareA + fareB;
              const bg      = special ? YELLOW : '#ffffff';
              const color   = special ? RED    : '#111111';

              return (
                <div key={row.id} style={{
                  display: 'grid', gridTemplateColumns: gridCols,
                  background: bg, borderBottom: `1px solid ${DATA_BOR}`,
                  borderLeft: special ? `3px solid ${RED}` : `3px solid transparent`,
                  alignItems: 'center',
                }}>
                  {/* DATE */}
                  <div style={{ borderRight: `1px solid ${DATA_BOR}` }}>
                    <Cell value={row.date} onChange={v => change(row.id, 'date', v)}
                      placeholder="DD/MM/YY" bold={special} color={color} isMobile={isMobile} />
                  </div>

                  {/* FROM */}
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, textAlign: 'center', padding: '2px 2px' }}>
                    {special
                      ? <span style={{ display: 'block', textAlign: 'center', color: RED, fontWeight: 700, fontSize: 11, padding: '3px 4px' }}>
                          {(row.name || '').toUpperCase()}…………
                        </span>
                      : <Cell value={row.from} onChange={v => change(row.id, 'from', v)}
                          upper bold color={color} isMobile={isMobile} />
                    }
                  </div>

                  {/* TO */}
                  <div style={{ borderRight: `1px solid ${DATA_BOR}` }}>
                    {!special &&
                      <Cell value={row.name} onChange={v => change(row.id, 'name', v)}
                        placeholder="e.g. HATHRAS+IGLAS" upper color={color} isMobile={isMobile} />
                    }
                  </div>

                  {/* MODE */}
                  <div style={{ borderRight: `1px solid ${DATA_BOR}` }}>
                    {!special && <Cell value={row.mode} onChange={v => change(row.id, 'mode', v)} placeholder="CAR" color={color} isMobile={isMobile} />}
                  </div>

                  {/* KM */}
                  <div style={{ borderRight: `1px solid ${DATA_BOR}` }}>
                    {!special && <Cell value={row.km} onChange={v => change(row.id, 'km', v)} placeholder="0" color={color} isMobile={isMobile} />}
                  </div>

                  {/* FARE A */}
                  <div style={{ borderRight: `1px solid ${DATA_BOR}` }}>
                    {!special && <Cell value={row.fareA} onChange={v => change(row.id, 'fareA', v)} placeholder="0" color={color} isMobile={isMobile} />}
                  </div>

                  {/* FARE B */}
                  <div style={{ borderRight: `1px solid ${DATA_BOR}` }}>
                    {!special && <Cell value={row.fareB} onChange={v => change(row.id, 'fareB', v)} placeholder="0" color={color} isMobile={isMobile} />}
                  </div>

                  {/* TOTAL (auto) */}
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, textAlign: 'center', padding: '3px 4px' }}>
                    {!special && rowTot > 0 &&
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{rowTot}</span>
                    }
                  </div>

                  {/* Delete */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => delRow(row.id)}
                      title="Delete row"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', display: 'flex' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── TOTAL row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, background: GREY_TOT, borderTop: '2px solid #555', alignItems: 'center' }}>
            <div style={{ gridColumn: '1 / 6', padding: '7px 12px', textAlign: 'right', fontWeight: 700, fontSize: 11, color: '#111', borderRight: `1px solid ${DATA_BOR}` }}>
              TOTAL
            </div>
            <div style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, fontSize: 11, color: '#111', borderRight: `1px solid ${DATA_BOR}` }}>
              {sumA || ''}
            </div>
            <div style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, fontSize: 11, color: '#111', borderRight: `1px solid ${DATA_BOR}` }}>
              {sumB || ''}
            </div>
            <div style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, fontSize: 11, color: '#111', borderRight: `1px solid ${DATA_BOR}` }}>
              {sumT || ''}
            </div>
            <div />
          </div>

          {/* ── Footer: add row + stats ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', background: '#0f172a', borderTop: '1px solid #1e293b', padding: '8px 12px' }}>
            <button onClick={addRow}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#cbd5e1', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <Plus size={13} /> Add Row
            </button>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>{expenses.length}</span> rows &nbsp;·&nbsp;
              <span style={{ color: '#facc15', fontWeight: 700 }}>
                {expenses.filter(r => isSpecialDay(r.name || '')).length}
              </span> special &nbsp;·&nbsp;
              Grand Total: <span style={{ color: '#34d399', fontWeight: 700 }}>₹{sumT.toLocaleString('en-IN')}</span>
            </span>
          </div>

        </div>
      </div>

      {/* ── Share Link Modal ── */}
      {showShareModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: '#0f172a', border: '1px solid #334155', borderRadius: 16,
            padding: 24, maxWidth: 460, width: '90%', display: 'flex', flexDirection: 'column', gap: 16,
            boxShadow: '0 10px 50px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔗 Shareable Sheet Link
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              Copy this link to share the sheet. Anyone with this link can view and export your formatted Excel sheet!
            </p>
            <div style={{ display: 'flex', gap: 8, background: '#020617', border: '1px solid #1e293b', padding: '8px 12px', borderRadius: 10, alignItems: 'center' }}>
              <input readOnly value={`${window.location.origin}/sheet/${activeScan?.id}`}
                style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 12, flex: 1, outline: 'none', fontWeight: 600 }} />
              <button onClick={copyToClipboard}
                style={{ padding: '6px 14px', background: '#3b82f6', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)}
              style={{ padding: '10px 0', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, color: '#cbd5e1', cursor: 'pointer', fontWeight: 600, fontSize: 12, hover: { background: '#334155' } }}>
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
