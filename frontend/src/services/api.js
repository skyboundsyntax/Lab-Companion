const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8000/api';

// Realistic fallback fixtures for resilient offline demonstration
const MOCK_LABS = [
  {
    id: 'LAB-101',
    name: 'Applied Sensorics & Biomechanics',
    room: 'Hall Alpha - Bench 04',
    day: 'Monday',
    time: '11:00 - 13:00',
    teacher: 'Dr. Aris Vance',
    credits: 4,
    update: 'Force sensor calibration verified against NIST standards.',
    modules: [
      { title: 'Module 1: Piezoelectric Transducers', file: 'LAB101_Mod01_Piezo.pdf' },
      { title: 'Module 2: Load Cell Calibration', file: 'LAB101_Mod02_LoadCells.pdf' }
    ],
    equipmentStatus: [
      { name: 'Load Cell Telemetry Unit', status: 'Working', count: '12/12 Units', note: 'Firmware v2.4 verified' },
      { name: 'Piezoelectric Sensor Kit', status: 'Available', count: '8 Kits', note: 'All channels operational' },
    ]
  },
  {
    id: 'LAB-204',
    name: 'Analytical Reagent Spectrometry',
    room: 'Chemical Annex - Bay 12',
    day: 'Wednesday',
    time: '14:00 - 16:30',
    teacher: 'Prof. Sarah Jenkins',
    credits: 3,
    update: 'UV-Vis spectrophotometer lamp calibrated this morning.',
    modules: [
      { title: 'Module 1: Absorbance Spectroscopy', file: 'LAB204_Mod01_UVVis.pdf' },
      { title: 'Module 2: Solution Stoichiometry', file: 'LAB204_Mod02_Stoichiometry.pdf' }
    ],
    equipmentStatus: [
      { name: 'UV-Vis Spectrophotometer', status: 'Moderate', count: '4/6 Stations', note: 'Station 2 lamp scheduled for replacement' },
      { name: 'Reagent Micro-Pipettes', status: 'Working', count: '24 Units', note: 'Calibrated to ±0.2 µL' },
    ]
  },
  {
    id: 'LAB-302',
    name: 'Digital Signal Processing & FPGA',
    room: 'Microelectronics Tower - Lab 302',
    day: 'Thursday',
    time: '10:00 - 12:30',
    teacher: 'Dr. Marcus Brody',
    credits: 4,
    update: 'FPGA Vivado license server updated to 2026.1.',
    modules: [
      { title: 'Module 1: FIR Filter Synthesis on Cyclone IV', file: 'LAB302_Mod01_FIR.pdf' },
      { title: 'Module 2: Real-time FFT Signal Capture', file: 'LAB302_Mod02_FFT.pdf' }
    ],
    equipmentStatus: [
      { name: '100MHz Digital Oscilloscope', status: 'Working', count: '16/16 Benches', note: 'All probes tested' },
      { name: 'Cyclone IV FPGA Boards', status: 'Working', count: '16 Boards', note: 'JTAG interfaces online' },
    ]
  }
];

const MOCK_BATCHES = [];
const MOCK_DELIVERABLES = [];
const MOCK_STUDENTS = [];
const MOCK_SUBMISSIONS = [];
const MOCK_EQUIPMENT_ASSIGNMENTS = [];
const MOCK_WORKBENCHES = [];

async function request(endpoint, options = {}, fallbackData = null) {
  const url = `${API_BASE_URL}${endpoint}`;

  let authHeaders = {};
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const savedUser = window.localStorage.getItem('currentUser');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const token = parsed.token || parsed.auth_token;
        const uid = parsed.user_id || parsed.userId || parsed.email || (parsed.role === 'admin' ? 'admin' : '');
        const email = parsed.email || '';
        const role = parsed.role || (email.toLowerCase() === 'admin@gmail.com' ? 'admin' : '');
        if (token) {
          authHeaders['Authorization'] = `Bearer ${token}`;
        }
        if (uid) {
          authHeaders['X-User-Id'] = uid;
        }
        if (email) {
          authHeaders['X-User-Email'] = email;
        }
        if (role) {
          authHeaders['X-User-Role'] = role;
        }
      }
    } catch {
      // ignore storage parse errors
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errorMsg = data?.detail || data?.message || (typeof data === 'object' ? JSON.stringify(data) : 'Network request failed');
      const err = new Error(errorMsg);
      err.status = response.status;
      err.isHttpError = true;
      throw err;
    }

    return data;
  } catch (err) {
    if (fallbackData !== null && !err.isHttpError) {
      return fallbackData;
    }
    throw err;
  }
}

