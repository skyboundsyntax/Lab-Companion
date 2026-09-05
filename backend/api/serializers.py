from rest_framework import serializers
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
    StudentAttendanceSession,
    EquipmentAssignment,
    LiveWorkbench,
    StudentRegistrationRequest,
)

# ----------------- 1. USERS -----------------

class UserSerializer(serializers.ModelSerializer):
    userId = serializers.CharField(source='user_id', required=False, allow_blank=True, allow_null=True)
    full_name = serializers.CharField(source='name', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id',
            'role',
            'user_id',
            'userId',
            'name',
            'full_name',
            'dept',
            'course',
            'branch',
            'year',
            'semester',
            'email',
            'phone',
            'created_at',
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }


# ----------------- 2. EQUIPMENT STATUS -----------------

class EquipmentStatusSerializer(serializers.ModelSerializer):
    count = serializers.CharField(source='count_info', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = EquipmentStatus
        fields = ['id', 'name', 'status', 'count_info', 'count', 'note']

LabEquipmentStatusSerializer = EquipmentStatusSerializer


# ----------------- 3. LAB MODULES -----------------

class LabModuleSerializer(serializers.ModelSerializer):
    file = serializers.CharField(source='file_name')
    created_at = serializers.DateTimeField(source='uploaded_at', read_only=True)

    class Meta:
        model = LabModule
        fields = ['id', 'title', 'file_name', 'file', 'uploaded_at', 'created_at']


# ----------------- 4. LABS -----------------

class LabSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='lab_code')
    lab_id = serializers.CharField(source='lab_code', required=False)
    time = serializers.CharField(source='time_slot', required=False, allow_blank=True, allow_null=True)
    teacher = serializers.CharField(source='teacher_name', required=False, allow_blank=True, allow_null=True)
    update = serializers.CharField(source='latest_update', required=False, allow_blank=True, allow_null=True)
    equipmentStatus = EquipmentStatusSerializer(many=True, read_only=True)
    modules = LabModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Lab
        fields = [
            'id',
            'lab_code',
            'lab_id',
            'name',
            'credits',
            'course',
            'branch',
            'year',
            'semester',
            'day',
            'time_slot',
            'time',
            'room',
            'teacher_name',
            'teacher',
            'attendance',
            'grade',
            'equipment',
            'latest_update',
            'update',
            'equipmentStatus',
            'modules',
        ]


# ----------------- 5. TEACHER BATCHES -----------------

class TeacherBatchSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='batch_code')
    batch_id = serializers.CharField(source='batch_code', required=False)
    labId = serializers.CharField(read_only=True)
    labName = serializers.CharField(read_only=True)
    time = serializers.CharField(source='time_slot', required=False, allow_blank=True, allow_null=True)
    students = serializers.IntegerField(source='students_count', required=False, allow_null=True)
    topic = serializers.CharField(source='current_topic', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = TeacherBatch
        fields = [
            'id',
            'batch_code',
            'batch_id',
            'name',
            'lab_id',
            'labId',
            'labName',
            'day',
            'time_slot',
            'time',
            'room',
            'students_count',
            'students',
            'attendance',
            'current_topic',
            'topic',
        ]


# ----------------- 6. TASKS / DELIVERABLES -----------------

class TaskSerializer(serializers.ModelSerializer):
    labId = serializers.CharField(read_only=True)
    labName = serializers.CharField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'category',
            'lab_id',
            'labId',
            'labName',
            'due',
            'description',
            'status',
            'created_at',
        ]

DeliverableTaskSerializer = TaskSerializer


# ----------------- 7. STUDENT RECORDS -----------------

class StudentRecordSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='student_code')
    student_id = serializers.CharField(source='student_code', required=False)
    student_name = serializers.CharField(source='name', read_only=True)
    labId = serializers.CharField(read_only=True)

    year = serializers.SerializerMethodField()
    semester = serializers.SerializerMethodField()
    course = serializers.SerializerMethodField()
    branch = serializers.SerializerMethodField()
    cgpa = serializers.SerializerMethodField()

    class Meta:
        model = StudentRecord
        fields = [
            'id',
            'student_code',
            'student_id',
            'student_name',
            'user_id',
            'name',
            'lab_id',
            'labId',
            'dept',
            'email',
            'phone',
            'attendance',
            'grade',
            'year',
            'semester',
            'course',
            'branch',
            'cgpa',
        ]

    def get_year(self, obj):
        return obj.user.year if (obj.user and obj.user.year) else 2

    def get_semester(self, obj):
        return obj.user.semester if (obj.user and obj.user.semester) else 4

    def get_course(self, obj):
        if obj.user and obj.user.course:
            return obj.user.course
        return obj.dept or 'B.Tech – Computer Science & Engineering (CSE)'

    def get_branch(self, obj):
        if obj.user and obj.user.branch:
            return obj.user.branch
        return 'CSE'

    def get_cgpa(self, obj):
        grade_cgpa_map = {
            'O': 9.6, 'O+': 9.8, 'A+': 9.1, 'A': 8.5,
            'A-': 8.0, 'B+': 7.6, 'B': 7.0, 'C': 6.0, 'F': 4.0
        }
        raw_grade = (obj.grade or 'A').strip().upper()
        for k, v in grade_cgpa_map.items():
            if k in raw_grade:
                return v
        return 8.5




# ----------------- 8. STUDENT SUBMISSIONS -----------------

class StudentSubmissionSerializer(serializers.ModelSerializer):
    studentName = serializers.CharField(source='student_name', required=False, allow_blank=True, allow_null=True)
    taskTitle = serializers.CharField(read_only=True)
    labId = serializers.CharField(read_only=True)
    fileName = serializers.CharField(source='file_name')
    submittedAt = serializers.CharField(read_only=True)

    class Meta:
        model = StudentSubmission
        fields = [
            'id',
            'student_id',
            'student_name',
            'studentName',
            'task_id',
            'taskTitle',
            'lab_id',
            'labId',
            'category',
            'file_name',
            'fileName',
            'submitted_at',
            'submittedAt',
            'status',
            'grade',
            'feedback',
        ]


# ----------------- 9. LAB ATTENDANCE -----------------

class LabAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.user_id', read_only=True)
    lab_code = serializers.CharField(source='lab.lab_code', read_only=True)
    lab_name = serializers.CharField(source='lab.name', read_only=True)

    class Meta:
        model = LabAttendance
        fields = [
            'id',
            'student_id',
            'student_name',
            'student_code',
            'lab_id',
            'lab_code',
            'lab_name',
            'attended_classes',
            'total_classes',
            'attendance_percentage',
            'updated_at',
        ]


# ----------------- 10. GRADES -----------------

class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.user_id', read_only=True)
    lab_code = serializers.CharField(source='lab.lab_code', read_only=True)
    lab_name = serializers.CharField(source='lab.name', read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id',
            'student_id',
            'student_name',
            'student_code',
            'lab_id',
            'lab_code',
            'lab_name',
            'grade',
            'updated_at',
        ]


# ----------------- 11. ATTENDANCE SESSIONS -----------------

class StudentAttendanceSessionSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.user_id', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_code = serializers.CharField(source='student.user_id', read_only=True)
    lab_code = serializers.CharField(source='lab.lab_code', read_only=True)
    lab_name = serializers.CharField(source='lab.name', read_only=True)

    class Meta:
        model = StudentAttendanceSession
        fields = [
            'id',
            'student_id',
            'student_name',
            'student_code',
            'lab_id',
            'lab_code',
            'lab_name',
            'session_date',
            'status',
            'topic',
            'created_at',
        ]


# ----------------- EXTENSIONS: HARDWARE & TELEMETRY -----------------

class EquipmentAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentAssignment
        fields = [
            'id',
            'studentId',
            'studentName',
            'labId',
            'equipment',
            'quantity',
            'assignedOn',
        ]


class LiveWorkbenchSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='workbench_id')

    class Meta:
        model = LiveWorkbench
        fields = [
            'id',
            'workbench_id',
            'lab',
            'instrument',
            'status',
            'user',
        ]


# ----------------- 12. REGISTRATION REQUESTS -----------------

class StudentRegistrationRequestSerializer(serializers.ModelSerializer):
    userId = serializers.CharField(source='user_id')
    fullName = serializers.CharField(source='name')
    requestedAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta:
        model = StudentRegistrationRequest
        fields = [
            'id',
            'name',
            'fullName',
            'email',
            'user_id',
            'userId',
            'dept',
            'course',
            'branch',
            'year',
            'semester',
            'phone',
            'status',
            'created_at',
            'requestedAt',
            'reviewed_at',
            'rejection_reason',
        ]

