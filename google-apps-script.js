/**
 * ══════════════════════════════════════════════════════════════
 *  CAR MANAGEMENT SYSTEM — Google Apps Script  v2
 *  Har month ki ALAG sheet banti hai automatically
 *  e.g.  Apr-2026 | May-2026 | Jun-2026 | SUMMARY
 * ══════════════════════════════════════════════════════════════
 *
 *  SETUP (one-time):
 *  1. Google Sheet kholo → Extensions → Apps Script
 *  2. Purana code delete karo, yeh poora paste karo
 *  3. Deploy → New Deployment → Web App
 *  4. Execute as: Me  |  Who has access: Anyone
 *  5. Deploy → URL copy karo
 *  6. Car Management App → Admin → Sheets URL → paste → Save
 * ══════════════════════════════════════════════════════════════
 */

// ── Months short names (for sheet tab names) ─────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec'];

const SUMMARY_SHEET = '📊 SUMMARY';

// ─────────────────────────────────────────────────────────────
//  doPost  — called when Car Management app saves a record
// ─────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.getActiveSpreadsheet();

    // ── Determine which month-sheet to use ──────────────────
    // data.date is like "01-Apr-2026"  or  "2026-04-01"
    const sheetName = getMonthSheetName(data.date);
    let sheet = ss.getSheetByName(sheetName);

    // Create month sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      styleMonthTab(sheet, data.date);   // color the tab
      createHeaders(sheet);
      // Move it before SUMMARY sheet so order is chronological
      moveSheetBeforeSummary(ss, sheet);
    } else if (sheet.getLastRow() === 0) {
      createHeaders(sheet);
    }

    // ── Insert or update the row ─────────────────────────────
    const existingRow = findRowById(sheet, data.id);
    const row         = buildRow(data);

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
      // Keep rows sorted by date within the sheet
      sortSheetByDate(sheet);
    }

    autoFormat(sheet);

    // ── Rebuild the SUMMARY sheet ────────────────────────────
    rebuildSummarySheet(ss);

    return ok('Record saved to sheet: ' + sheetName);

  } catch (err) {
    return error(err.toString());
  }
}

// ─────────────────────────────────────────────────────────────
//  doGet  — health check / test
// ─────────────────────────────────────────────────────────────
function doGet(e) {
  // If ?action=summary  →  return JSON summary of all months
  if (e && e.parameter && e.parameter.action === 'summary') {
    return getSummaryJson();
  }
  return ok('Car Management Sheets API v2 ✓ — Per-month sheets enabled');
}

// ─────────────────────────────────────────────────────────────
//  Sheet name from date  →  "Apr-2026"
// ─────────────────────────────────────────────────────────────
function getMonthSheetName(dateStr) {
  // Accept both "01-Apr-2026" and "2026-04-01"
  let month, year;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // ISO format: 2026-04-01
    const parts = dateStr.split('-');
    year  = parseInt(parts[0]);
    month = parseInt(parts[1]) - 1;   // 0-indexed
  } else {
    // Formatted: 01-Apr-2026
    const parts = dateStr.split('-');
    month = MONTH_NAMES.indexOf(parts[1]);
    year  = parseInt(parts[2]);
  }

  return MONTH_NAMES[month] + '-' + year;   // e.g. "Apr-2026"
}

// ─────────────────────────────────────────────────────────────
//  Build data row array
// ─────────────────────────────────────────────────────────────
function buildRow(d) {
  return [
    d.id            || '',   // A  — Record ID (hidden)
    d.date          || '',   // B  — Date
    d.driverName    || '',   // C  — Driver Name
    Number(d.startKm)    || 0,   // D  — Start KM
    Number(d.endKm)      || 0,   // E  — End KM
    Number(d.totalKm)    || 0,   // F  — Total KM
    d.fuelType      || '',   // G  — Fuel Type
    Number(d.fuelUpi)    || 0,   // H  — Fuel UPI ₹
    Number(d.fuelCash)   || 0,   // I  — Fuel Cash ₹
    Number(d.foodExp)    || 0,   // J  — Food ₹
    Number(d.servicing)  || 0,   // K  — Servicing ₹
    Number(d.commission) || 0,   // L  — Commission ₹
    Number(d.upiAmount)  || 0,   // M  — UPI Earned ₹
    Number(d.cashAmount) || 0,   // N  — Cash Earned ₹
    Number(d.totalFare)  || 0,   // O  — Total Fare ₹
    Number(d.totalExpenses)||0,  // P  — Total Expenses ₹
    Number(d.netProfit)  || 0,   // Q  — Net Profit ₹
    Number(d.ownerReceived)||0,  // R  — Owner Receives ₹
    Number(d.cashPayDriver)||0,  // S  — Cash by Driver ₹
    Number(d.extraExpCash)||0,   // T  — Extra Cash ₹
    Number(d.extraExpUpi) ||0,   // U  — Extra UPI ₹
    Number(d.cashIntoUpi) ||0,   // V  — Cash→UPI ₹
    d.notes         || '',   // W  — Notes
    d.syncedAt      || new Date().toISOString(),  // X  — Synced At
  ];
}

