import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/dashboard/Sidebar";
import Header from "./components/dashboard/Header";
import ScheduleTab from "./components/dashboard/tabs/ScheduleTab";
import HomeTab from "./components/dashboard/tabs/HomeTab";
import NotebookTab from "./components/dashboard/tabs/NotebookTab";
import EquipmentTab from "./components/dashboard/tabs/EquipmentTab";
import SubmissionsTab from "./components/dashboard/tabs/SubmissionsTab";
import ModulesTab from "./components/dashboard/tabs/ModulesTab";
import FacultyManagementTab from "./components/dashboard/tabs/FacultyManagementTab";
import TeacherSubmissionsTab from "./components/dashboard/tabs/TeacherSubmissionsTab";
import AdminUsersTab from "./components/dashboard/tabs/AdminUsersTab";
import api from "./services/api";

function Dashboard({ user, userName, onLogout }) {
  // Default to admin view for administrators, and schedule view for students/teachers
  const userRole = user?.role || "student";
  const isTeacher = userRole === "teacher";
  const isAdmin = userRole === "admin";
  const [activePage, setActivePage] = useState(isAdmin ? "admin" : "schedule");

  const [labs, setLabs] = useState([]);
  const [allLabs, setAllLabs] = useState([]);
  const [teacherBatches, setTeacherBatches] = useState([]);
  const [dueItems, setDueItems] = useState([]);
  const [studentRecords, setStudentRecords] = useState([]);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [pendingClearancesCount, setPendingClearancesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchDashboardData = useCallback(async (quiet = false) => {
    try {
      if (quiet) {
        setIsSyncing(true);
      } else {
        setLoading(true);
      }

      const labParams = (userRole === "student" && user?.branch && user?.semester)
        ? { branch: user.branch, semester: user.semester }
        : {};

      const studentParams = isTeacher
        ? { role: "teacher", userId: user?.userId || user?.user_id, userName: user?.name, branch: user?.branch, dept: user?.dept }
        : (isAdmin ? { role: "admin" } : {});

      const [labsData, batchesData, deliverablesData, studentsData, submissionsData, allLabsData, requestsData] = await Promise.all([
        api.labs.getAll(labParams).catch(() => []),
        api.batches.getAll().catch(() => []),
        api.deliverables.getAll().catch(() => []),
        api.studentRecords.getAll(studentParams).catch(() => []),
        api.submissions.getAll().catch(() => []),
        api.labs.getAll().catch(() => []),
        isAdmin ? api.admin.getStudentRequests().catch(() => []) : Promise.resolve([]),
      ]);

      setLabs(labsData);
      setAllLabs(allLabsData.length > 0 ? allLabsData : labsData);
      setTeacherBatches(batchesData);
      setDueItems(deliverablesData);
      setStudentRecords(studentsData);
      setStudentSubmissions(submissionsData);
      if (isAdmin && Array.isArray(requestsData)) {
        setPendingClearancesCount(requestsData.filter((r) => r.status === 'pending').length);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.error("Failed to load real-time dashboard data:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [userRole, user?.branch, user?.semester, isTeacher, isAdmin, user?.userId, user?.user_id, user?.name, user?.dept]);

  // Initial load and real-time interval polling
  useEffect(() => {
    fetchDashboardData(false);

    // Real-time data interval polling (every 10 seconds for fresh live telemetry)
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 10000);

    const handleFocus = () => fetchDashboardData(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchDashboardData]);

  const handleUpdateGrade = async (studentId, newGrade, newAttendance) => {
    try {
      const updated = await api.studentRecords.updateGrade(studentId, {
        grade: newGrade,
        attendance: newAttendance,
      });

      setStudentRecords((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, grade: updated.grade, attendance: updated.attendance } : s))
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to update student grade:", error);
      return { success: false, error: error.message };
    }
  };

  const handleAddModule = async (labId, newModule) => {
    try {
      await api.labs.addModule(labId, newModule);
      const updatedLabs = await api.labs.getAll();
      setLabs(updatedLabs);
      return { success: true };
    } catch (error) {
      console.error("Failed to publish module:", error);
      return { success: false, error: error.message };
    }
  };

  const handleRefreshSubmissions = async () => {
    try {
      const [subs, deliverables] = await Promise.all([
        api.submissions.getAll(),
        api.deliverables.getAll(),
      ]);
      setStudentSubmissions(subs);
      setDueItems(deliverables);
    } catch (err) {
      console.error("Failed to refresh submissions:", err);
    }
  };

  return (
    <div className="image1-dashboard-shell">
      {/* 1. Left Slim Icon Sidebar (Image 1) */}
      <Sidebar
        userRole={userRole}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={onLogout}
        pendingClearancesCount={pendingClearancesCount}
      />

      {/* 2. Main Dashboard Content Area */}
      <div className="image1-dashboard-content">
        {/* Top Header with Search, Pending Invites, Profile Menu, Real-Time Clock & Data Sync */}
        <Header
          user={user}
          userName={userName}
          userRole={userRole}
          activePage={activePage}
          onLogout={onLogout}
          lastSyncTime={lastSyncTime}
          isSyncing={isSyncing}
          onSyncNow={() => fetchDashboardData(true)}
        />

        {/* Admin Pending Clearances Notification Banner */}
        {isAdmin && pendingClearancesCount > 0 && activePage !== "admin" && (
          <div
            style={{
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.16), rgba(245, 158, 11, 0.05))',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 18px',
              margin: '0 24px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
              <div>
                <strong style={{ color: '#f59e0b', fontSize: '13px' }}>
                  {pendingClearancesCount} Student Registration {pendingClearancesCount === 1 ? 'Applicant' : 'Applicants'} Awaiting Administrator Clearance
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  New students cannot access experiment notebooks or workbenches until cleared by Administrator.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('admin')}
              style={{
                background: '#f59e0b',
                color: '#000',
                fontWeight: '700',
                fontSize: '12px',
                padding: '7px 16px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
              }}
            >
              Open Clearance Queue &rarr;
            </button>
          </div>
        )}

        {/* Sync Status Notice */}
        {loading && (
          <div className="dashboard-sync-banner">
            <span className="dot green" />
            <span>Synchronizing live state with laboratory workbench servers...</span>
          </div>
        )}

        {/* Dynamic Views */}
        <main className="dashboard-view-container">
          {/* A. Schedule & Timeline Tab (Image 1 Main Feature) */}
          {activePage === "schedule" && (
            <ScheduleTab
              labs={labs}
              allLabs={allLabs}
              user={user}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
              lastSyncTime={lastSyncTime}
              isSyncing={isSyncing}
              onSyncNow={() => fetchDashboardData(true)}
            />
          )}

          {/* B. Command Overview Tab */}
          {activePage === "home" && (
            <HomeTab
              labs={labs}
              dueItems={dueItems}
              teacherBatches={teacherBatches}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
              onNavigate={setActivePage}
            />
          )}

          {/* C. Attendance Records & Notebooks */}
          {activePage === "notebook" && (
            <NotebookTab
              user={user}
              studentRecords={studentRecords}
              labs={labs}
              allLabs={allLabs}
              onRefresh={fetchDashboardData}
            />
          )}

          {/* D. Workstation Instruments & Equipment Matrix */}
          {activePage === "equipment" && (
            <EquipmentTab
              labs={labs}
              allLabs={allLabs}
              studentRecords={studentRecords}
              user={user}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
            />
          )}

          {/* E. Experiment Deliverables & Tasks */}
          {activePage === "submissions" && (
            <SubmissionsTab
              dueItems={dueItems}
              labs={labs}
              allLabs={allLabs}
              user={user}
              userRole={userRole}
              userName={userName}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
              onSubmissionCreated={handleRefreshSubmissions}
            />
          )}

          {/* F. Protocol Manuals & Modules */}
          {activePage === "modules" && (
            <ModulesTab
              labs={labs}
              allLabs={allLabs}
              user={user}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
              onAddModule={handleAddModule}
            />
          )}

          {/* G. Faculty Controls: Student Grading & Performance Analytics */}
          {activePage === "upload" && (isTeacher || isAdmin) && (
            <FacultyManagementTab
              labs={labs}
              allLabs={allLabs}
              user={user}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
              studentRecords={studentRecords}
              onUpdateGrade={handleUpdateGrade}
            />
          )}

          {/* H. Faculty Controls: Student Submissions Review Queue */}
          {activePage === "teacherSubmissions" && (isTeacher || isAdmin) && (
            <TeacherSubmissionsTab
              studentSubmissions={studentSubmissions}
              user={user}
              isTeacher={isTeacher}
              isAdmin={isAdmin}
              onSubmissionsChanged={handleRefreshSubmissions}
            />
          )}

          {/* I. Administrative Controls: System Registry & Clearance */}
          {activePage === "admin" && isAdmin && (
            <AdminUsersTab
              studentRecords={studentRecords}
              user={user}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;