import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lab_backend.settings')
django.setup()

from rest_framework.test import APIClient
from api.models import User, StudentRecord, StudentRegistrationRequest, Lab, Task, StudentSubmission
from django.contrib.auth.hashers import check_password

def run_tests():
    client = APIClient()
    print("=================================================================")
    print("LAB COMPANION PRODUCTION READINESS & FLOW VERIFICATION")
    print("=================================================================")

    # 1. ADMIN VERIFICATION
    print("\n[TEST 1] Verifying Administrator Account 'admin'...")
    admins = list(User.objects.filter(role='admin'))
    assert len(admins) == 1, f"Expected exactly 1 admin, found {len(admins)}"
    admin = admins[0]
    assert admin.user_id == 'admin', f"Expected admin user_id 'admin', got {admin.user_id}"
    assert admin.email == 'admin@gmail.com', f"Expected admin email 'admin@gmail.com', got {admin.email}"
    assert admin.check_password('admin123'), "Admin password 'admin123' check failed!"
    print(f"  PASS: Unique admin 'admin' ({admin.email}) verified with password 'admin123'.")

    # Test Admin Login via userId and via email
    res_adm_id = client.post('/api/login/', {'userId': 'admin', 'password': 'admin123', 'role': 'admin'}, format='json')
    assert res_adm_id.status_code == 200, f"Admin login by userId failed: {res_adm_id.data}"
    assert res_adm_id.data.get('role') == 'admin'
    assert 'token' in res_adm_id.data
    admin_token = res_adm_id.data.get('token')
    print(f"  PASS: Admin login via userId 'admin' succeeded (Token: {admin_token}).")

    res_adm_email = client.post('/api/login/', {'email': 'admin@gmail.com', 'password': 'admin123', 'role': 'admin'}, format='json')
    assert res_adm_email.status_code == 200, f"Admin login by email failed: {res_adm_email.data}"
    print("  PASS: Admin login via email 'admin@gmail.com' succeeded.")

    # 2. SECURITY & ACCESS CONTROL VERIFICATION
    print("\n[TEST 2] Verifying Security: Route Protection & Admin Authorization...")
    # Verify demo accounts endpoint is removed
    res_demo = client.get('/api/auth/demo-accounts/')
    assert res_demo.status_code == 404, f"Expected 404 on demo-accounts, got {res_demo.status_code}"
    print("  PASS: /api/auth/demo-accounts/ is securely disabled (404 Not Found).")

    # Verify unauthenticated access to admin endpoints is strictly denied (403)
    res_unauth_users = client.get('/api/admin/users/')
    assert res_unauth_users.status_code == 403, f"Expected 403, got {res_unauth_users.status_code}"
    print("  PASS: Unauthenticated access to /api/admin/users/ blocked (403 Forbidden).")

    res_unauth_stats = client.get('/api/admin/stats/')
    assert res_unauth_stats.status_code == 403, f"Expected 403, got {res_unauth_stats.status_code}"
    print("  PASS: Unauthenticated access to /api/admin/stats/ blocked (403 Forbidden).")

    res_unauth_faculty = client.post('/api/admin/faculty/', {'name': 'Hacker', 'email': 'hack@lab.com'}, format='json')
    assert res_unauth_faculty.status_code == 403, f"Expected 403, got {res_unauth_faculty.status_code}"
    print("  PASS: Unauthorized faculty provisioning blocked (403 Forbidden).")

    # Verify admin with Bearer token can successfully access admin endpoints
    res_auth_users = client.get('/api/admin/users/', HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert res_auth_users.status_code == 200, f"Admin user list failed: {res_auth_users.data}"
    print(f"  PASS: Admin successfully accessed /api/admin/users/ ({len(res_auth_users.data)} active institutional users).")

    res_auth_stats = client.get('/api/admin/stats/', HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert res_auth_stats.status_code == 200, f"Admin stats failed: {res_auth_stats.data}"
    print("  PASS: Admin successfully accessed /api/admin/stats/.")

    # 3. STUDENT REGISTRATION FLOW WITH EMAIL OTP
    print("\n[TEST 3] Verifying Student Registration with Email OTP...")
    test_stu_email = "alex.newstudent@college.edu"
    test_stu_id = "24CSE999"

    # Clean previous test run if any
    User.objects.filter(email=test_stu_email).delete()
    User.objects.filter(user_id=test_stu_id).delete()
    StudentRegistrationRequest.objects.filter(email=test_stu_email).delete()

    reg_payload = {
        'email': test_stu_email,
        'password': 'StudentSecret123!',
        'role': 'student',
        'userId': test_stu_id,
        'name': 'Alex Newstudent',
        'course': 'B.Tech - Computer Science & Engineering (CSE)',
        'branch': 'CSE',
        'dept': 'Department of Computer Science & Engineering',
        'year': 2,
        'semester': 3,
        'phone': '+91 98765 43210'
    }

    res_reg = client.post('/api/register/', reg_payload, format='json')
    assert res_reg.status_code == 200, f"Registration failed: {res_reg.data}"
    assert res_reg.data.get('otp_required') is True, "Expected otp_required to be True"
    assert res_reg.data.get('is_registration') is True, "Expected is_registration to be True"
    otp_code = res_reg.data.get('dev_otp')
    assert otp_code and len(otp_code) == 6, f"Invalid OTP code received: {otp_code}"
    print(f"  PASS: Registration initiated. OTP {otp_code} dispatched to {test_stu_email}.")

    # Resend OTP during registration
    res_resend = client.post('/api/auth/resend-otp/', {'userId': test_stu_id, 'email': test_stu_email}, format='json')
    assert res_resend.status_code == 200
    new_otp = res_resend.data.get('dev_otp')
    assert new_otp and len(new_otp) == 6
    print(f"  PASS: Resend OTP for registration succeeded. Fresh OTP: {new_otp}.")

    # Verify email OTP during registration
    res_verify = client.post('/api/auth/verify-otp/', {
        'userId': test_stu_id,
        'email': test_stu_email,
        'otp': new_otp,
        'role': 'student'
    }, format='json')
    assert res_verify.status_code == 200, f"OTP verification failed: {res_verify.data}"
    assert res_verify.data.get('pending_approval') is True, "Expected pending_approval=True!"
    assert 'token' not in res_verify.data, "Security Violation: Token must not be issued before admin approval!"
    assert User.objects.filter(user_id=test_stu_id).first() is None, "Security Violation: User must not be activated before admin approval!"
    print(f"  PASS: Email OTP verified. Registration for {test_stu_id} set to pending admin approval.")

    # 4. VERIFY MANDATORY ADMIN APPROVAL ENFORCEMENT BEFORE PORTAL ENTRY
    print("\n[TEST 4] Verifying Mandatory Admin Approval & Student Portal Gating...")
    # Attempt early login before admin approval -> must be rejected with 403
    res_early_login = client.post('/api/login/', {
        'email': test_stu_email,
        'password': 'StudentSecret123!',
        'role': 'student'
    }, format='json')
    assert res_early_login.status_code == 403, f"Expected 403 for unapproved student, got {res_early_login.status_code}"
    assert res_early_login.data.get('pending_approval') is True
    print("  PASS: Unapproved student blocked from logging in (403 Forbidden).")

    # Administrator approves the student registration request
    pending_req = StudentRegistrationRequest.objects.filter(user_id=test_stu_id, status='pending').first()
    assert pending_req is not None, "Pending StudentRegistrationRequest not found!"
    res_approve = client.post(
        f'/api/admin/student-requests/{pending_req.id}/approve/',
        HTTP_AUTHORIZATION=f"Bearer {admin_token}"
    )
    assert res_approve.status_code == 200, f"Approval failed: {res_approve.data}"
    assert User.objects.filter(user_id=test_stu_id).exists(), "User not created after approval!"
    print(f"  PASS: Administrator approved registration {test_stu_id}. Student account activated.")

    # Approved student signs in with credentials + 2-Step OTP
    res_login_stu = client.post('/api/login/', {
        'email': test_stu_email,
        'password': 'StudentSecret123!',
        'role': 'student'
    }, format='json')
    assert res_login_stu.status_code == 200
    assert res_login_stu.data.get('otp_required') is True
    stu_login_otp = res_login_stu.data.get('dev_otp')
    print(f"  PASS: Approved student sign-in step 1 triggered. OTP {stu_login_otp} sent to {test_stu_email}.")

    res_verify_login = client.post('/api/auth/verify-otp/', {
        'userId': test_stu_id,
        'email': test_stu_email,
        'otp': stu_login_otp,
        'role': 'student'
    }, format='json')
    assert res_verify_login.status_code == 200
    assert res_verify_login.data.get('userId') == test_stu_id
    assert 'token' in res_verify_login.data
    stu_token = res_verify_login.data.get('token')
    print("  PASS: Approved student sign-in step 2 (OTP verification) authenticated session.")

    # Student attempting to access admin endpoints must receive 403
    res_stu_admin = client.get('/api/admin/users/', HTTP_AUTHORIZATION=f"Bearer {stu_token}")
    assert res_stu_admin.status_code == 403, f"Expected 403 for student accessing admin route, got {res_stu_admin.status_code}"
    print("  PASS: Student session cannot access admin registry (403 Forbidden).")

    # 5. ADMIN PROVISIONING FACULTY & TEACHER SIGN-IN WITH EMAIL OTP
    print("\n[TEST 5] Verifying Faculty Provisioning & 2-Step Email OTP Sign-In...")
    test_tch_email = "prof.sharma@college.edu"
    test_tch_id = "TCH-CSE501"

    # Clean previous run
    User.objects.filter(email=test_tch_email).delete()
    User.objects.filter(user_id=test_tch_id).delete()

    # Admin provisions faculty
    res_prov = client.post('/api/admin/faculty/', {
        'name': 'Prof. Sharma',
        'email': test_tch_email,
        'password': 'TeacherSecret45!',
        'branch': 'CSE',
        'dept': 'Department of Computer Science & Engineering',
        'user_id': test_tch_id,
        'lab_code': 'LAB-301'
    }, format='json', HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert res_prov.status_code == 201, f"Admin faculty provisioning failed: {res_prov.data}"
    print(f"  PASS: Admin successfully provisioned faculty {test_tch_id} ({test_tch_email}).")

    # Teacher signs in (Step 1)
    res_login_tch = client.post('/api/login/', {
        'email': test_tch_email,
        'password': 'TeacherSecret45!',
        'role': 'teacher'
    }, format='json')
    assert res_login_tch.status_code == 200
    assert res_login_tch.data.get('otp_required') is True
    tch_otp = res_login_tch.data.get('dev_otp')
    print(f"  PASS: Faculty sign-in step 1 triggered. OTP {tch_otp} dispatched to {test_tch_email}.")

    # Teacher verifies OTP (Step 2)
    res_verify_tch = client.post('/api/auth/verify-otp/', {
        'email': test_tch_email,
        'otp': tch_otp,
        'role': 'teacher'
    }, format='json')
    assert res_verify_tch.status_code == 200
    assert res_verify_tch.data.get('role') == 'teacher'
    print("  PASS: Faculty sign-in step 2 authenticated.")

    # 6. GENERAL API FUNCTIONALITY
    print("\n[TEST 6] Verifying Core Application Features...")
    
    # Labs list
    res_labs = client.get('/api/labs/?branch=CSE&semester=3')
    assert res_labs.status_code == 200
    print(f"  PASS: /api/labs/ returned {len(res_labs.data)} labs.")

    # Submissions
    task = Task.objects.first()
    res_sub = client.post('/api/submissions/', {
        'studentName': 'Alex Newstudent',
        'taskTitle': task.title if task else 'Lab Experiment Report',
        'labId': 'LAB-301',
        'fileName': 'alex_lab_report.pdf',
        'submittedAt': 'Just now'
    }, format='json')
    assert res_sub.status_code == 201
    sub_id = res_sub.data.get('id')
    print(f"  PASS: Created submission #{sub_id}.")

    # Verify submission
    res_sub_v = client.post(f'/api/submissions/{sub_id}/verify/', {}, format='json')
    assert res_sub_v.status_code == 200
    print(f"  PASS: Verified submission #{sub_id} (Status: {res_sub_v.data.get('status')}).")

    # Update grade & attendance
    res_grade = client.patch(f'/api/student-records/{test_stu_id}/grade/', {
        'grade': 'A+',
        'attendance': '99%'
    }, format='json')
    assert res_grade.status_code == 200
    assert res_grade.data.get('grade') == 'A+'
    print(f"  PASS: Updated grade for {test_stu_id} to A+ (Attendance: 99%).")

    # Batches
    res_batches = client.get('/api/batches/')
    assert res_batches.status_code == 200
    print(f"  PASS: /api/batches/ returned {len(res_batches.data)} batches.")

    # Deliverables
    res_deliv = client.get('/api/deliverables/')
    assert res_deliv.status_code == 200
    print(f"  PASS: /api/deliverables/ returned {len(res_deliv.data)} deliverables.")

    # Equipment assignments
    res_eq = client.get('/api/equipment-assignments/')
    assert res_eq.status_code == 200
    print(f"  PASS: /api/equipment-assignments/ returned {len(res_eq.data)} records.")

    # Live workbenches
    res_wb = client.get('/api/live-workbenches/')
    assert res_wb.status_code == 200
    print(f"  PASS: /api/live-workbenches/ returned {len(res_wb.data)} workbenches.")

    # Admin stats
    res_stats = client.get('/api/admin/stats/', HTTP_AUTHORIZATION=f"Bearer {admin_token}")
    assert res_stats.status_code == 200
    print(f"  PASS: /api/admin/stats/ returned total users {res_stats.data.get('total_users')}.")

    # Clean up test created users
    User.objects.filter(user_id=test_stu_id).delete()
    User.objects.filter(user_id=test_tch_id).delete()
    StudentRecord.objects.filter(student_code=test_stu_id).delete()
    StudentSubmission.objects.filter(id=sub_id).delete()

    print("\n=================================================================")
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("=================================================================")

if __name__ == '__main__':
    run_tests()