// ─────────────────────────────────────────────────────────────
//  Headers
// ─────────────────────────────────────────────────────────────
function createHeaders(sheet) {
  const headers = [
    'Record ID','Date','Driver Name','Start KM','End KM','Total KM',
    'Fuel Type','Fuel UPI ₹','Fuel Cash ₹','Food ₹','Servicing ₹',
    'Commission ₹','UPI Earned ₹','Cash Earned ₹','Total Fare ₹',
    'Total Expenses ₹','Net Profit ₹','Owner Receives ₹',
    'Cash by Driver ₹','Extra Cash ₹','Extra UPI ₹',
    'Cash→UPI ₹','Notes','Synced At'
  ];
  sheet.appendRow(headers);

  const hRange = sheet.getRange(1, 1, 1, headers.length);
  hRange.setBackground('#1e3a5f');
  hRange.setFontColor('#ffffff');
  hRange.setFontWeight('bold');
  hRange.setFontSize(11);
  hRange.setWrap(false);

  sheet.hideColumns(1);   // hide Record ID column
  sheet.setFrozenRows(1);
}

// ─────────────────────────────────────────────────────────────
//  Find row by Record ID  (searches hidden col A)
// ─────────────────────────────────────────────────────────────
function findRowById(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}

// ─────────────────────────────────────────────────────────────
//  Sort sheet by Date column (B = col 2) ascending
// ─────────────────────────────────────────────────────────────
function sortSheetByDate(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow < 3) return;
    const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    range.sort({ column: 2, ascending: true });
  } catch(e) {}
}

// ─────────────────────────────────────────────────────────────
//  Auto-format the month sheet
// ─────────────────────────────────────────────────────────────
function autoFormat(sheet) {
  try {
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(2, sheet.getLastColumn());

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const dataRows = lastRow - 1;

    // Alternate row colors
    for (let r = 2; r <= lastRow; r++) {
      const bg = (r % 2 === 0) ? '#f8fafc' : '#ffffff';
      sheet.getRange(r, 2, 1, sheet.getLastColumn() - 1).setBackground(bg);
    }

    // Color Net Profit column Q (col 17) green/red
    const profitRange = sheet.getRange(2, 17, dataRows, 1);
    const pVals  = profitRange.getValues();
    const pBg    = pVals.map(([v]) => [v >= 0 ? '#dcfce7' : '#fee2e2']);
    const pColor = pVals.map(([v]) => [v >= 0 ? '#166534' : '#991b1b']);
    profitRange.setBackgrounds(pBg);
    profitRange.setFontColors(pColor);
    profitRange.setFontWeight('bold');

    // Color Owner Receives column R (col 18) similarly
    const ownerRange = sheet.getRange(2, 18, dataRows, 1);
    const oVals  = ownerRange.getValues();
    const oBg    = oVals.map(([v]) => [v >= 0 ? '#dbeafe' : '#fee2e2']);
    ownerRange.setBackgrounds(oBg);
    ownerRange.setFontWeight('bold');

    // Add TOTALS row at the bottom
    addTotalsRow(sheet, lastRow);

  } catch (e) { /* formatting errors don't break sync */ }
}