export const api = {
  // Authentication & Clearance
  auth: {
    login: async (email, password, role) => {
      return await request('/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
    },
    register: (userData) =>
      request('/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    verifyOtp: (payload) =>
      request('/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    resendOtp: (payload) =>
      request('/auth/resend-otp/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Laboratory Facilities & Modules
  labs: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.branch && params.branch !== 'all') query.set('branch', params.branch);
      if (params.semester && params.semester !== 'all') query.set('semester', params.semester);
      if (params.year && params.year !== 'all') query.set('year', params.year);
      const qs = query.toString();
      return request(`/labs/${qs ? `?${qs}` : ''}`, {}, MOCK_LABS);
    },
    addModule: (labId, moduleData) =>
      request(`/labs/${labId}/modules/`, {
        method: 'POST',
        body: JSON.stringify(moduleData),
      }, { title: moduleData.title, file: moduleData.file, success: true }),
  },

  // Supervised Cohort Batches
  batches: {
    getAll: () => request('/batches/', {}, MOCK_BATCHES),
  },

  // Experiment Deliverables & Tasks
  deliverables: {
    getAll: () => request('/deliverables/', {}, MOCK_DELIVERABLES),
  },

  // Student Registers, Notebooks & Evaluations
  studentRecords: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.labId && params.labId !== 'all') query.set('labId', params.labId);
      if (params.search) query.set('search', params.search);
      if (params.role) query.set('role', params.role);
      if (params.userId) query.set('userId', params.userId);
      if (params.userName) query.set('userName', params.userName);
      if (params.branch) query.set('branch', params.branch);
      if (params.dept) query.set('dept', params.dept);
      const qs = query.toString();
      return request(`/student-records/${qs ? `?${qs}` : ''}`, {}, MOCK_STUDENTS);
    },
    updateGrade: (studentId, gradeData) =>
      request(`/student-records/${studentId}/grade/`, {
        method: 'PATCH',
        body: JSON.stringify(gradeData),
      }, { id: studentId, ...gradeData }),
  },

  // Deliverable Submissions Review
  submissions: {
    getAll: () => request('/submissions/', {}, MOCK_SUBMISSIONS),
    create: (submissionData) =>
      request('/submissions/', {
        method: 'POST',
        body: JSON.stringify(submissionData),
      }, { id: Date.now(), ...submissionData, status: 'Submitted' }),
    verify: (id) =>
      request(`/submissions/${id}/verify/`, {
        method: 'POST',
      }, { id, status: 'Verified / Graded' }),
  },

  // Lab Attendance (Table: lab_attendance)
  attendance: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.labId) query.set('labId', params.labId);
      if (params.studentId) query.set('studentId', params.studentId);
      const qs = query.toString();
      return request(`/attendance/${qs ? `?${qs}` : ''}`, {}, []);
    },
    getCalendar: (studentId, month, year) => {
      const query = new URLSearchParams();
      if (studentId) query.set('student_id', studentId);
      if (month) query.set('month', month);
      if (year) query.set('year', year);
      const qs = query.toString();
      return request(`/attendance/calendar/${qs ? `?${qs}` : ''}`, {}, null);
    },
    recordSession: (sessionData) =>
      request('/attendance/session/', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      }),
    update: (attendanceData) =>
      request('/attendance/', {
        method: 'POST',
        body: JSON.stringify(attendanceData),
      }, { success: true, ...attendanceData }),
  },

  // Final Grades (Table: grades)
  grades: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.labId) query.set('labId', params.labId);
      if (params.studentId) query.set('studentId', params.studentId);
      const qs = query.toString();
      return request(`/grades/${qs ? `?${qs}` : ''}`, {}, []);
    },
    getAnalytics: (studentId) => {
      const query = new URLSearchParams();
      if (studentId) query.set('student_id', studentId);
      const qs = query.toString();
      return request(`/grades/analytics/${qs ? `?${qs}` : ''}`, {}, null);
    },
    update: (gradeData) =>
      request('/grades/', {
        method: 'POST',
        body: JSON.stringify(gradeData),
      }, { success: true, ...gradeData }),
  },

  // Equipment & Hardware Checkouts
  equipment: {
    getAssignments: () => request('/equipment/assignments/', {}, MOCK_EQUIPMENT_ASSIGNMENTS),
    createAssignment: (assignmentData) =>
      request('/equipment/assignments/', {
        method: 'POST',
        body: JSON.stringify(assignmentData),
      }, { id: Date.now(), ...assignmentData }),
  },

  // Workbenches & Live Laboratory Stations
  workbenches: {
    getWorkbenches: () => request('/telemetry/workbenches/', {}, MOCK_WORKBENCHES),
  },
  telemetry: {
    getWorkbenches: () => request('/telemetry/workbenches/', {}, MOCK_WORKBENCHES),
  },

  // Admin & System Registry
  admin: {
    getUsers: (role = 'all') => {
      return request(`/admin/users/${role && role !== 'all' ? `?role=${role}` : ''}`, {}, []);
    },
    getStats: () => request('/admin/stats/', {}, {
      totalUsers: 0,
      facultyCount: 0,
      studentCount: 0,
      totalLabs: 0,
      totalBatches: 0,
      instrumentUptime: '100%',
      safetyIncidents: 0,
    }),
    updateUser: (userId, userData) =>
      request(`/admin/users/${userId}/`, {
        method: 'PATCH',
        body: JSON.stringify(userData),
      }, { id: userId, ...userData }),
    addFaculty: (facultyData) =>
      request('/admin/faculty/', {
        method: 'POST',
        body: JSON.stringify(facultyData),
      }),
    getStudentRequests: (status = 'all') =>
      request(`/admin/student-requests/${status && status !== 'all' ? `?status=${status}` : ''}`, {}, []),
    approveStudentRequest: (requestId) =>
      request(`/admin/student-requests/${requestId}/approve/`, {
        method: 'POST',
      }),
    rejectStudentRequest: (requestId, reason = '') =>
      request(`/admin/student-requests/${requestId}/reject/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },
};

export default api;
