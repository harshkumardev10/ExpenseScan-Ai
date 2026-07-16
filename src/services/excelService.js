import ExcelJS from 'exceljs';

/** Detect SUNDAY or LEAVE anywhere in text (case-insensitive) */
export const isSpecialDay = (text = '') => {
  const u = (text || '').toString().toUpperCase();
  return u.includes('SUNDAY') || u.includes('LEAVE');
};

// ─── ARGB color constants (ExcelJS uses AARRGGBB) ─────────────────────────
const C = {
  BLUE:        'FF1E5799',
  BLUE_BORDER: 'FF2A6DB5',
  WHITE:       'FFFFFFFF',
  YELLOW:      'FFFFFF00',
  RED:         'FFCC0000',
  BLACK:       'FF111111',
  GREY:        'FFD0D0D0',
  DATA_BOR:    'FFC0C0C0',
};

const thin  = (argb) => ({ style: 'thin',   color: { argb } });
const medium = (argb) => ({ style: 'medium', color: { argb } });

// ─── style factories ────────────────────────────────────────────────────────
const blueFill  = () => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: C.BLUE } });
const yellowFill = () => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: C.YELLOW } });
const whiteFill  = () => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: C.WHITE } });
const greyFill   = () => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: C.GREY } });

const blueBorder  = () => ({ top: thin(C.BLUE_BORDER), bottom: thin(C.BLUE_BORDER), left: thin(C.BLUE_BORDER), right: thin(C.BLUE_BORDER) });
const dataBorder  = () => ({ top: thin(C.DATA_BOR),  bottom: thin(C.DATA_BOR),  left: thin(C.DATA_BOR),  right: thin(C.DATA_BOR) });
const totalBorder = () => ({ top: medium(C.BLACK),   bottom: medium(C.BLACK),   left: thin(C.DATA_BOR),  right: thin(C.DATA_BOR) });

const applyBlueHeader = (row, fontSize = 11, bold = true) => {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill      = blueFill();
    cell.font      = { name: 'Arial', bold, size: fontSize, color: { argb: C.WHITE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border    = blueBorder();
  });
};

const applyDataRow = (row, special) => {
  const color = special ? C.RED : C.BLACK;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill      = special ? yellowFill() : whiteFill();
    cell.font      = { name: 'Arial', bold: special, size: 10, color: { argb: color } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border    = dataBorder();
  });
};

const applyTotalRow = (row) => {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill      = greyFill();
    cell.font      = { name: 'Arial', bold: true, size: 10, color: { argb: C.BLACK } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border    = totalBorder();
  });
};

// ─── Main export function ──────────────────────────────────────────────────
export const exportExpensesToExcel = async (fileName, rows, meta = {}) => {
  const {
    employeeName = 'SURENDRA KUMAR',
    designation  = 'Sr,RSM',
    fromDate     = '',
    toDate       = '',
  } = meta;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'ExpenseScan';
  const ws = wb.addWorksheet('Expense Statement');

  // ── Column widths ──
  ws.columns = [
    { key: 'date',  width: 11 },
    { key: 'from',  width: 17 },
    { key: 'to',    width: 33 },
    { key: 'mode',  width: 11 },
    { key: 'km',    width: 7  },
    { key: 'fareA', width: 13 },
    { key: 'fareB', width: 18 },
    { key: 'total', width: 10 },
  ];

  // ── Row 1: AUSTRO LAB LIMITED ──
  const r1 = ws.addRow(['AUSTRO LAB LIMITED', '', '', '', '', '', '', '']);
  r1.height = 28;
  ws.mergeCells('A1:H1');
  r1.getCell(1).font      = { name: 'Arial', bold: true, size: 16, color: { argb: C.WHITE } };
  r1.getCell(1).fill      = blueFill();
  r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r1.getCell(1).border    = blueBorder();
  // fill merged empty cells too
  for (let c = 2; c <= 8; c++) {
    const cell = r1.getCell(c);
    cell.fill   = blueFill();
    cell.border = blueBorder();
  }

  // ── Row 2: EXPENSE STATEMENT ──
  const r2 = ws.addRow(['EXPENSE STATEMENT', '', '', '', '', '', '', '']);
  r2.height = 22;
  ws.mergeCells('A2:H2');
  r2.getCell(1).font      = { name: 'Arial', bold: true, size: 13, color: { argb: C.WHITE } };
  r2.getCell(1).fill      = blueFill();
  r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r2.getCell(1).border    = blueBorder();
  for (let c = 2; c <= 8; c++) {
    const cell = r2.getCell(c);
    cell.fill   = blueFill();
    cell.border = blueBorder();
  }

  // ── Row 3: Info bar ──
  const r3 = ws.addRow([
    `NAME-${employeeName}`,
    `Designation : ${designation}`,
    'STATE : UP',
    'HQ :-FIROZBAD',
    '',
    `FROM  ${fromDate}`,
    '',
    `TO ${toDate}`,
  ]);
  r3.height = 18;
  ws.mergeCells('F3:G3');
  applyBlueHeader(r3, 9, true);
  r3.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };
  r3.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

  // ── Row 4: Column headers ──
  const r4 = ws.addRow([
    'DATE', 'FROM', 'TO', 'MODE', 'KM.', 'FARE A ( TA )', 'FARE B\n(DA &Mobile exp.)', 'TOTAL'
  ]);
  r4.height = 32;
  applyBlueHeader(r4, 10, true);

  // ── Data rows ──
  let sumFareA = 0, sumFareB = 0;

  (rows || []).forEach((item) => {
    const special = isSpecialDay(item.name || '');
    const fareA   = parseInt(item.fareA || 0) || 0;
    const fareB   = parseInt(item.fareB || 0) || 0;
    const rowTot  = fareA + fareB;

    if (!special) { sumFareA += fareA; sumFareB += fareB; }

    const from = (item.from && item.from.trim()) ? item.from.toUpperCase() : 'FIROZABAD';

    let rowData;
    if (special) {
      rowData = [item.date || '', `${(item.name||'').toUpperCase()}…………`, '', '', '', '', '', ''];
    } else {
      rowData = [
        item.date || '',
        from,
        (item.name || '').toUpperCase(),
        (item.mode || '').toUpperCase(),
        item.km || '',
        fareA || '',
        fareB || '',
        rowTot || '',
      ];
    }

    const dr = ws.addRow(rowData);
    dr.height = 16;
    applyDataRow(dr, special);

    // Date cell left-align
    dr.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    // FROM cell bold
    if (!special) dr.getCell(2).font = { name: 'Arial', bold: true, size: 10, color: { argb: C.BLACK } };
    // TO cell left-align
    if (!special) dr.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // ── TOTAL row ──
  const grandTotal = sumFareA + sumFareB;
  const totalRow = ws.addRow(['TOTAL', '', '', '', '', sumFareA || '', sumFareB || '', grandTotal || '']);
  totalRow.height = 18;
  // Merge TOTAL label across DATE-KM columns
  const totalRowNum = totalRow.number;
  ws.mergeCells(`A${totalRowNum}:E${totalRowNum}`);
  applyTotalRow(totalRow);
  totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };

  // ── Write buffer → Blob → download ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url    = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href     = url;
  anchor.download = `${(fileName || 'expense_statement').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return true;
};