// ─────────────────────────────────────────────────────────────
//  Add / refresh TOTALS row at bottom of month sheet
// ─────────────────────────────────────────────────────────────
function addTotalsRow(sheet, lastDataRow) {
  try {
    const totalRowNum = lastDataRow + 2;  // blank row gap

    // Clear old totals rows if any
    const maxRow = sheet.getMaxRows();
    if (maxRow >= totalRowNum) {
      sheet.getRange(lastDataRow + 1, 1, maxRow - lastDataRow, sheet.getLastColumn()).clearContent().clearFormat();
    }

    // Number columns to sum (1-indexed): F,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V
    const sumCols = [6,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22];

    // Label cell
    sheet.getRange(totalRowNum, 2).setValue('TOTAL').setFontWeight('bold').setFontColor('#ffffff').setBackground('#1e3a5f');

    sumCols.forEach(col => {
      const colLetter = columnToLetter(col);
      const formula   = `=SUM(${colLetter}2:${colLetter}${lastDataRow})`;
      const cell      = sheet.getRange(totalRowNum, col);
      cell.setFormula(formula);
      cell.setFontWeight('bold');
      cell.setBackground('#1e3a5f');
      cell.setFontColor('#ffffff');
      cell.setNumberFormat('₹#,##0');
    });

    // KM column (F=6) different format
    sheet.getRange(totalRowNum, 6).setNumberFormat('#,##0');

  } catch(e) {}
}

