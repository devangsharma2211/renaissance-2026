import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import "./homepage.css";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

/* ================= CONFIG ================= */

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://ren-old.onrender.com/api";

const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
  },
});

/* ================= LOADER ================= */

const FuturisticLoader = () => (
  <div className="futuristic-preloader-container">
    <div className="cube">
      <div className="glowing-dot" style={{ top: 0, left: 0 }}></div>
      <div className="glowing-dot" style={{ top: 0, right: 0 }}></div>
      <div className="glowing-dot" style={{ bottom: 0, left: 0 }}></div>
      <div className="glowing-dot" style={{ bottom: 0, right: 0 }}></div>
    </div>
    <div className="loading-text">Loading...</div>
  </div>
);

/* ================= COMPONENT ================= */

const Dashboard = () => {
  const navigate = useNavigate();

  /* ---------- REFS ---------- */
  const fileInputRef = useRef(null);
  const outsiderFileInputRef = useRef(null);
  const outsiderEventFileInputRef = useRef(null);

  // button & menu refs / positions (portal menus)
  const uploadButtonRef = useRef(null);
  const viewButtonRef = useRef(null);
  const uploadMenuRef = useRef(null);
  const viewMenuRef = useRef(null);
  const [uploadMenuPos, setUploadMenuPos] = useState(null);
  const [viewMenuPos, setViewMenuPos] = useState(null);

  /* ---------- AUTH ---------- */
  const [user, setUser] = useState(null);

  /* ---------- DATA ---------- */
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [outsiders, setOutsiders] = useState([]);
  const [ticketCount, setTicketCount] = useState(0);

  /* ---------- UI STATE ---------- */
  const [activeView, setActiveView] = useState("students");
  const [loading, setLoading] = useState(false);

  /* ---------- TABLE SEARCH ---------- */
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaidOnly, setShowPaidOnly] = useState(false);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);

  /* ---------- MODALS ---------- */
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTeacherStudents, setShowTeacherStudents] = useState(false);
  const [addStudentType, setAddStudentType] = useState("insider");

  /* ---------- ACTION STATE ---------- */
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [tempFeeStatus, setTempFeeStatus] = useState(null);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [teacherToView, setTeacherToView] = useState(null);
  const [teacherStudents, setTeacherStudents] = useState([]);
  const [teacherStudentsLoading, setTeacherStudentsLoading] = useState(false);
  const [teacherStudentsSearch, setTeacherStudentsSearch] = useState("");
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStudentIds, setBulkStudentIds] = useState([]);
  const [bulkFeeStatus, setBulkFeeStatus] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [activeYearFilter, setActiveYearFilter] = useState(null);
  const [activeBranchFilter, setActiveBranchFilter] = useState(null);

  const branchOptions = ["CSE", "ECE", "ME", "CE", "EE", "CSAI", "IT", "AIDS"];

  const filteredStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = Array.isArray(students) ? students : [];

    const filteredByRole = base.filter((s) => {
      if (user?.role === "dean") {
        const year = Number(s.Year ?? s.year);
        return year === 1;
      }
      if (user?.role === "hod") {
        const year = Number(s.Year ?? s.year);
        if (year === 1) return false;
      }
      if (!["admin", "superadmin", "dean"].includes(user?.role)) {
        if (!user?.branch) return true;
        return (s.branch || "").toLowerCase() === user.branch.toLowerCase();
      }
      return true;
    });

    const filteredBySearch = term
      ? filteredByRole.filter((s) =>
          `${s.name || ""} ${s.email || ""}`
            .toLowerCase()
            .includes(term)
        )
      : filteredByRole;

    let filteredByPaid = filteredBySearch;
    if (showPaidOnly) {
      filteredByPaid = filteredBySearch.filter((s) => !!s.isPaid);
    } else if (showUnpaidOnly) {
      filteredByPaid = filteredBySearch.filter((s) => !s.isPaid);
    }

    const filteredByYear =
      user?.role === "hod" && activeYearFilter
        ? filteredByPaid.filter(
            (s) => Number(s.Year ?? s.year) === Number(activeYearFilter)
          )
        : filteredByPaid;

    const filteredByBranch =
      user?.role === "dean" && activeBranchFilter
        ? filteredByYear.filter(
            (s) =>
              (s.branch || "").toLowerCase() ===
              String(activeBranchFilter).toLowerCase()
          )
        : filteredByYear;

    return filteredByBranch;
  }, [students, user, searchTerm, showPaidOnly, showUnpaidOnly, activeYearFilter, activeBranchFilter]);

  const filteredTeacherStudents = useMemo(() => {
    const term = teacherStudentsSearch.trim().toLowerCase();
    const base = Array.isArray(teacherStudents) ? teacherStudents : [];
    if (!term) return base;
    return base.filter((s) =>
      `${s.name || ""} ${s.email || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [teacherStudents, teacherStudentsSearch]);

  const outsiderEventRows = useMemo(() => {
    const base = Array.isArray(outsiders) ? outsiders : [];
    return base.filter((o) => {
      const passType = String(o.passType || "").toUpperCase();
      const hasEventName = String(o.eventName || "").trim().length > 0;
      return passType === "EVENT" || hasEventName;
    });
  }, [outsiders]);



  /* ---------- FORMS ---------- */
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    branch: "CSE",
    year: "",
  });

  const [newOutsider, setNewOutsider] = useState({
    name: "",
    email: "",
    phone: "",
    Day1: false,
    Day2: false,
    Day3: false,
    eventName: ""
  });

  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    password: "",
    role: "hod",
    branch: "CSE"
  });

  const [uploadResults, setUploadResults] = useState({
    found: [],
    notFound: [],
    // for outsider uploads
    inserted: 0,
    skipped: 0,
    sheets: [],
    skippedSamples: [],
    parseErrors: []
  });
  const [uploadType, setUploadType] = useState(null); // 'insider' | 'outsider' | 'outsider-event' | null

  /* ================= AUTH CHECK ================= */

  useEffect(() => {
    const token = localStorage.getItem("teacherToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setUser(decoded);

      setNewStudent((prev) => ({
        ...prev,
        branch: decoded.branch || "CSE",
        year: decoded.year || "",
      }));

      fetchStudents();
    } catch {
      localStorage.removeItem("teacherToken");
      navigate("/login");
    }
  }, [navigate]);

  /* ================= FETCH FUNCTIONS ================= */

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/teacher/students`,
        authHeader()
      );
      setStudents(res.data.data || []);
      setTicketCount(res.data.ticketCount || 0);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async (role = "") => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/teacher/teachers${role ? `?role=${role}` : ""}`,
        authHeader()
      );
      const data = res.data.data || res.data || [];
      setTeachers(data);
      setTicketCount(res.data.count || data.length || 0);
    } catch (err) {
      // Fallback for backends that don't accept multi-role filters (e.g., "hod,dean")
      if (role && role.includes(",")) {
        try {
          const roles = role.split(",").map((r) => r.trim()).filter(Boolean);
          const results = await Promise.all(
            roles.map((r) =>
              axios.get(`${API_BASE}/teacher/teachers?role=${r}`, authHeader())
            )
          );
          const merged = [];
          const seen = new Set();
          results.forEach((res) => {
            const list = res.data.data || res.data || [];
            list.forEach((t) => {
              const key = t._id || t.email || `${t.name}-${t.role}`;
              if (seen.has(key)) return;
              seen.add(key);
              merged.push(t);
            });
          });
          setTeachers(merged);
          setTicketCount(merged.length || 0);
          return;
        } catch (inner) {
          console.error("Fetch teachers fallback error:", inner);
        }
      } else {
        console.error("Fetch teachers error:", err);
      }
      setTeachers([]);
      setTicketCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutsiders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/outsider/list`,
        authHeader()
      );
      const data = res.data.data || res.data || [];
      setOutsiders(data);
      setTicketCount(data.length || 0);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIEW SWITCH ================= */

  useEffect(() => {
    if (!user) return;

    if (activeView === "students") fetchStudents();
    // Teachers list can be fetched by admin, hod, dean, superadmin (only CCs are blocked)
    if (activeView === "admins" && user.role === "superadmin") fetchTeachers("admin");
    if (activeView === "hods") fetchTeachers("hod,dean");
    if ((activeView === "outsiders" || activeView === "outsider-events") && (user.role === "admin" || user.role === "superadmin")) {
      fetchOutsiders();
    }
  }, [activeView, user]);

  // Real-time refresh for marked students modal
  useEffect(() => {
    if (!showTeacherStudents || !teacherToView?._id) return;
    const teacherId = teacherToView._id;
    const interval = setInterval(() => {
      fetchTeacherStudents(teacherId, { silent: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [showTeacherStudents, teacherToView?._id]);


  // close dropdowns when clicking outside or on scroll/resize
  useEffect(() => {
    const handler = (e) => {
      if (showUploadMenu) {
        if (
          uploadMenuRef.current && !uploadMenuRef.current.contains(e.target) &&
          uploadButtonRef.current && !uploadButtonRef.current.contains(e.target)
        ) {
          setShowUploadMenu(false);
        }
      }

      if (showViewMenu) {
        if (
          viewMenuRef.current && !viewMenuRef.current.contains(e.target) &&
          viewButtonRef.current && !viewButtonRef.current.contains(e.target)
        ) {
          setShowViewMenu(false);
        }
      }
    };

    const onScroll = () => { setShowUploadMenu(false); setShowViewMenu(false); };
    const onResize = () => { setShowUploadMenu(false); setShowViewMenu(false); };

    window.addEventListener('mousedown', handler);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [showUploadMenu, showViewMenu]);

  useEffect(() => {
    if (!multiSelectEnabled) {
      setSelectedStudentIds([]);
      setBulkMode(false);
      setBulkStudentIds([]);
      setBulkFeeStatus(null);
    }
  }, [multiSelectEnabled]);

  /* ================= ACTION HANDLERS ================= */

  const handleCheckboxClick = (id, current) => {
    setCurrentStudentId(id);
    setTempFeeStatus(!current);
    setShowConfirm(true);
  };

  const handleConfirmation = async (confirm) => {
    if (!confirm) {
      setShowConfirm(false);
      return;
    }
    if (bulkMode) {
      const ids = bulkStudentIds.slice();
      const status = !!bulkFeeStatus;
      setShowConfirm(false);
      setBulkMode(false);
      setBulkStudentIds([]);
      await applyBulkUpdate(ids, status);
      return;
    }
    await axios.patch(
      `${API_BASE}/teacher/students/fee`,
      { id: currentStudentId, isPaid: tempFeeStatus },
      authHeader()
    );
    setStudents((p) =>
      p.map((s) =>
        s._id === currentStudentId ? { ...s, isPaid: tempFeeStatus } : s
      )
    );
    setShowConfirm(false);
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const startBulkUpdate = (isPaid) => {
    if (selectedStudentIds.length === 0) {
      alert("Select at least one student.");
      return;
    }
    setBulkMode(true);
    setBulkStudentIds(selectedStudentIds);
    setBulkFeeStatus(isPaid);
    setShowConfirm(true);
  };

  const applyBulkUpdate = async (ids, isPaid) => {
    if (!ids.length) return;
    setBulkProcessing(true);
    const results = await Promise.allSettled(
      ids.map((id) =>
        axios.patch(
          `${API_BASE}/teacher/students/fee`,
          { id, isPaid },
          authHeader()
        )
      )
    );
    const successIds = [];
    results.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        successIds.push(ids[idx]);
      }
    });
    if (successIds.length) {
      setStudents((p) =>
        p.map((s) =>
          successIds.includes(s._id) ? { ...s, isPaid } : s
        )
      );
    }
    const failedCount = results.length - successIds.length;
    if (failedCount > 0) {
      alert(`Failed to update ${failedCount} student(s).`);
    }
    setSelectedStudentIds([]);
    setBulkProcessing(false);
  };

  const handleAddStudent = async (isPaid = false) => {
    if (newStudent.year < 1 || newStudent.year > 4) {
      alert("Year must be between 1 and 4");
      return;
    }

    await axios.post(
      `${API_BASE}/teacher/students/manual`,
      {
        name: newStudent.name,
        email: newStudent.email,
        branch: newStudent.branch,
        Year: Number(newStudent.year),
        isPaid: !!isPaid
      },
      authHeader()
    );

    fetchStudents();
    setShowAddModal(false);
    setAddStudentType("insider");
    setNewStudent((p) => ({ ...p, name: "", email: "" }));
  };

  const handleAddOutsider = async () => {
    const payload = {
      name: newOutsider.name,
      email: newOutsider.email,
      phone: newOutsider.phone,
      Day1: !!newOutsider.Day1,
      Day2: !!newOutsider.Day2,
      Day3: !!newOutsider.Day3,
      eventName: newOutsider.eventName
    };

    try {
      await axios.post(`${API_BASE}/outsider/manual`, payload, authHeader());
      setShowAddModal(false);
      setAddStudentType("insider");
      setNewOutsider({
        name: "",
        email: "",
        phone: "",
        Day1: false,
        Day2: false,
        Day3: false,
        eventName: ""
      });
      fetchOutsiders && fetchOutsiders();
    } catch (err) {
      console.error("Create outsider error:", err);
      alert(err.response?.data?.message || "Failed to create outsider.");
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();

    // Basic client-side validation matching backend rules
    const { name, email, password, role, branch, year } = newTeacher;

    if (!name || !email || !password) {
      alert("Name, email and password are required");
      return;
    }

    if (role === "admin") {
      // admin shouldn't have branch/year
    }

    if (role === "hod" && !branch) {
      alert("Branch is required for HOD");
      return;
    }

    const payload = { name, email, password, role };
    if (role === "hod") payload.branch = branch || undefined;

    try {
      await axios.post(`${API_BASE}/teacher/teachers`, payload, authHeader());
      setShowAdminModal(false);
      fetchTeachers();
      // reset form
      setNewTeacher({ name: "", email: "", password: "", role: "hod", branch: "CSE" });
    } catch (err) {
      console.error("Create teacher error:", err);
      alert(err.response?.data?.msg || "Failed to create teacher.");
    }
  };

  const handleDeleteTeacher = async () => {
    await axios.delete(
      `${API_BASE}/teacher/teachers/${teacherToDelete._id}`,
      authHeader()
    );
    setTeachers((p) => p.filter((t) => t._id !== teacherToDelete._id));
    setShowDeleteConfirm(false);
  };

  const handleViewTeacherStudents = async (teacher) => {
    if (!teacher?._id) return;
    setTeacherToView(teacher);
    setShowTeacherStudents(true);
    setTeacherStudentsLoading(true);
    await fetchTeacherStudents(teacher._id, { silent: false });
    setTeacherStudentsLoading(false);
  };

  const handleViewMyMarkedStudents = async () => {
    const myId = user?.id || user?._id;
    if (!myId) return;
    setTeacherToView({ _id: myId, name: "You" });
    setShowTeacherStudents(true);
    setTeacherStudentsLoading(true);
    await fetchTeacherStudents(myId, { silent: false });
    setTeacherStudentsLoading(false);
  };

  const fetchTeacherStudents = async (teacherId, { silent = false } = {}) => {
    try {
      const res = await axios.get(
        `${API_BASE}/teacher/teachers/${teacherId}/marked-students`,
        authHeader()
      );
      const data = res.data?.data || res.data || [];
      setTeacherStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch teacher students error:", err);
      if (!silent) setTeacherStudents([]);
    }
  };

  const handleOpenEventRegistrations = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/teacher/events/registrations-excel`,
        { ...authHeader(), responseType: "blob" }
      );

      const contentType =
        res.headers["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const opened = window.open(url, "_blank");

      if (!opened) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "Ren Event Data.xlsx";
        a.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("Export registrations error:", err);
      alert(err.response?.data?.msg || "Failed to open registrations export.");
    }
  };

  const handleOpenStudentsExcel = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/teacher/students/excel`,
        { ...authHeader(), responseType: "blob" }
      );

      const contentType =
        res.headers["content-type"] ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const opened = window.open(url, "_blank");

      if (!opened) {
        const a = document.createElement("a");
        a.href = url;
        a.download = "students.xlsx";
        a.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error("Export students error:", err);
      alert(err.response?.data?.msg || "Failed to open students export.");
    }
  };

  const handleExcelUpload = async (file, type) => {
    if (!file) return;

    // Guard: outsider uploads only allowed for admin/superadmin
    if ((type === 'outsider' || type === 'outsider-event') && !["admin", "superadmin"].includes(user?.role)) {
      alert("Access denied: only Admin or Superadmin can upload Outsider Excel files.");
      return;
    }
    if (type === 'insider' && !["admin", "superadmin"].includes(user?.role)) {
      alert("Access denied: only Admin or Superadmin can upload Insider Excel files.");
      return;
    }

    setUploadType(type);
    const fd = new FormData();
    fd.append("file", file);

    const isOutsiderUpload = type === "outsider" || type === "outsider-event";
    const url = isOutsiderUpload
      ? (type === "outsider-event"
        ? `${API_BASE}/outsider/event-excel`
        : `${API_BASE}/outsider/excel`)
      : `${API_BASE}/teacher/register-excel`;

    try {
      const res = await axios.post(url, fd, authHeader());

      if (isOutsiderUpload) {
        // backend returns summary, sheets, skipped samples
        const summary = res.data.summary || {};
        setUploadResults((prev) => ({
          ...prev,
          totalRows: summary.totalRows || 0,
          inserted: summary.inserted || 0,
          skipped: res.data.totalSkipped || 0,
          sheets: res.data.sheets || [],
          skippedSamples: res.data.skipped || [],
          parseErrors: res.data.parseErrors || [],
        }));
        // refresh outsiders list
        fetchOutsiders && fetchOutsiders();
      } else {
        setUploadResults({
          found: res.data.found || [],
          notFound: res.data.notFound || [],
        });
        fetchStudents();
      }

      setShowUploadModal(true);
    } catch (err) {
      console.error("Upload error:", err);

      // More helpful error messages for common auth issues
      if (err.response) {
        const status = err.response.status;
        const msg = err.response.data?.msg || err.response.data?.message || '';

        if (status === 401) {
          alert("Upload failed: Unauthorized. Please login again as an Admin/Teacher.");
          return;
        }

        if (status === 403) {
          alert(`Access denied: ${msg || 'You do not have permission to upload this file.'}`);
          return;
        }

        // Generic backend message
        alert(msg || "Upload failed. See server logs.");
      } else {
        alert("Network error. Please try again later.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    navigate("/teacher/login");
  };

  if (!user) return null;
  if (loading) return <FuturisticLoader />;

  return (
  <div className="main-wrapper">
    <div className="main-overlay"></div>

    <div className="scrollable-container">
      {/* ================= HEADER ================= */}
      <div className="header">
        <h1 className="title">
          {user?.role === "superadmin" ? "Super Admin Dashboard" : 
          user?.role === "admin" ? "Admin Dashboard" : 
          user?.role === "hod" ? "HOD Dashboard" : 
          user?.role === "dean" ? "Dean Dashboard" : "Dean Dashboard"}
        </h1>

        <div
          style={{
            color: "rgba(255,255,255,0.7)",
            marginBottom: "15px",
            fontSize: "0.9rem",
          }}
        >
          <strong>
            {activeView === "students"
              ? (showPaidOnly ? "Paid Students:" : showUnpaidOnly ? "Unpaid Students:" : "All Students:")
              : activeView === "outsiders"
              ? "Outsider Tickets:"
              : activeView === "outsider-events"
              ? "Outsider Event Tickets:"
              : "Teachers:"}
          </strong>{" "}
          {activeView === "students"
            ? filteredStudents.length
            : activeView === "outsider-events"
            ? outsiderEventRows.length
            : ticketCount}
        </div> 

        {/* ================= ACTION BUTTONS ================= */}
        <div className="actions">
          <div className="button-group horizontal">
              
              {/* ===== Upload Dropdown ===== */}

              {["admin", "superadmin"].includes(user?.role) && (
                <div className="relative" style={{ position: 'relative' }}>
                  <button
                    ref={uploadButtonRef}
                    className="glass-btn blue"
                    style={{ backgroundColor: "rgb(67, 110, 145)" }}
                    onClick={(e) => {
                      e.stopPropagation(); // <--- ADD THIS LINE
                      setShowViewMenu(false);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setUploadMenuPos({ 
                        top: rect.bottom + window.scrollY, 
                        left: rect.left + window.scrollX, 
                        width: rect.width 
                      });
                      setShowUploadMenu((prev) => !prev);
                    }}
                  >
                    Upload Excel
                  </button>



                  <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept=".xlsx,.xls"
                    onChange={(e) =>
                      handleExcelUpload(e.target.files[0], "insider")
                    }
                  />

                  <input
                    type="file"
                    ref={outsiderFileInputRef}
                    hidden
                    accept=".xlsx,.xls"
                    onChange={(e) =>
                      handleExcelUpload(e.target.files[0], "outsider")
                    }
                  />

                  <input
                    type="file"
                    ref={outsiderEventFileInputRef}
                    hidden
                    accept=".xlsx,.xls"
                    onChange={(e) =>
                      handleExcelUpload(e.target.files[0], "outsider-event")
                    }
                  />
                </div>
              )}


            {/* ===== Add Student (Super Admin Only) ===== */}
            {user?.role === "superadmin" && (
              <button
                className="glass-btn"
                style={{ backgroundColor: "#5a9956ff" }}
                onClick={() => {
                  setAddStudentType("insider");
                  setShowAddModal(true);
                }}
              >
                + Add Student
              </button>
            )}

            {/* ===== New Teacher (Admin / Superadmin) ===== */}
            {(user?.role === "admin" || user?.role === "superadmin") && (
              <button
                className="glass-btn"
                style={{ backgroundColor: "#944ea0ff" }}
                onClick={() => setShowAdminModal(true)}
              >
                + New Teacher
              </button>
            )}

            {/* ===== View Dropdown ===== */}
            <div className="relative" style={{ position: 'relative' }}>
              <button
                ref={viewButtonRef}
                className="glass-btn"
                style={{ backgroundColor: "rgb(0,173,84)" }}
                onClick={(e) => {
                  setShowUploadMenu(false);
                  // capture rect synchronously
                  const rect = e.currentTarget && e.currentTarget.getBoundingClientRect();
                  const pos = rect ? { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width } : null;
                  setShowViewMenu((prev) => !prev);
                  if (pos) setViewMenuPos(pos);
                }}
              >
                View
              </button>


            </div>

            {/* ===== Logout ===== */}
            <button
              onClick={handleLogout}
              className="glass-btn"
              style={{ backgroundColor: "#a24747ff" }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Portal dropdown menus */}
      {showUploadMenu && uploadMenuPos && createPortal(
        <div
          ref={uploadMenuRef}
          className="dashboard-portal-menu bg-blue-800 rounded-lg"
          style={{ position: 'fixed', top: uploadMenuPos.top + 'px', left: uploadMenuPos.left + 'px', minWidth: uploadMenuPos.width + 'px' }}
        >
          <button
            className="dropdown-item"
            onClick={() => {
              fileInputRef.current.click();
              setShowUploadMenu(false);
            }}
          >
            Insider Excel
          </button>

          {(user?.role === "admin" || user?.role === "superadmin") && (
            <button
              className="dropdown-item"
              onClick={() => {
                outsiderFileInputRef.current.click();
                setShowUploadMenu(false);
              }}
            >
              Outsider Master Pass
            </button>
          )}

          {(user?.role === "admin" || user?.role === "superadmin") && (
            <button
              className="dropdown-item"
              onClick={() => {
                outsiderEventFileInputRef.current.click();
                setShowUploadMenu(false);
              }}
            >
              Outsider Event Pass
            </button>
          )}
        </div>,
        document.body
      )}

      {showViewMenu && viewMenuPos && createPortal(
        <div
          ref={viewMenuRef}
          className="dashboard-portal-menu bg-blue-800 rounded-lg"
          style={{ position: 'fixed', top: viewMenuPos.top + 'px', left: viewMenuPos.left + 'px', minWidth: viewMenuPos.width + 'px' }}
        >
          <button
            className="dropdown-item"
            onClick={() => {
              setActiveView("students");
              setShowViewMenu(false);
            }}
          >
            View Students
          </button>

          <button
            className="dropdown-item"
            onClick={() => {
              setShowViewMenu(false);
              handleOpenStudentsExcel();
            }}
          >
            Students (Excel)
          </button>

          {/* Only superadmin can view admins */}
          {user?.role === "superadmin" && (
            <button
              className="dropdown-item"
              onClick={() => {
                setActiveView("admins");
                setShowViewMenu(false);
              }}
            >
              View Admins
            </button>
          )}

          {/* HODs/Deans listing is meaningful for admin and superadmin, but also allowed for others */}
          {user?.role !== "cc" && (
            <button
              className="dropdown-item"
              onClick={() => {
                setActiveView("hods");
                setShowViewMenu(false);
              }}
            >
              View HODs / Deans
            </button>
          )}

          {user?.role === "superadmin" && (
            <button
              className="dropdown-item"
              onClick={() => {
                setShowViewMenu(false);
                handleViewMyMarkedStudents();
              }}
            >
              My Marked Students
            </button>
          )}

          {(user?.role === "admin" || user?.role === "superadmin") && (
            <button
              className="dropdown-item"
              onClick={() => {
                setActiveView("outsiders");
                setShowViewMenu(false);
              }}
            >
              View Outsiders
            </button>
          )}

          {(user?.role === "admin" || user?.role === "superadmin") && (
            <button
              className="dropdown-item"
              onClick={() => {
                setActiveView("outsider-events");
                setShowViewMenu(false);
              }}
            >
              View Outsider Events
            </button>
          )}

          {user?.role === "superadmin" && (
            <button
              className="dropdown-item"
              onClick={() => {
                setShowViewMenu(false);
                handleOpenEventRegistrations();
              }}
            >
              Event Registrations (Excel)
            </button>
          )}
        </div>,
        document.body
      )}

      {/* ================= TABLE SEARCH (STUDENTS) ================= */}
      {activeView === "students" && (
        <div className="mb-4" style={{ maxWidth: 900, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students by name or email..."
            className="glass-input w-full"
          />
          <button
            className="glass-btn"
            style={{ backgroundColor: showPaidOnly ? "#1f8f5cff" : "rgba(255,255,255,0.12)" }}
            onClick={() => {
              setShowPaidOnly((p) => {
                const next = !p;
                if (next) setShowUnpaidOnly(false);
                return next;
              });
            }}
          >
            {showPaidOnly ? "Showing Paid" : "Only Paid"}
          </button>
          <button
            className="glass-btn"
            style={{ backgroundColor: showUnpaidOnly ? "#ef4444" : "rgba(255,255,255,0.12)" }}
            onClick={() => {
              setShowUnpaidOnly((p) => {
                const next = !p;
                if (next) setShowPaidOnly(false);
                return next;
              });
            }}
          >
            {showUnpaidOnly ? "Showing Unpaid" : "Only Unpaid"}
          </button>
          <button
            className="glass-btn"
            style={{ backgroundColor: multiSelectEnabled ? "#2563eb" : "rgba(255,255,255,0.12)" }}
            onClick={() => setMultiSelectEnabled((p) => !p)}
          >
            {multiSelectEnabled ? "Multi Select ON" : "Multi Select OFF"}
          </button>
          {multiSelectEnabled && (
            <>
              <button
                className="glass-btn"
                style={{ backgroundColor: "#16a34a" }}
                onClick={() => startBulkUpdate(true)}
                disabled={bulkProcessing}
              >
                Mark Selected Paid
              </button>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                Selected: {selectedStudentIds.length}
              </div>
            </>
          )}
        </div>
      )}

      {activeView === "students" && user?.role === "hod" && (
        <div className="mb-4" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="glass-btn"
            style={{ backgroundColor: !activeYearFilter ? "#1f8f5cff" : "rgba(255,255,255,0.12)" }}
            onClick={() => setActiveYearFilter(null)}
          >
            All Years
          </button>
          {[2, 3, 4].map((yr) => (
            <button
              key={yr}
              className="glass-btn"
              style={{ backgroundColor: activeYearFilter === yr ? "#1f8f5cff" : "rgba(255,255,255,0.12)" }}
              onClick={() => setActiveYearFilter(yr)}
            >
              Year {yr}
            </button>
          ))}
        </div>
      )}

      {activeView === "students" && user?.role === "dean" && (
        <div className="mb-4" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="glass-btn"
            style={{ backgroundColor: !activeBranchFilter ? "#1f8f5cff" : "rgba(255,255,255,0.12)" }}
            onClick={() => setActiveBranchFilter(null)}
          >
            All Branches
          </button>
          {branchOptions.map((br) => (
            <button
              key={br}
              className="glass-btn"
              style={{ backgroundColor: activeBranchFilter === br ? "#1f8f5cff" : "rgba(255,255,255,0.12)" }}
              onClick={() => setActiveBranchFilter(br)}
            >
              {br}
            </button>
          ))}
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="tableWrapper">
        <table className="table">
          <thead>
            {activeView === "students" && (
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Branch</th>
                <th className="th">Year</th>
                {multiSelectEnabled ? (
                  <th className="th">Select</th>
                ) : (
                  <th className="th">Fee Paid</th>
                )}
              </tr>
            )}

            {["teachers", "admins", "hods"].includes(activeView) && (
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Branch</th>
                {user?.role === "admin" || user?.role === "superadmin" && <th className="th">Action</th>}
              </tr>
            )}

            {activeView === "outsiders" && (
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Days</th>
              </tr>
            )}

            {activeView === "outsider-events" && (
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Phone</th>
                <th className="th">Day</th>
                <th className="th">Event</th>
              </tr>
            )}
          </thead>

          <tbody>
            {/* Students View */}
            {activeView === "students" && (
              (filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td className="td">{student.name}</td>
                    <td className="td">{student.email}</td>
                    <td className="td">{student.branch}</td>
                    <td className="td">{student.Year ?? student.year ?? "-"}</td>
                    {multiSelectEnabled ? (
                      <td className="td">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student._id)}
                          onChange={() => toggleSelectStudent(student._id)}
                          className="checkbox"
                        />
                      </td>
                    ) : (
                      <td className="td">
                        <input
                          type="checkbox"
                          checked={!!student.isPaid}
                          onChange={() => handleCheckboxClick(student._id, student.isPaid)}
                          className="checkbox"
                        />
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={multiSelectEnabled ? "5" : "5"} className="td" style={{ textAlign: "center" }}>
                    No students found
                  </td>
                </tr>
              ))
            )}

            {/* Teachers / Admins / HODs View */}
            {['admins', 'hods', 'teachers'].includes(activeView) && (
              teachers.length > 0 ? (
                teachers.map((t) => (
                  <tr key={t._id}>
                    <td className="td">{t.name}</td>
                    <td className="td">{t.email}</td>
                    <td className="td">{t.role}</td>
                    <td className="td">{t.branch}</td>
                    {user?.role === 'admin' || user?.role === 'superadmin' && (
                      <td className="td">
                        <button
                          className="confirmButton"
                          style={{ marginRight: 8 }}
                          onClick={() => handleViewTeacherStudents(t)}
                        >
                          View Marked
                        </button>
                        <button
                          className="cancelButton"
                          onClick={() => {
                            setTeacherToDelete(t);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="td" style={{ textAlign: "center" }}>
                    No teachers found
                  </td>
                </tr>
              )
            )}

            {/* Outsiders View */}
            {activeView === "outsiders" &&
              outsiders.map((o) => (
                <tr key={o._id}>
                  <td className="td">{o.name}</td>
                  <td className="td">{o.email}</td>
                  <td className="td">{o.phone}</td>
                  <td className="td">
                    {o.Day1 && "Day 1 "}
                    {o.Day2 && "Day 2 "}
                    {o.Day3 && "Day 3"}
                  </td>
                </tr>
              ))}

            {activeView === "outsider-events" &&
              outsiderEventRows.map((o) => (
                <tr key={o._id}>
                  <td className="td">{o.name}</td>
                  <td className="td">{o.email}</td>
                  <td className="td">{o.phone}</td>
                  <td className="td">
                    {o.Day1 && "Day 1 "}
                    {o.Day2 && "Day 2 "}
                    {o.Day3 && "Day 3"}
                  </td>
                  <td className="td">{o.eventName || ""}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>


{/* ======================= MODALS ======================= */}

/* ---------- CONFIRM PAYMENT MODAL ---------- */
{showConfirm && (
  <div className="modalOverlay">
    <div className="modal">
      <h2 className="modalTitle">Confirm Update</h2>
      <p>
        {bulkMode
          ? `Change fee status for ${bulkStudentIds.length} students?`
          : "Change fee status?"}
      </p>

      <div className="border border-gray-600 rounded p-3 bg-gray-800">
        <div className="modalActions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            className="cancelButton"
            onClick={() => setShowConfirm(false)}
          >
            Cancel
          </button>
          <button
            className={`confirmButton ${
              (bulkMode ? bulkFeeStatus : tempFeeStatus) ? 'btn-green' : 'btn-orange'
            }`}
            onClick={() => handleConfirmation(true)}
            disabled={bulkProcessing}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </div>
)}


/* ---------- ADD / SEARCH STUDENT MODAL ---------- */
{showAddModal && user?.role === "superadmin" && (
  <div className="modalOverlay">
    <div className="modal">
      <h2 className="modalTitle">Manual Entry</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          className="glass-btn"
          style={{ backgroundColor: addStudentType === "insider" ? "#1f8f5cff" : "rgba(255,255,255,0.12)" }}
          onClick={() => setAddStudentType("insider")}
        >
          Insider Student
        </button>
        <button
          className="glass-btn"
          style={{ backgroundColor: addStudentType === "outsider" ? "#1f8f5cff" : "rgba(255,255,255,0.12)" }}
          onClick={() => setAddStudentType("outsider")}
        >
          Outsider Student
        </button>
      </div>

      {addStudentType === "insider" ? (
        <div className="flex flex-col gap-3">
          <input
            className="bg-gray-700 p-2 rounded text-white"
            placeholder="Name"
            value={newStudent.name}
            onChange={(e) =>
              setNewStudent({ ...newStudent, name: e.target.value })
            }
          />

          <input
            className="bg-gray-700 p-2 rounded text-white"
            placeholder="Email"
            value={newStudent.email}
            onChange={(e) =>
              setNewStudent({ ...newStudent, email: e.target.value })
            }
          />

          <select
            className="bg-gray-700 p-2 rounded text-white"
            value={newStudent.branch}
            onChange={(e) =>
              setNewStudent({ ...newStudent, branch: e.target.value })
            }
          >
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
            <option value="CE">CE</option>
            <option value="EE">EE</option>
            <option value="CSAI">CSAI</option>
            <option value="IT">IT</option>
            <option value="AIDS">AIDS</option>
          </select>

          <input
            type="number"
            className="bg-gray-700 p-2 rounded text-white"
            placeholder="Year"
            value={newStudent.year}
            onChange={(e) =>
              setNewStudent({ ...newStudent, year: e.target.value })
            }
          />

          <div style={{display:'flex', gap:8}}>
            <button
              className="btn-orange confirmButton"
              onClick={() => handleAddStudent(false)}
              style={{width:'50%'}}
            >
              Register
            </button>
            <button
              className="btn-green confirmButton"
              onClick={() => handleAddStudent(true)}
              style={{width:'50%'}}
            >
              Register & Paid
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            className="bg-gray-700 p-2 rounded text-white"
            placeholder="Name"
            value={newOutsider.name}
            onChange={(e) =>
              setNewOutsider({ ...newOutsider, name: e.target.value })
            }
          />

          <input
            className="bg-gray-700 p-2 rounded text-white"
            placeholder="Email"
            value={newOutsider.email}
            onChange={(e) =>
              setNewOutsider({ ...newOutsider, email: e.target.value })
            }
          />

          <input
            className="bg-gray-700 p-2 rounded text-white"
            placeholder="Phone"
            value={newOutsider.phone}
            onChange={(e) =>
              setNewOutsider({ ...newOutsider, phone: e.target.value })
            }
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={!!newOutsider.Day1}
                onChange={(e) =>
                  setNewOutsider({ ...newOutsider, Day1: e.target.checked })
                }
              />
              Day 1
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={!!newOutsider.Day2}
                onChange={(e) =>
                  setNewOutsider({ ...newOutsider, Day2: e.target.checked })
                }
              />
              Day 2
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={!!newOutsider.Day3}
                onChange={(e) =>
                  setNewOutsider({ ...newOutsider, Day3: e.target.checked })
                }
              />
              Day 3
            </label>
          </div>

          <input
            className="bg-gray-700 p-2 rounded text-white"
            placeholder="Event (optional)"
            value={newOutsider.eventName}
            onChange={(e) =>
              setNewOutsider({ ...newOutsider, eventName: e.target.value })
            }
          />

          <div style={{display:'flex', gap:8}}>
            <button
              className="btn-green confirmButton"
              onClick={handleAddOutsider}
              style={{width:'100%'}}
            >
              Create Outsider Pass
            </button>
          </div>
        </div>
      )}

      <button
        className="cancelButton mt-4 w-full"
        onClick={() => {
          setShowAddModal(false);
          setAddStudentType("insider");
        }}
      >
        Close
      </button>
    </div>
  </div>
)}


/* ---------- EXCEL UPLOAD RESULT MODAL ---------- */
{showUploadModal && (
  <div className="modalOverlay">
    <div className="modal">
      <h2 className="modalTitle">Bulk Upload Result</h2>

      {(uploadType === 'outsider' || uploadType === 'outsider-event') ? (
        <>
          <p style={{ color: "#93c5fd" }}>
            <strong>
              {uploadType === 'outsider-event' ? "Outsider Event Pass" : "Outsider Master Pass"}
            </strong>
          </p>
          <p style={{ color: "#10b981" }}>
            ✅ Inserted: <strong>{uploadResults.inserted}</strong>
          </p>
          <p style={{ color: "#ef4444" }}>
            ⚠️ Skipped: <strong>{uploadResults.skipped}</strong>
          </p>
          <p>
            📄 Parsed rows: <strong>{uploadResults.totalRows ?? '-'}</strong>
          </p>

          {uploadResults.sheets && uploadResults.sheets.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Sheets detected:</strong>
              <ul>
                {uploadResults.sheets.map((s, idx) => (
                  <li key={idx}>{s.sheet} (header row: {s.headerRowIndex || 'none'})</li>
                ))}
              </ul>
            </div>
          )}

          {uploadResults.skippedSamples && uploadResults.skippedSamples.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Sample skipped rows:</strong>
              <pre style={{ maxHeight: 160, overflow: 'auto', background: '#111', padding: 8, color: '#eee' }}>{JSON.stringify(uploadResults.skippedSamples.slice(0, 10), null, 2)}</pre>
            </div>
          )}

          {uploadResults.parseErrors && uploadResults.parseErrors.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Parse errors:</strong>
              <pre style={{ maxHeight: 160, overflow: 'auto', background: '#111', padding: 8, color: '#eee' }}>{JSON.stringify(uploadResults.parseErrors.slice(0, 10), null, 2)}</pre>
            </div>
          )}

        </>
      ) : (
        <p style={{ color: "#10b981" }}>
          ✅ Found: <strong>{uploadResults.found.length}</strong>
        </p>
      )}

      <div className="modalActions">
        <button
          className="confirmButton"
          onClick={() => setShowUploadModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


/* ---------- CREATE TEACHER MODAL ---------- */
{showAdminModal && (
  <div className="modalOverlay">
    <div className="modal">
      <h2 className="modalTitle">Create Teacher</h2>

      <form onSubmit={handleCreateTeacher} className="flex flex-col gap-3">
        <input
          required
          placeholder="Name"
          className="bg-gray-700 p-2 rounded"
          onChange={(e) =>
            setNewTeacher({ ...newTeacher, name: e.target.value })
          }
        />

        <input
          required
          type="email"
          placeholder="Email"
          className="bg-gray-700 p-2 rounded"
          onChange={(e) =>
            setNewTeacher({ ...newTeacher, email: e.target.value })
          }
        />

        <input
          required
          type="password"
          placeholder="Password"
          className="bg-gray-700 p-2 rounded"
          onChange={(e) =>
            setNewTeacher({ ...newTeacher, password: e.target.value })
          }
        />

        <select
          className="bg-gray-700 p-2 rounded"
          value={newTeacher.role}
          onChange={(e) => {
            const role = e.target.value;
            setNewTeacher((prev) => {
              const next = { ...prev, role };
              if (role === "admin") {
                next.branch = "";
                next.year = "";
              }
              if (role === "hod" || role === "dean") next.year = "";
              if (role === "dean") next.branch = "";
              return next;
            });
          }}
        >
          <option value="admin">Admin</option>
          <option value="hod">HOD</option>
          <option value="dean">Dean</option>
        </select>

        {/* branch is shown for hod only */}
        {newTeacher.role === "hod" && (
          <select
            className="bg-gray-700 p-2 rounded"
            value={newTeacher.branch}
            onChange={(e) =>
              setNewTeacher({ ...newTeacher, branch: e.target.value })
            }
          >
            <option value="">Select Branch</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="ME">ME</option>
            <option value="CE">CE</option>
            <option value="EE">EE</option>
            <option value="CSAI">CSAI</option>
            <option value="IT">IT</option>
            <option value="AIDS">AIDS</option>
          </select>
        )}

        <button type="submit" className="confirmButton">
          Create
        </button>

        <button
          type="button"
          className="cancelButton"
          onClick={() => setShowAdminModal(false)}
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
)}


/* ---------- DELETE TEACHER MODAL ---------- */
{showDeleteConfirm && teacherToDelete && (
  <div className="modalOverlay">
    <div className="modal">
      <h2 className="modalTitle" style={{ color: "#ef4444" }}>
        Delete Teacher
      </h2>

      <p>
        Are you sure you want to delete{" "}
        <strong>{teacherToDelete.name}</strong>?
      </p>

      <div className="modalActions">
        <button
          className="cancelButton"
          onClick={() => {
            setShowDeleteConfirm(false);
            setTeacherToDelete(null);
          }}
        >
          Cancel
        </button>

        <button
          className="confirmButton"
          style={{ background: "#dc2626" }}
          onClick={handleDeleteTeacher}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}


/* ---------- TEACHER MARKED STUDENTS MODAL ---------- */
{showTeacherStudents && teacherToView && (
  <div className="modalOverlay">
    <div className="modal" style={{ maxWidth: 720 }}>
      <h2 className="modalTitle">
        Marked Students - {teacherToView.name}
      </h2>

      <input
        type="text"
        value={teacherStudentsSearch}
        onChange={(e) => setTeacherStudentsSearch(e.target.value)}
        placeholder="Search marked students by name or email..."
        className="glass-input w-full"
        style={{ marginBottom: 12 }}
      />

      {teacherStudentsLoading ? (
        <p>Loading...</p>
      ) : filteredTeacherStudents.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <div className="tableWrapper" style={{ maxHeight: 360 }}>
          <table className="table">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Branch</th>
                <th className="th">Year</th>
                <th className="th">Paid</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeacherStudents.map((s) => (
                <tr key={s._id || s.email}>
                  <td className="td">{s.name || "-"}</td>
                  <td className="td">{s.email || "-"}</td>
                  <td className="td">{s.branch || "-"}</td>
                  <td className="td">{s.Year ?? s.year ?? "-"}</td>
                  <td className="td">{s.isPaid ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="modalActions" style={{ marginTop: 12 }}>
        <button
          className="cancelButton"
          onClick={() => {
            setShowTeacherStudents(false);
            setTeacherToView(null);
            setTeacherStudents([]);
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
</div>
);
};


export default Dashboard;
