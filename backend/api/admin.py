from django.contrib import admin
from .models import (
    User,
    Lab,
    EquipmentStatus,
    LabModule,
    TeacherBatch,
    Task,
    StudentRecord,
    StudentSubmission,
    LabAttendance,
    Grade,
    EquipmentAssignment,
    LiveWorkbench,
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'user_id', 'name', 'dept', 'phone', 'created_at')
    search_fields = ('email', 'name', 'user_id', 'dept')
    list_filter = ('role', 'dept')
    fields = ('role', 'user_id', 'name', 'email', 'phone', 'dept')


class EquipmentStatusInline(admin.TabularInline):
    model = EquipmentStatus
    extra = 1


class LabModuleInline(admin.TabularInline):
    model = LabModule
    extra = 1


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ('lab_code', 'name', 'day', 'time_slot', 'room', 'teacher_name', 'attendance', 'grade')
    search_fields = ('lab_code', 'name', 'teacher_name')
    inlines = [EquipmentStatusInline, LabModuleInline]


@admin.register(TeacherBatch)
class TeacherBatchAdmin(admin.ModelAdmin):
    list_display = ('batch_code', 'name', 'lab', 'day', 'time_slot', 'students_count', 'attendance')
    search_fields = ('batch_code', 'name')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'lab', 'due', 'status', 'created_at')
    list_filter = ('category', 'status', 'lab')


@admin.register(StudentRecord)
class StudentRecordAdmin(admin.ModelAdmin):
    list_display = ('student_code', 'name', 'lab', 'dept', 'email', 'attendance', 'grade')
    search_fields = ('name', 'student_code', 'email')
    list_filter = ('lab', 'dept')


@admin.register(StudentSubmission)
class StudentSubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_name', 'task', 'lab', 'file_name', 'submitted_at', 'status')
    list_filter = ('status', 'lab')


@admin.register(LabAttendance)
class LabAttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'lab', 'attended_classes', 'total_classes', 'attendance_percentage', 'updated_at')
    list_filter = ('lab',)


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'lab', 'grade', 'updated_at')
    list_filter = ('grade', 'lab')


@admin.register(EquipmentAssignment)
class EquipmentAssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'studentName', 'studentId', 'equipment', 'quantity', 'assignedOn')


@admin.register(LiveWorkbench)
class LiveWorkbenchAdmin(admin.ModelAdmin):
    list_display = ('workbench_id', 'lab', 'instrument', 'status', 'user')