// ─────────────────────────────────────────────────────────────
//  SUMMARY SHEET — one row per month with all totals
// ─────────────────────────────────────────────────────────────
function rebuildSummarySheet(ss) {
  try {
    let summarySheet = ss.getSheetByName(SUMMARY_SHEET);
    if (!summarySheet) {
      summarySheet = ss.insertSheet(SUMMARY_SHEET);
      // Move summary to last position
      ss.moveActiveSheet(ss.getNumSheets());
    }

    summarySheet.clearContents();
    summarySheet.clearFormats();

    // ── TITLE ────────────────────────────────────────────────
    summarySheet.getRange(1,1,1,12).merge()
      .setValue('🚗 CAR MANAGEMENT — MONTHLY SUMMARY')
      .setBackground('#1e3a5f')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(14)
      .setHorizontalAlignment('center');

    summarySheet.getRange(2,1,1,12).merge()
      .setValue('Auto-generated • Updates on every sync')
      .setBackground('#2563eb')
      .setFontColor('rgba(255,255,255,0.8)')
      .setFontSize(10)
      .setHorizontalAlignment('center');

    // ── HEADER ROW ───────────────────────────────────────────
    const headers = [
      'Month','Records','Total KM',
      'Total Fare ₹','Total Expenses ₹','Net Profit ₹',
      'Fuel ₹','Food ₹','Servicing ₹',
      'UPI Earned ₹','Cash Earned ₹','Owner Receives ₹'
    ];
    const hRow = summarySheet.getRange(4, 1, 1, headers.length);
    hRow.setValues([headers]);
    hRow.setBackground('#374151');
    hRow.setFontColor('#ffffff');
    hRow.setFontWeight('bold');
    hRow.setFontSize(11);

    // ── COLLECT DATA FROM EACH MONTH SHEET ───────────────────
    const sheets = ss.getSheets();
    const monthPattern = /^[A-Za-z]{3}-\d{4}$/;
    const monthSheets  = sheets.filter(s => monthPattern.test(s.getName()));

    // Sort chronologically
    monthSheets.sort((a, b) => {
      const [am, ay] = a.getName().split('-');
      const [bm, by] = b.getName().split('-');
      const aDate = new Date(parseInt(ay), MONTH_NAMES.indexOf(am), 1);
      const bDate = new Date(parseInt(by), MONTH_NAMES.indexOf(bm), 1);
      return aDate - bDate;
    });

    let grandTotals = new Array(11).fill(0);
    let dataRowNum  = 5;

    monthSheets.forEach((ms, idx) => {
      const lastRow = ms.getLastRow();
      if (lastRow < 2) return;

      // Read all data rows (skip header row 1, skip last totals row if exists)
      const data = ms.getRange(2, 1, lastRow - 1, 22).getValues();
      const dataOnly = data.filter(row => row[0] !== '' && row[0] !== 'TOTAL' && row[1] !== 'TOTAL');

      if (dataOnly.length === 0) return;

      let t = { km:0, fare:0, exp:0, profit:0, fuel:0, food:0, serv:0, upi:0, cash:0, owner:0 };
      dataOnly.forEach(row => {
        t.km     += Number(row[5])  || 0;   // F totalKm
        t.fare   += Number(row[14]) || 0;   // O totalFare
        t.exp    += Number(row[15]) || 0;   // P totalExpenses
        t.profit += Number(row[16]) || 0;   // Q netProfit
        t.fuel   += (Number(row[7])||0) + (Number(row[8])||0); // H+I
        t.food   += Number(row[9])  || 0;   // J
        t.serv   += Number(row[10]) || 0;   // K
        t.upi    += Number(row[12]) || 0;   // M
        t.cash   += Number(row[13]) || 0;   // N
        t.owner  += Number(row[17]) || 0;   // R
      });

      const rowValues = [
        ms.getName(),
        dataOnly.length,
        t.km,
        t.fare, t.exp, t.profit,
        t.fuel, t.food, t.serv,
        t.upi, t.cash, t.owner
      ];

      const rowRange = summarySheet.getRange(dataRowNum, 1, 1, 12);
      rowRange.setValues([rowValues]);

      // Alternating row background
      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      rowRange.setBackground(bg);

      // Color Net Profit cell (col 6)
      const profitCell = summarySheet.getRange(dataRowNum, 6);
      profitCell.setBackground(t.profit >= 0 ? '#dcfce7' : '#fee2e2');
      profitCell.setFontColor(t.profit >= 0 ? '#166534' : '#991b1b');
      profitCell.setFontWeight('bold');

      // Number formats
      summarySheet.getRange(dataRowNum, 3).setNumberFormat('#,##0 "km"');
      summarySheet.getRange(dataRowNum, 4, 1, 9).setNumberFormat('₹#,##0');

      // Month name bold
      summarySheet.getRange(dataRowNum, 1).setFontWeight('bold');

      // Accumulate grand totals
      grandTotals[0] += dataOnly.length;
      grandTotals[1] += t.km;
      grandTotals[2] += t.fare;
      grandTotals[3] += t.exp;
      grandTotals[4] += t.profit;
      grandTotals[5] += t.fuel;
      grandTotals[6] += t.food;
      grandTotals[7] += t.serv;
      grandTotals[8] += t.upi;
      grandTotals[9] += t.cash;
      grandTotals[10]+= t.owner;

      dataRowNum++;
    });

    // ── GRAND TOTAL ROW ──────────────────────────────────────
    if (dataRowNum > 5) {
      dataRowNum++;   // blank gap
      const gtRow = summarySheet.getRange(dataRowNum, 1, 1, 12);
      gtRow.setValues([[
        'GRAND TOTAL',
        grandTotals[0],
        grandTotals[1],
        grandTotals[2], grandTotals[3], grandTotals[4],
        grandTotals[5], grandTotals[6], grandTotals[7],
        grandTotals[8], grandTotals[9], grandTotals[10]
      ]]);
      gtRow.setBackground('#1e3a5f');
      gtRow.setFontColor('#ffffff');
      gtRow.setFontWeight('bold');
      gtRow.setFontSize(12);

      summarySheet.getRange(dataRowNum, 3).setNumberFormat('#,##0 "km"');
      summarySheet.getRange(dataRowNum, 4, 1, 9).setNumberFormat('₹#,##0');

      // Highlight grand profit in green/red
      const gProfit = grandTotals[4];
      const gpCell  = summarySheet.getRange(dataRowNum, 6);
      gpCell.setBackground(gProfit >= 0 ? '#16a34a' : '#dc2626');
      gpCell.setFontColor('#ffffff');

      // ── DRIVER CASH SUMMARY section ──────────────────────
      dataRowNum += 3;
      summarySheet.getRange(dataRowNum, 1, 1, 6).merge()
        .setValue('💳 DRIVER CASH SUMMARY (All Months)')
        .setBackground('#374151')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setFontSize(11);

      dataRowNum++;
      const csHeaders = ['Month','Driver','Cash Earned','Cash Paid Back','Extra Exp Cash','Net Cash to Owner'];
      const csHRange  = summarySheet.getRange(dataRowNum, 1, 1, 6);
      csHRange.setValues([csHeaders]);
      csHRange.setBackground('#4b5563');
      csHRange.setFontColor('#ffffff');
      csHRange.setFontWeight('bold');

      dataRowNum++;
      monthSheets.forEach((ms, idx) => {
        const lastRow = ms.getLastRow();
        if (lastRow < 2) return;
        const data     = ms.getRange(2, 1, lastRow - 1, 22).getValues();
        const dataOnly = data.filter(row => row[0] !== '' && row[1] !== 'TOTAL');
        if (dataOnly.length === 0) return;

        // Group by driver
        const byDriver = {};
        dataOnly.forEach(row => {
          const driver = row[2] || 'Unknown';
          if (!byDriver[driver]) byDriver[driver] = { cashEarned:0, cashPaid:0, extraCash:0, cashToUpi:0 };
          byDriver[driver].cashEarned += Number(row[13]) || 0;  // N cashAmount
          byDriver[driver].cashPaid   += Number(row[18]) || 0;  // S cashPayDriver
          byDriver[driver].extraCash  += Number(row[19]) || 0;  // T extraExpCash
          byDriver[driver].cashToUpi  += Number(row[21]) || 0;  // V cashIntoUpi
        });

        Object.entries(byDriver).forEach(([driver, v]) => {
          const netCash = v.cashEarned - v.cashPaid - v.extraCash - v.cashToUpi;
          const csRow = [ms.getName(), driver, v.cashEarned, v.cashPaid, v.extraCash, netCash];
          const rowRange = summarySheet.getRange(dataRowNum, 1, 1, 6);
          rowRange.setValues([csRow]);
          const bg = idx % 2 === 0 ? '#f0fdf4' : '#ffffff';
          rowRange.setBackground(bg);
          summarySheet.getRange(dataRowNum, 3, 1, 4).setNumberFormat('₹#,##0');
          const netCell = summarySheet.getRange(dataRowNum, 6);
          netCell.setFontWeight('bold');
          netCell.setFontColor(netCash >= 0 ? '#166534' : '#991b1b');
          dataRowNum++;
        });
      });
    }

    // ── Finalize formatting ───────────────────────────────────
    summarySheet.setFrozenRows(4);
    summarySheet.autoResizeColumns(1, 12);
    summarySheet.setColumnWidth(1, 100);

    // Move SUMMARY to last tab always
    ss.moveActiveSheet(ss.getNumSheets());

  } catch(err) {
    Logger.log('Summary rebuild error: ' + err.toString());
  }
}

