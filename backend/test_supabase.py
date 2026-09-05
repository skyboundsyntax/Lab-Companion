#!/usr/bin/env python3
"""
Diagnostic utility for Supabase Auth Email OTP delivery in Lab Companion.

Usage:
  py test_supabase.py [optional_email]
"""

import os
import sys
from pathlib import Path

# Search for .env file in multiple possible locations
BASE_DIR = Path(__file__).resolve().parent
CANDIDATE_ENV_FILES = [
    BASE_DIR / '.env',
    BASE_DIR / 'backend' / '.env',
    BASE_DIR.parent / 'backend' / '.env',
    BASE_DIR.parent / '.env',
]

supabase_url = ''
supabase_anon_key = ''
used_env_file = None

for env_file in CANDIDATE_ENV_FILES:
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    k = k.strip()
                    v = v.strip().strip("'").strip('"')
                    if k == 'SUPABASE_URL' and v and not supabase_url:
                        supabase_url = v
                    elif (k == 'SUPABASE_ANON_KEY' or k == 'SUPABASE_KEY') and v and not supabase_anon_key:
                        supabase_anon_key = v
        if supabase_url and supabase_anon_key:
            used_env_file = env_file
            break

# Normalize Supabase URL (strip /rest/v1 and trailing slash)
if supabase_url:
    if '/rest/v1' in supabase_url:
        supabase_url = supabase_url.split('/rest/v1')[0]
    supabase_url = supabase_url.rstrip('/')

print("=" * 65)
print("LAB COMPANION - SUPABASE AUTH EMAIL OTP TESTER")
print("=" * 65)

print(f"Loaded from:          {used_env_file or '(No .env with Supabase keys found)'}")
print(f"Supabase Project URL: {supabase_url or '(NOT CONFIGURED)'}")
print(f"Supabase Anon Key:    {'[Present: ' + supabase_anon_key[:10] + '...]' if supabase_anon_key else '(NOT CONFIGURED)'}")

if not supabase_url or not supabase_anon_key:
    print("\n[!] SUPABASE IS NOT YET CONFIGURED IN backend/.env")
    print("\nTo configure Supabase:")
    print("  1. Create a free project at https://supabase.com")
    print("  2. Open Project Settings -> API")
    print("  3. Copy your 'Project URL' and 'anon public key'")
    print("  4. Paste them into backend/.env:")
    print("       SUPABASE_URL=https://<your-project-ref>.supabase.co")
    print("       SUPABASE_ANON_KEY=<your-anon-key>\n")
    sys.exit(1)

target_email = sys.argv[1] if len(sys.argv) > 1 else 'admin@gmail.com'

print(f"\nTarget Recipient: {target_email}")
print("Contacting Supabase Auth API to dispatch 6-digit email OTP...")

import requests

headers = {
    "apikey": supabase_anon_key,
    "Authorization": f"Bearer {supabase_anon_key}",
    "Content-Type": "application/json"
}

otp_url = f"{supabase_url}/auth/v1/otp"

try:
    resp = requests.post(
        otp_url,
        headers=headers,
        json={"email": target_email, "create_user": True},
        timeout=15
    )
    print(f"HTTP Response Status: {resp.status_code}")
    if resp.status_code in (200, 201):
        print(f"\n[SUCCESS] Real 6-digit OTP passcode dispatched to {target_email} via Supabase Auth!")
        print("Please check your email inbox (and Spam/Junk folder).")
        
        # Optional interactive verification
        try:
            token = input("\nEnter the 6-digit OTP code received in your email (or press Enter to exit): ").strip()
            if token:
                print(f"Verifying token '{token}' with Supabase Auth...")
                verify_url = f"{supabase_url}/auth/v1/verify"
                for otp_type in ("email", "signup", "magiclink"):
                    vresp = requests.post(
                        verify_url,
                        headers=headers,
                        json={"type": otp_type, "email": target_email, "token": token},
                        timeout=10
                    )
                    if vresp.status_code == 200:
                        print(f"\n[VERIFIED SUCCESSFULLY!] Supabase confirmed OTP code is valid (type: {otp_type})!")
                        print("Your Supabase Auth email OTP integration is 100% operational!")
                        break
                else:
                    print(f"\n[FAILED] Supabase rejected OTP code: {vresp.status_code} {vresp.text}")
        except (KeyboardInterrupt, EOFError):
            pass
    else:
        print(f"\n[ERROR] Supabase returned error ({resp.status_code}): {resp.text}")
except Exception as e:
    print(f"\n[EXCEPTION] Failed to connect to Supabase: {e}")
