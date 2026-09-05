import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('student', 'student'), ('teacher', 'teacher'), ('admin', 'admin')], default='student', max_length=20)),
                ('user_id', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('dept', models.CharField(blank=True, max_length=100, null=True)),
                ('email', models.EmailField(max_length=150, unique=True)),
                ('phone', models.CharField(blank=True, max_length=20, null=True)),
                ('password', models.TextField(db_column='password_hash')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'users',
            },
        ),
        migrations.CreateModel(
            name='Lab',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('lab_code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=150)),
                ('credits', models.IntegerField(default=2)),
                ('day', models.CharField(blank=True, max_length=20, null=True)),
                ('time_slot', models.CharField(blank=True, max_length=100, null=True)),
                ('room', models.CharField(blank=True, max_length=100, null=True)),
                ('teacher_name', models.CharField(blank=True, max_length=100, null=True)),
                ('attendance', models.CharField(blank=True, max_length=20, null=True)),
                ('grade', models.CharField(blank=True, max_length=10, null=True)),
                ('equipment', models.TextField(blank=True, null=True)),
                ('latest_update', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'labs',
            },
        ),
        migrations.CreateModel(
            name='EquipmentStatus',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('status', models.CharField(default='Working', max_length=50)),
                ('count_info', models.CharField(blank=True, max_length=100, null=True)),
                ('note', models.TextField(blank=True, null=True)),
                ('lab', models.ForeignKey(db_column='lab_id', on_delete=django.db.models.deletion.CASCADE, related_name='equipmentStatus', to='api.lab')),
            ],
            options={
                'db_table': 'equipment_status',
            },
        ),
        migrations.CreateModel(
            name='LabModule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=150)),
                ('file_name', models.CharField(max_length=255)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('lab', models.ForeignKey(db_column='lab_id', on_delete=django.db.models.deletion.CASCADE, related_name='modules', to='api.lab')),
            ],
            options={
                'db_table': 'lab_modules',
            },
        ),
        migrations.CreateModel(
            name='TeacherBatch',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('batch_code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('day', models.CharField(blank=True, max_length=20, null=True)),
                ('time_slot', models.CharField(blank=True, max_length=100, null=True)),
                ('room', models.CharField(blank=True, max_length=100, null=True)),
                ('students_count', models.IntegerField(blank=True, default=30, null=True)),
                ('attendance', models.CharField(blank=True, max_length=20, null=True)),
                ('current_topic', models.TextField(blank=True, null=True)),
                ('lab', models.ForeignKey(db_column='lab_id', on_delete=django.db.models.deletion.CASCADE, related_name='batches', to='api.lab')),
            ],
            options={
                'db_table': 'teacher_batches',
            },
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('category', models.CharField(choices=[('Assignment', 'Assignment'), ('Project', 'Project'), ('Module', 'Module'), ('Lab Material', 'Lab Material')], max_length=50)),
                ('due', models.CharField(blank=True, max_length=100, null=True)),
                ('description', models.TextField(blank=True, null=True)),
                ('status', models.CharField(default='Pending', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('lab', models.ForeignKey(db_column='lab_id', on_delete=django.db.models.deletion.CASCADE, related_name='tasks', to='api.lab')),
            ],
            options={
                'db_table': 'tasks',
            },
        ),
        migrations.CreateModel(
            name='StudentRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('student_code', models.CharField(max_length=50, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('dept', models.CharField(blank=True, max_length=100, null=True)),
                ('email', models.CharField(blank=True, max_length=150, null=True)),
                ('phone', models.CharField(blank=True, max_length=20, null=True)),
                ('attendance', models.CharField(blank=True, max_length=20, null=True)),
                ('grade', models.CharField(blank=True, max_length=10, null=True)),
                ('lab', models.ForeignKey(db_column='lab_id', on_delete=django.db.models.deletion.CASCADE, related_name='students', to='api.lab')),
                ('user', models.ForeignKey(blank=True, db_column='user_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='student_records', to='api.user')),
            ],
            options={
                'db_table': 'student_records',
            },
        ),
        migrations.CreateModel(
            name='StudentSubmission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('student_name', models.CharField(blank=True, max_length=100, null=True)),
                ('category', models.CharField(blank=True, max_length=50, null=True)),
                ('file_name', models.CharField(max_length=255)),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('status', models.CharField(default='Submitted', max_length=50)),
                ('lab', models.ForeignKey(db_column='lab_id', on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='api.lab')),
                ('student', models.ForeignKey(blank=True, db_column='student_id', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='submissions', to='api.user')),
                ('task', models.ForeignKey(db_column='task_id', on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='api.task')),
            ],
            options={
                'db_table': 'student_submissions',
            },
        ),
        migrations.CreateModel(
            name='LabAttendance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('attended_classes', models.IntegerField(default=0)),
                ('total_classes', models.IntegerField(default=0)),
                ('attendance_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lab', models.ForeignKey(db_column='lab_id', on_delete=django.db.models.deletion.CASCADE, related_name='attendances', to='api.lab')),
                ('student', models.ForeignKey(db_column='student_id', on_delete=django.db.models.deletion.CASCADE, related_name='attendances', to='api.user')),
            ],
            options={
                'db_table': 'lab_attendance',
            },
        ),
        migrations.CreateModel(
            name='Grade',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('grade', models.CharField(max_length=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('lab', models.ForeignKey(db_column='lab_id', on_delete=django.db.models.deletion.CASCADE, related_name='grades', to='api.lab')),
                ('student', models.ForeignKey(db_column='student_id', on_delete=django.db.models.deletion.CASCADE, related_name='grades', to='api.user')),
            ],
            options={
                'db_table': 'grades',
            },
        ),
        migrations.CreateModel(
            name='EquipmentAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('studentId', models.CharField(max_length=50)),
                ('studentName', models.CharField(max_length=150)),
                ('labId', models.CharField(blank=True, max_length=50)),
                ('equipment', models.CharField(max_length=200)),
                ('quantity', models.IntegerField(default=1)),
                ('assignedOn', models.CharField(default='Just now', max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='LiveWorkbench',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('workbench_id', models.CharField(max_length=50, unique=True)),
                ('lab', models.CharField(max_length=150)),
                ('instrument', models.CharField(max_length=200)),
                ('status', models.CharField(default='ready', max_length=50)),
                ('user', models.CharField(default='Open', max_length=150)),
            ],
        ),
    ]
