import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
env_file = BASE_DIR / '.env'

config = {
    'EMAIL_HOST': 'smtp.gmail.com',
    'EMAIL_PORT': 587,
    'EMAIL_USE_TLS': True,
    'EMAIL_HOST_USER': '',
    'EMAIL_HOST_PASSWORD': '',
    'DEFAULT_FROM_EMAIL': '',
}

if env_file.exists():
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                config[k.strip()] = v.strip().strip("'").strip('"')

host_user = config['EMAIL_HOST_USER'].strip()
host_pass = config['EMAIL_HOST_PASSWORD'].strip().replace(' ', '')
host = config['EMAIL_HOST'].strip()
port = int(config['EMAIL_PORT'])
use_tls = str(config['EMAIL_USE_TLS']).lower() in ('true', '1', 'yes')

print("=" * 65)
print("LAB COMPANION - SMTP CONNECTION TEST")
print("=" * 65)
print(f"SMTP Server : {host}:{port}")
print(f"Use TLS     : {use_tls}")
print(f"Sender Email: {host_user or '[NOT CONFIGURED]'}")
print(f"App Password: {'*' * len(host_pass) if host_pass else '[NOT CONFIGURED]'}")
print("=" * 65)

if not host_user or not host_pass:
    print("\n[ERROR] EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is missing in backend/.env!")
    print("Please follow the setup instructions to add your Gmail and App Password.")
    sys.exit(1)

recipient = sys.argv[1] if len(sys.argv) > 1 else host_user

print(f"\n[1/3] Connecting to {host}:{port} via TLS...")
import smtplib
from email.mime.text import MIMEText

try:
    server = smtplib.SMTP(host, port, timeout=15)
    if use_tls:
        server.starttls()
    print("  SUCCESS: Connected and established TLS encryption.")

    print(f"[2/3] Authenticating as {host_user}...")
    server.login(host_user, host_pass)
    print("  SUCCESS: Google SMTP authentication accepted!")

    print(f"[3/3] Sending test verification email to {recipient}...")
    msg = MIMEText(
        "Hello!\n\nThis is a confirmation test from Lab Companion. Your Gmail SMTP configuration is 100% active and working.\n\n"
        "Students and faculty will now receive their 6-digit OTP passcodes directly in their email inboxes!\n\n"
        "Best regards,\nLab Companion Security Team",
        'plain',
        'utf-8'
    )
    msg['Subject'] = "Lab Companion - SMTP Verification Success"
    msg['From'] = f"Lab Companion Security <{host_user}>"
    msg['To'] = recipient

    server.sendmail(host_user, [recipient], msg.as_string())
    server.quit()
    print(f"\n=================================================================")
    print(f"SUCCESS! Test email sent to {recipient}. Check your inbox!")
    print(f"=================================================================")
except Exception as e:
    print(f"\n[FAILED] SMTP error occurred: {e}")
    if "535" in str(e):
        print("\nTip: Error 535 means 'Username and Password not accepted'.")
        print("1. Ensure 2-Step Verification is ON in your Google Account.")
        print("2. Ensure you generated an 'App Password' from https://myaccount.google.com/apppasswords")
        print("3. Standard Gmail passwords will be rejected by Google.")
    sys.exit(1)
