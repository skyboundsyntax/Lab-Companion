from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

# ==========================================================
# 1. USERS MODEL & MANAGER (Table: users)
# ==========================================================

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser):
    ROLE_CHOICES = (
        ('student', 'student'),
        ('teacher', 'teacher'),
        ('admin', 'admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    user_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    dept = models.CharField(max_length=100, blank=True, null=True)
    course = models.CharField(max_length=100, default='B.Tech Computer Science & Engineering', blank=True, null=True)
    branch = models.CharField(max_length=50, default='CSE', blank=True, null=True)
    year = models.IntegerField(default=1, blank=True, null=True)
    semester = models.IntegerField(default=1, blank=True, null=True)
    email = models.EmailField(max_length=150, unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    password = models.TextField(db_column='password_hash')
    created_at = models.DateTimeField(auto_now_add=True)

    # Disable last_login database column so schema strictly matches PostgreSQL table
    last_login = None

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['user_id', 'name', 'role']

    class Meta:
        db_table = 'users'

    @property
    def username(self):
        return self.email

    @property
    def full_name(self):
        return self.name

    @property
    def password_hash(self):
        return self.password

    @property
    def is_staff(self):
        return self.role in ('admin', 'teacher')

    @property
    def is_superuser(self):
        return self.role == 'admin'

    @property
    def is_active(self):
        return True

    def has_perm(self, perm, obj=None):
        return self.role == 'admin'

    def has_module_perms(self, app_label):
        return self.role == 'admin'

    def __str__(self):
        return f"{self.name} ({self.user_id}) - {self.role}"


# ==========================================================
# 2. LABS MODEL (Table: labs)
# ==========================================================

class Lab(models.Model):
    lab_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    credits = models.IntegerField(default=2)
    course = models.CharField(max_length=100, default='B.Tech', blank=True, null=True)
    branch = models.CharField(max_length=50, default='COMMON', blank=True, null=True)
    year = models.IntegerField(default=1, blank=True, null=True)
    semester = models.IntegerField(default=1, blank=True, null=True)
    day = models.CharField(max_length=20, blank=True, null=True)
    time_slot = models.CharField(max_length=100, blank=True, null=True)
    room = models.CharField(max_length=100, blank=True, null=True)
    teacher_name = models.CharField(max_length=100, blank=True, null=True)
    attendance = models.CharField(max_length=20, blank=True, null=True)
    grade = models.CharField(max_length=10, blank=True, null=True)
    equipment = models.TextField(blank=True, null=True)
    latest_update = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'labs'

    @property
    def lab_id(self):
        return self.lab_code

    @property
    def time(self):
        return self.time_slot

    @property
    def teacher(self):
        return self.teacher_name

    @property
    def update(self):
        return self.latest_update

    def __str__(self):
        return f"{self.lab_code} - {self.name}"


# ==========================================================
# 3. EQUIPMENT STATUS MODEL (Table: equipment_status)
# ==========================================================

class EquipmentStatus(models.Model):
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='equipmentStatus')
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Working')
    count_info = models.CharField(max_length=100, blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'equipment_status'

    @property
    def count(self):
        return self.count_info

    def __str__(self):
        return f"{self.lab.lab_code} - {self.name} ({self.status})"

LabEquipmentStatus = EquipmentStatus  # Backward-compatibility alias


# ==========================================================
# 4. LAB MODULES MODEL (Table: lab_modules)
# ==========================================================

class LabModule(models.Model):
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='modules')
    title = models.CharField(max_length=150)
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lab_modules'

    @property
    def file(self):
        return self.file_name

    @property
    def created_at(self):
        return self.uploaded_at

    def __str__(self):
        return f"{self.lab.lab_code} - {self.title}"


# ==========================================================
# 5. TEACHER BATCHES MODEL (Table: teacher_batches)
# ==========================================================

class TeacherBatch(models.Model):
    batch_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='batches')
    day = models.CharField(max_length=20, blank=True, null=True)
    time_slot = models.CharField(max_length=100, blank=True, null=True)
    room = models.CharField(max_length=100, blank=True, null=True)
    students_count = models.IntegerField(default=30, blank=True, null=True)
    attendance = models.CharField(max_length=20, blank=True, null=True)
    current_topic = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'teacher_batches'

    @property
    def batch_id(self):
        return self.batch_code

    @property
    def time(self):
        return self.time_slot

    @property
    def students(self):
        return self.students_count

    @property
    def topic(self):
        return self.current_topic

    @property
    def labId(self):
        return self.lab.lab_code if self.lab else ''

    @property
    def labName(self):
        return self.lab.name if self.lab else ''

    def __str__(self):
        return f"{self.batch_code} - {self.name}"


# ==========================================================
# 6. TASKS MODEL (Table: tasks)
# ==========================================================

class Task(models.Model):
    CATEGORY_CHOICES = (
        ('Assignment', 'Assignment'),
        ('Project', 'Project'),
        ('Module', 'Module'),
        ('Lab Material', 'Lab Material'),
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='tasks')
    due = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tasks'

    @property
    def labId(self):
        return self.lab.lab_code if self.lab else ''

    @property
    def labName(self):
        return self.lab.name if self.lab else ''

    @property
    def due_date(self):
        return self.due

    def __str__(self):
        return f"{self.title} ({self.lab.lab_code})"

DeliverableTask = Task  # Backward-compatibility alias


# ==========================================================
# 7. STUDENT RECORDS MODEL (Table: student_records)
# ==========================================================

class StudentRecord(models.Model):
    student_code = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id', related_name='student_records')
    name = models.CharField(max_length=100)
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='students')
    dept = models.CharField(max_length=100, blank=True, null=True)
    email = models.CharField(max_length=150, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    attendance = models.CharField(max_length=20, blank=True, null=True)
    grade = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        db_table = 'student_records'

    @property
    def student_id(self):
        return self.student_code

    @property
    def labId(self):
        return self.lab.lab_code if self.lab else ''

    def __str__(self):
        return f"{self.student_code} - {self.name}"


# ==========================================================
# 8. STUDENT SUBMISSIONS MODEL (Table: student_submissions)
# ==========================================================

class StudentSubmission(models.Model):
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_column='student_id', related_name='submissions')
    student_name = models.CharField(max_length=100, blank=True, null=True)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, db_column='task_id', related_name='submissions')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='submissions')
    category = models.CharField(max_length=50, blank=True, null=True)
    file_name = models.CharField(max_length=255)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='Submitted')
    grade = models.CharField(max_length=20, blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'student_submissions'


    @property
    def studentName(self):
        return self.student_name

    @property
    def taskTitle(self):
        return self.task.title if self.task else ''

    @property
    def labId(self):
        return self.lab.lab_code if self.lab else ''

    @property
    def fileName(self):
        return self.file_name

    @property
    def submittedAt(self):
        if self.submitted_at:
            return self.submitted_at.strftime('%Y-%m-%d %H:%M')
        return 'Just now'

    def __str__(self):
        return f"Submission #{self.id} - {self.student_name}"


# ==========================================================
# 9. LAB ATTENDANCE MODEL (Table: lab_attendance)
# ==========================================================

class LabAttendance(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, db_column='student_id', related_name='attendances')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='attendances')
    attended_classes = models.IntegerField(default=0)
    total_classes = models.IntegerField(default=0)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'lab_attendance'

    def save(self, *args, **kwargs):
        if self.total_classes and self.total_classes > 0:
            self.attendance_percentage = round((self.attended_classes / self.total_classes) * 100, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.name} - {self.lab.lab_code} ({self.attendance_percentage}%)"


