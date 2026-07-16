import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSheetById } from '../services/firebaseService';
import { exportExpensesToExcel, isSpecialDay } from '../services/excelService';
import { Download, Loader2, AlertCircle } from 'lucide-react';

const BLUE     = '#1e5799';
const BLUE_B   = '#2a6db5';
const YELLOW   = '#FFFF00';
const RED      = '#cc0000';
const GREY_TOT = '#d0d0d0';
const DATA_BOR = '#c0c0c0';

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

export default function ShareView() {
  const { id }               = useParams();
  const [sheet, setSheet]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]    = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    getSheetById(id)
      .then(data => { setSheet(data); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }, [id]);

  const handleExport = async () => {
    if (!sheet) return;
    await exportExpensesToExcel(sheet.name || 'shared_sheet', sheet.expenses || [], {
      employeeName: sheet.meta?.employeeName,
      designation:  sheet.meta?.designation,
      fromDate:     sheet.meta?.fromDate,
      toDate:       sheet.meta?.toDate,
    });
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#fff', gap: 16 }}>
      <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 16, color: '#94a3b8' }}>Loading shared sheet…</span>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', color: '#fff', gap: 16 }}>
      <AlertCircle size={40} color="#f43f5e" />
      <span style={{ fontSize: 16, color: '#f43f5e' }}>Sheet not found or link expired.</span>
      <span style={{ fontSize: 13, color: '#64748b' }}>{error}</span>
    </div>
  );

  const expenses = sheet.expenses || [];
  const sumA = expenses.reduce((s, r) => s + (isSpecialDay(r.name) ? 0 : (parseInt(r.fareA) || 0)), 0);
  const sumB = expenses.reduce((s, r) => s + (isSpecialDay(r.name) ? 0 : (parseInt(r.fareB) || 0)), 0);
  const sumT = sumA + sumB;
  const tableW = COLS.reduce((s, c) => s + c.w, 0);
  const gridCols = COLS.map(c => c.w + 'px').join(' ');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', padding: isMobile ? '16px 8px' : '24px 12px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header bar */}
      <div style={{ maxWidth: 900, margin: '0 auto 16px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: 18 }}>📄 {sheet.name || 'Shared Sheet'}</span>
          <span style={{ color: '#475569', fontSize: 12 }}>
            Shared via ExpenseScan
          </span>
        </div>
        <button onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: isMobile ? '10px 16px' : '8px 16px', background: '#047857', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, border: 'none', width: isMobile ? '100%' : 'auto' }}>
          <Download size={14} /> Export Excel
        </button>
      </div>

      {/* Swipe/Scroll Hint for Mobile */}
      {isMobile && (
        <div style={{ maxWidth: 900, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '8px 12px', borderRadius: 8 }}>
          <span>↔</span>
          <span>Swipe left/right on the table to view all columns</span>
        </div>
      )}

      {/* Spreadsheet */}
      <div style={{ maxWidth: 900, margin: '0 auto', overflowX: 'auto', border: `1px solid ${BLUE}`, borderRadius: 6, boxShadow: '0 6px 40px #0006' }}>
        <div style={{ minWidth: tableW }}>

          {/* Row 1: Company */}
          <div style={{ background: BLUE, textAlign: 'center', padding: '11px 4px', borderBottom: `1px solid ${BLUE_B}` }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 3 }}>AUSTRO LAB LIMITED</span>
          </div>

          {/* Row 2: Statement */}
          <div style={{ background: BLUE, textAlign: 'center', padding: '7px 4px', borderBottom: `1px solid ${BLUE_B}` }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 2 }}>EXPENSE STATEMENT</span>
          </div>

          {/* Row 3: Info */}
          <div style={{ background: BLUE, display: 'flex', gap: isMobile ? 8 : 24, flexWrap: 'wrap', padding: isMobile ? '12px 10px' : '8px 14px', borderBottom: `1px solid ${BLUE_B}` }}>
            {[
              `NAME-${sheet.meta?.employeeName || ''}`,
              `Designation : ${sheet.meta?.designation || ''}`,
              'STATE : UP', 'HQ :-FIROZBAD',
              `FROM  ${sheet.meta?.fromDate || ''}`,
              `TO ${sheet.meta?.toDate || ''}`
            ].map((t, i) => (
              <span key={i} style={{ 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: 11,
                width: isMobile ? (i < 2 || i >= 4 ? 'calc(50% - 4px)' : 'auto') : 'auto',
                margin: isMobile ? '2px 0' : '0'
              }}>{t}</span>
            ))}
          </div>

          {/* Col headers */}
          <div style={{ background: BLUE, display: 'grid', gridTemplateColumns: gridCols, borderBottom: `2px solid ${BLUE_B}` }}>
            {COLS.map(col => (
              <div key={col.key} style={{ color: '#fff', fontWeight: 700, fontSize: 10, textAlign: 'center', padding: '9px 3px', borderRight: `1px solid ${BLUE_B}`, whiteSpace: 'pre-line', lineHeight: 1.25 }}>
                {col.label}
              </div>
            ))}
          </div>

          {/* Data rows */}
          <div style={{ background: '#fff' }}>
            {expenses.map((row, idx) => {
              const special = isSpecialDay(row.name || '');
              const fareA   = parseInt(row.fareA || 0) || 0;
              const fareB   = parseInt(row.fareB || 0) || 0;
              const rowTot  = fareA + fareB;
              const bg      = special ? YELLOW : '#fff';
              const color   = special ? RED    : '#111';

              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: gridCols, background: bg, borderBottom: `1px solid ${DATA_BOR}`, borderLeft: special ? `3px solid ${RED}` : '3px solid transparent', alignItems: 'center' }}>
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, padding: '4px', textAlign: 'center', fontSize: 11, fontWeight: special ? 700 : 400, color }}>{row.date || ''}</div>
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, padding: '4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color }}>
                    {special ? `${(row.name||'').toUpperCase()}…………` : (row.from || 'FIROZABAD')}
                  </div>
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, padding: '4px', textAlign: 'center', fontSize: 11, color }}>{special ? '' : (row.name || '').toUpperCase()}</div>
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, padding: '4px', textAlign: 'center', fontSize: 11, color }}>{special ? '' : (row.mode || '')}</div>
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, padding: '4px', textAlign: 'center', fontSize: 11, color }}>{special ? '' : (row.km || '')}</div>
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, padding: '4px', textAlign: 'center', fontSize: 11, color }}>{special ? '' : (fareA || '')}</div>
                  <div style={{ borderRight: `1px solid ${DATA_BOR}`, padding: '4px', textAlign: 'center', fontSize: 11, color }}>{special ? '' : (fareB || '')}</div>
                  <div style={{ padding: '4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color }}>{!special && rowTot > 0 ? rowTot : ''}</div>
                </div>
              );
            })}
          </div>

          {/* Total row */}
          <div style={{ display: 'grid', gridTemplateColumns: `${COLS.slice(0,5).reduce((s,c)=>s+c.w,0)}px ${COLS[5].w}px ${COLS[6].w}px ${COLS[7].w}px`, background: GREY_TOT, borderTop: '2px solid #555', alignItems: 'center' }}>
            <div style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 700, fontSize: 11, borderRight: `1px solid ${DATA_BOR}` }}>TOTAL</div>
            <div style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, fontSize: 11, borderRight: `1px solid ${DATA_BOR}` }}>{sumA || ''}</div>
            <div style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, fontSize: 11, borderRight: `1px solid ${DATA_BOR}` }}>{sumB || ''}</div>
            <div style={{ padding: '7px 4px', textAlign: 'center', fontWeight: 700, fontSize: 11 }}>{sumT || ''}</div>
          </div>

        </div>
      </div>

      <p style={{ textAlign: 'center', color: '#1e293b', marginTop: 20, fontSize: 12 }}>
        Generated by <span style={{ color: '#3b82f6', fontWeight: 700 }}>ExpenseScan</span>
      </p>
    </div>
  );
}