// ─────────────────────────────────────────────────────────────
//  Color the month tab based on month number
// ─────────────────────────────────────────────────────────────
function styleMonthTab(sheet, dateStr) {
  const tabColors = [
    '#dc2626','#ea580c','#d97706','#16a34a',
    '#0891b2','#2563eb','#7c3aed','#db2777',
    '#065f46','#1d4ed8','#7f1d1d','#1e3a5f'
  ];
  try {
    let month;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      month = parseInt(dateStr.split('-')[1]) - 1;
    } else {
      month = MONTH_NAMES.indexOf(dateStr.split('-')[1]);
    }
    if (month >= 0) sheet.setTabColor(tabColors[month]);
  } catch(e) {}
}

// ─────────────────────────────────────────────────────────────
//  Move a new month sheet before the SUMMARY sheet
// ─────────────────────────────────────────────────────────────
function moveSheetBeforeSummary(ss, sheet) {
  try {
    const summarySheet = ss.getSheetByName(SUMMARY_SHEET);
    if (!summarySheet) return;
    const summaryPos = summarySheet.getIndex();
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(summaryPos);
  } catch(e) {}
}

// ─────────────────────────────────────────────────────────────
//  Convert column number to letter  (1→A, 26→Z, 27→AA)
// ─────────────────────────────────────────────────────────────
function columnToLetter(col) {
  let letter = '';
  while (col > 0) {
    const rem = (col - 1) % 26;
    letter    = String.fromCharCode(65 + rem) + letter;
    col       = Math.floor((col - 1) / 26);
  }
  return letter;
}

// ─────────────────────────────────────────────────────────────
//  Return summary as JSON (for doGet?action=summary)
// ─────────────────────────────────────────────────────────────
function getSummaryJson() {
  try {
    const ss      = SpreadsheetApp.getActiveSpreadsheet();
    const sheets  = ss.getSheets();
    const pattern = /^[A-Za-z]{3}-\d{4}$/;
    const result  = [];

    sheets.filter(s => pattern.test(s.getName())).forEach(ms => {
      const lastRow = ms.getLastRow();
      if (lastRow < 2) return;
      const data    = ms.getRange(2, 1, lastRow - 1, 17).getValues();
      const records = data.filter(r => r[0] !== '' && r[1] !== 'TOTAL');
      let fare = 0, profit = 0;
      records.forEach(r => { fare += Number(r[14])||0; profit += Number(r[16])||0; });
      result.push({ month: ms.getName(), records: records.length, totalFare: fare, netProfit: profit });
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status:'ok', months: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return error(err.toString());
  }
}

// ─────────────────────────────────────────────────────────────
//  Response helpers
// ─────────────────────────────────────────────────────────────
function ok(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status:'ok', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status:'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