# ==========================================================
# 10. GRADES MODEL (Table: grades)
# ==========================================================

class Grade(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, db_column='student_id', related_name='grades')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='grades')
    grade = models.CharField(max_length=10)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'grades'

    def __str__(self):
        return f"{self.student.name} - {self.lab.lab_code}: {self.grade}"


# ==========================================================
# 11. STUDENT ATTENDANCE SESSIONS (Daily Calendar Logs)
# ==========================================================

class StudentAttendanceSession(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, db_column='student_id', related_name='attendance_sessions')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, db_column='lab_id', related_name='attendance_sessions')
    session_date = models.DateField()
    status = models.CharField(max_length=20, choices=(('Present', 'Present'), ('Absent', 'Absent'), ('Excused', 'Excused')), default='Present')
    topic = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_attendance_sessions'

    def __str__(self):
        return f"{self.student.name} - {self.lab.lab_code} [{self.session_date}]: {self.status}"


# ==========================================================
# OPTIONAL EXTENSIONS (Hardware Checkouts & Live Telemetry)
# ==========================================================

class EquipmentAssignment(models.Model):
    studentId = models.CharField(max_length=50)
    studentName = models.CharField(max_length=150)
    labId = models.CharField(max_length=50, blank=True)
    equipment = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    assignedOn = models.CharField(max_length=100, default="Just now")

    def __str__(self):
        return f"{self.quantity}x {self.equipment} to {self.studentName}"


class LiveWorkbench(models.Model):
    workbench_id = models.CharField(max_length=50, unique=True)
    lab = models.CharField(max_length=150)
    instrument = models.CharField(max_length=200)
    status = models.CharField(max_length=50, default="ready")
    user = models.CharField(max_length=150, default="Open")

    def __str__(self):
        return f"{self.workbench_id} ({self.status}) - {self.instrument}"


# ==========================================================
# 12. STUDENT REGISTRATION REQUESTS (Admin Clearance Queue)
# ==========================================================

class StudentRegistrationRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150)
    user_id = models.CharField(max_length=50)
    password_hash = models.TextField()
    dept = models.CharField(max_length=100, blank=True, null=True)
    course = models.CharField(max_length=100, default='B.Tech Computer Science & Engineering', blank=True, null=True)
    branch = models.CharField(max_length=50, default='CSE', blank=True, null=True)
    year = models.IntegerField(default=1, blank=True, null=True)
    semester = models.IntegerField(default=1, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'student_registration_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user_id} - {self.name} [{self.status}]"

