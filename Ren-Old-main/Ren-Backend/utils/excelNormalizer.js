import ExcelJS from "exceljs";

/**
 * Normalize header text:
 *  - lower case
 *  - remove spaces / underscores / symbols
 */
const headerValueToString = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (value.text) return value.text;
    if (value.richText) return value.richText.map((t) => t.text).join("");
    if (value.result !== undefined) return String(value.result);
  }
  return String(value);
};

const normalizeHeader = (value) =>
  headerValueToString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

/**
 * Extract all rows from ALL sheets
 * with header-based mapping.
 */
export async function normalizeExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const rows = [];
  const errors = [];
  const sheets = []; // metadata per sheet

  workbook.eachSheet((worksheet) => {
    // Heuristic header detection: scan first few rows because some sheets have titles above headers
    const maxHeaderSearch = Math.min(20, worksheet.rowCount || 20);
    let headerRowIndex = null;
    let columnMap = {};

    for (let r = 1; r <= maxHeaderSearch; r++) {
      const headerRowCandidate = worksheet.getRow(r);
      const tempMap = {};

      headerRowCandidate.eachCell((cell, col) => {
        if (!cell.value) return;
        const header = normalizeHeader(cell.value);

        if (header.includes("event")) tempMap.eventName = col;
        else if (header.includes("participant") || header.includes("members") || header.includes("team")) tempMap.participants = col;
        else if (header.includes("name")) tempMap.name = col;
        else if (header.includes("email")) tempMap.email = col;
        else if (header.includes("branch") || header.includes("dept")) tempMap.branch = col;
        else if (header.includes("year") || header.includes("class")) tempMap.year = col;
        else if (header.includes("phone") || header.includes("mobile") || header.includes("contact") || header.includes("whatsapp")) tempMap.phone = col;
        else if (header.includes("day") || header.includes("days") || header.includes("validday")) tempMap.days = col;

        // Detect explicit day columns like 'day1', 'day2' or 'day 1', 'day 2'
        const digits = header.replace(/[^0-9]/g, "");
        const looksLikeDay = header.includes("day") || /^d\d+$/.test(header);
        if (looksLikeDay && digits) {
          tempMap.dayCols = tempMap.dayCols || {};
          const num = parseInt(digits, 10);
          if (num >= 1 && num <= 9) tempMap.dayCols[num] = col;
        }
      });

      // Accept this as header row if it has any recognized header columns
      if (Object.keys(tempMap).length > 0) {
        headerRowIndex = r;
        columnMap = tempMap;
        break;
      }
    }

    // record sheet meta even if we skip it (helps diagnostics)
    sheets.push({ sheet: worksheet.name, headerRowIndex: headerRowIndex, columns: Object.keys(columnMap), dayCols: columnMap.dayCols || {} });

    if (!headerRowIndex) return; // skip sheets without recognizable headers

    // Iterate rows after the detected header row
    // helper to convert any ExcelJS cell to a trimmed string (handles numbers, richText, formula results, etc.)
    const cellToString = (cell) => {
      if (!cell || cell.value === null || cell.value === undefined) return null;
      let v = cell.value;
      if (typeof v === 'object') {
        if (v.text) v = v.text;
        else if (v.richText) v = v.richText.map(t => t.text).join('');
        else if (v.result !== undefined) v = v.result;
        else v = JSON.stringify(v);
      }
      return String(v).trim();
    };

    for (let rowNumber = headerRowIndex + 1; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (!row) continue; // skip missing rows

      try {
        const record = {
          sheet: worksheet.name,
          row: rowNumber,
          raw: row,
          data: {}
        };

        if (columnMap.name) {
          const v = cellToString(row.getCell(columnMap.name));
          if (v) record.data.name = v;
        }

        if (columnMap.email) {
          const v = cellToString(row.getCell(columnMap.email));
          if (v) record.data.email = v;
        }

        if (columnMap.branch) {
          const v = cellToString(row.getCell(columnMap.branch));
          if (v) record.data.branch = v;
        }

        if (columnMap.year) {
          const yCell = row.getCell(columnMap.year);
          const yVal = yCell && (typeof yCell.value === 'number' ? yCell.value : cellToString(yCell));
          if (yVal !== null && yVal !== undefined && yVal !== '') record.data.year = yVal;
        }

        if (columnMap.phone) {
          const v = cellToString(row.getCell(columnMap.phone));
          if (v) record.data.phone = v;
        }

        if (columnMap.eventName) {
          const v = cellToString(row.getCell(columnMap.eventName));
          if (v) record.data.eventName = v;
        }

        if (columnMap.participants) {
          const v = cellToString(row.getCell(columnMap.participants));
          if (v) record.data.participants = v;
        }

        if (columnMap.days) {
          const v = cellToString(row.getCell(columnMap.days));
          if (v) record.data.days = v;
        }

        // If explicit day columns exist (day1, day2...), aggregate them into a days string like "1,2"
        if (columnMap.dayCols) {
          const dayNums = [];
          for (const [numStr, col] of Object.entries(columnMap.dayCols)) {
            const rawVal = cellToString(row.getCell(col));
            if (!rawVal) continue;
            const val = rawVal.toLowerCase();
            if (["x", "yes", "true", "1"].includes(val) || val.length > 0) {
              dayNums.push(parseInt(numStr, 10));
            }
          }
          if (dayNums.length) record.data.days = dayNums.join(",");
        }

        // skip rows where no useful data was extracted
        if (Object.keys(record.data).length === 0) continue;

        rows.push(record);
      } catch (err) {
        errors.push({
          sheet: worksheet.name,
          row: rowNumber,
          reason: err.message
        });
      }
    }
  });

  return { rows, errors, sheets };
}
