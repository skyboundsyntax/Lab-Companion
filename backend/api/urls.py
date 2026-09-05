from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    VerifyOTPView,
    ResendOTPView,
    AdminAddFacultyView,
    AdminStudentRegistrationRequestsView,
    AdminApproveStudentRequestView,
    AdminRejectStudentRequestView,
    LabListCreateView,
    LabAddModuleView,
    BatchListView,
    DeliverableListCreateView,
    StudentRecordListView,
    StudentRecordGradeUpdateView,
    SubmissionListCreateView,
    SubmissionVerifyView,
    LabAttendanceListView,
    GradeListView,
    EquipmentAssignmentListCreateView,
    LiveWorkbenchListView,
    AdminUserListView,
    AdminUserUpdateView,
    StudentAttendanceCalendarView,
    StudentAttendanceSessionMarkView,
    StudentGradeAnalyticsView,
    AdminStatsView,
)

urlpatterns = [
    # Auth (Table: users)
    path('register/', RegisterView.as_view(), name='register'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='login'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/resend-otp/', ResendOTPView.as_view(), name='resend-otp'),

    # Labs & Modules (Tables: labs, lab_modules, equipment_status)
    path('labs/', LabListCreateView.as_view(), name='lab-list-create'),
    path('labs/<str:lab_id>/modules/', LabAddModuleView.as_view(), name='lab-add-module'),

    # Cohort Batches (Table: teacher_batches)
    path('batches/', BatchListView.as_view(), name='batch-list'),

    # Tasks / Deliverables (Table: tasks)
    path('deliverables/', DeliverableListCreateView.as_view(), name='deliverable-list-create'),

    # Student Records (Table: student_records)
    path('student-records/', StudentRecordListView.as_view(), name='student-record-list'),
    path('student-records/<str:student_id>/grade/', StudentRecordGradeUpdateView.as_view(), name='student-record-grade-update'),

    # Submissions (Table: student_submissions)
    path('submissions/', SubmissionListCreateView.as_view(), name='submission-list-create'),
    path('submissions/<int:pk>/verify/', SubmissionVerifyView.as_view(), name='submission-verify'),

    # Lab Attendance (Table: lab_attendance)
    path('attendance/', LabAttendanceListView.as_view(), name='lab-attendance-list'),
    path('attendance/calendar/', StudentAttendanceCalendarView.as_view(), name='student-attendance-calendar'),
    path('attendance/session/', StudentAttendanceSessionMarkView.as_view(), name='attendance-session-mark'),

    # Grades (Table: grades)
    path('grades/', GradeListView.as_view(), name='grades-list'),
    path('grades/analytics/', StudentGradeAnalyticsView.as_view(), name='student-grade-analytics'),

    # Hardware & Telemetry Extensions
    path('equipment/assignments/', EquipmentAssignmentListCreateView.as_view(), name='equipment-assignment-list-create'),
    path('equipment-assignments/', EquipmentAssignmentListCreateView.as_view(), name='equipment-assignment-list-create-alias'),
    path('telemetry/workbenches/', LiveWorkbenchListView.as_view(), name='telemetry-workbenches'),
    path('live-workbenches/', LiveWorkbenchListView.as_view(), name='telemetry-workbenches-alias'),

    # Admin
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<str:pk>/', AdminUserUpdateView.as_view(), name='admin-user-update'),
    path('admin/faculty/', AdminAddFacultyView.as_view(), name='admin-add-faculty'),
    path('admin/student-requests/', AdminStudentRegistrationRequestsView.as_view(), name='admin-student-requests'),
    path('admin/student-requests/<int:pk>/approve/', AdminApproveStudentRequestView.as_view(), name='admin-approve-student-request'),
    path('admin/student-requests/<int:pk>/reject/', AdminRejectStudentRequestView.as_view(), name='admin-reject-student-request'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
]
