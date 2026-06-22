import ExcelJS from 'exceljs';
import fs from 'fs';
import Student from '../models/student.js';
import { normalizeExcel } from "../utils/excelNormalizer.js";
import { normalizeBranch } from "../utils/branchNormalizer.js";
import normalizePhone from "../utils/phoneNormalizer.js";

// normalize header text
const normalizeHeader = (text) =>
  text.toLowerCase().replace(/\s|_|-/g, "");

// resolve name column intelligently
const resolveNameFromRow = (row, columnMap) => {
  // Priority order
  if (columnMap.studentName)
    return row.getCell(columnMap.studentName).text?.trim();

  if (columnMap.name)
    return row.getCell(columnMap.name).text?.trim();

  if (columnMap.fullName)
    return row.getCell(columnMap.fullName).text?.trim();

  // Fallback: derive from father name
  if (columnMap.fatherName) {
    return row
      .getCell(columnMap.fatherName)
      .text
      ?.replace(/father|s\/o|d\/o|son of|daughter of/gi, "")
      .trim();
  }

  return null;
};

// 1. TEACHER: Check if students exist
export const CheckStudents = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    const excelStudents = [];

    // ---- STEP 1: Read header row and map columns dynamically ----
    const headerRow = worksheet.getRow(1);
    const columnMap = {};

    headerRow.eachCell((cell, colNumber) => {
      if (!cell.value) return;

      const header = normalizeHeader(cell.value.toString());

      if (header.includes("student name")) columnMap.studentName = colNumber;
      else if (header.includes("full name")) columnMap.fullName = colNumber;
      else if (header.includes("father")) columnMap.fatherName = colNumber;
      else if (header.includes("name")) columnMap.name = colNumber;
      else if (header.includes("email")) columnMap.email = colNumber;
      else if (header.includes("branch") || header.includes("department")) columnMap.branch = colNumber;
      else if (header.includes("year")) columnMap.year = colNumber;
      else if (header.includes("phone") || header.includes("mobile") || header.includes("contact")) columnMap.phone = colNumber;
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const name = resolveNameFromRow(row, columnMap);
      const email = columnMap.email ? row.getCell(columnMap.email).text?.trim() : null;
      const branch = columnMap.branch ? row.getCell(columnMap.branch).text?.trim() : null;
      const yearRaw = columnMap.year ? row.getCell(columnMap.year).value : null;
      const year = yearRaw ? parseInt(yearRaw) : null;
      const phoneRaw = columnMap.phone ? row.getCell(columnMap.phone).text?.trim() : null;
      const phone = normalizePhone(phoneRaw);

      if (name && email && branch && year) {
        excelStudents.push({
          name,
          email,
          branch: normalizeBranch(branch),
          Year: year,
          phone: phone || null,
          isPaid: false,
          token: 0
        });
      }
    });

    
    fs.unlinkSync(req.file.path);

    const inserted = [];
    const existing = [];

    for (const student of excelStudents) {
      const already = await Student.findOne({
        email: student.email
      });

      if (already) {
        existing.push(already);
      } else {
        const newStudent = await Student.create({
          ...student,
          isPaid: false,
          token: 0
        });
        inserted.push(newStudent);
      }
    }

    res.status(200).json({
      msg: "Excel processed successfully",
      inserted,
      existing
    });

  } catch (error) {
    console.error("CheckStudents Error:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ msg: "Server error" });
  }
};

export const RegisterStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const uploader = req.user; // from teacherAuth middleware

    const { rows, errors: parseErrors, sheets } =
      await normalizeExcel(req.file.path);

    const inserted = [];
    const skipped = [];
    const duplicateSkipped = [];

    // Preprocess rows into candidate docs with deduplication
    const candidates = [];
    const seenDuplicates = new Set(); // Track duplicates within same batch

    for (const record of rows) {
      const { sheet, row, data } = record;
      const { name, email, branch, year, phone } = data;

      if (!name || !email || !branch || !year) {
        skipped.push({ sheet, row, reason: 'Missing required fields' });
        continue;
      }

      const normalizedBranch = normalizeBranch(branch);
      const parsedYear = parseInt(year);

      if (!normalizedBranch || !parsedYear) {
        skipped.push({ sheet, row, reason: 'Invalid branch or year' });
        continue;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // ---- DUPLICATE DETECTION (WITHIN BATCH) ----
      if (seenDuplicates.has(normalizedEmail)) {
        duplicateSkipped.push({ sheet, row, email: normalizedEmail, reason: 'Duplicate email in batch' });
        continue;
      }
      seenDuplicates.add(normalizedEmail);

      // role-based checks deferred to later per-candidate
      const normalizedPhone = normalizePhone(phone);
      candidates.push({ sheet, row, name: name.trim(), email: normalizedEmail, branch: normalizedBranch, Year: parsedYear, phone: normalizedPhone });
    }

    // Check existing emails in bulk
    const emails = candidates.map((c) => c.email);
    const existingStudents = await Student.find({ email: { $in: emails } }).select('email');
    const existingSet = new Set(existingStudents.map((s) => s.email));

    // Filter candidates according to role and duplicates
    const toInsert = [];
    for (const c of candidates) {
      const { sheet, row, name, email, branch: normalizedBranch, Year: parsedYear, phone } = c;

      if (existingSet.has(email)) {
        duplicateSkipped.push({ sheet, row, email, reason: 'Student already exists in database' });
        continue;
      }

      if (uploader.role === 'hod' && normalizedBranch !== uploader.branch) {
        skipped.push({ sheet, row, reason: 'Branch not allowed for HOD' });
        continue;
      }

      if (uploader.role === 'cc' && (normalizedBranch !== uploader.branch || parsedYear !== uploader.year)) {
        skipped.push({ sheet, row, reason: 'Branch/Year not allowed for CC' });
        continue;
      }

      toInsert.push({ name, email, branch: normalizedBranch, Year: parsedYear, phone: phone || null, isPaid: false, token: 0 });
    }

    // Bulk insert in batches
    const BATCH = 500;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      try {
        const resInsert = await Student.insertMany(batch, { ordered: false });
        console.log(`Batch insert: inserted ${resInsert.length} student documents`);
        inserted.push(...resInsert);
      } catch (err) {
        if (err && err.insertedDocs && err.insertedDocs.length) {
          console.log(`Partial insert: inserted ${err.insertedDocs.length} student documents before error`);
          inserted.push(...err.insertedDocs);
        }
        console.error('Partial insert error for students batch:', err.message || err);
      }
    }

    fs.unlinkSync(req.file.path);

    return res.status(201).json({
      success: true,
      summary: {
        totalRows: rows.length,
        inserted: inserted.length,
        skipped: skipped.length,
        duplicateSkipped: duplicateSkipped.length,
        totalSkipped: skipped.length + duplicateSkipped.length
      },
      sheets,
      skipped: skipped.slice(0, 100),
      duplicates: duplicateSkipped.slice(0, 100),
      parseErrors
    });

  } catch (error) {
    console.error("RegisterStudents error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ msg: "Excel registration failed" });
  }
};

