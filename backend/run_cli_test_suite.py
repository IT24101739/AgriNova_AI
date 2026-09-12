#!/usr/bin/env python3
"""
AgriNova AI — Automated CLI End-to-End Test Suite
Tests all farmer and officer workflows via HTTP API calls against the live servers.
"""

import os
import sys
import time
import json
import urllib.request
import urllib.error
import mimetypes

# Configure UTF-8 stdout on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

results = []

def record(name: str, passed: bool, duration_ms: float, details: str = ""):
    results.append({
        "name": name,
        "passed": passed,
        "duration_ms": duration_ms,
        "details": details
    })
    status_str = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
    print(f"[{status_str}] {BOLD}{name}{RESET} ({duration_ms:.1f}ms)")
    if details:
        print(f"       +-- {details}")

def http_get(url: str, timeout: int = 15) -> tuple[int, dict | str]:
    t0 = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AgriNova-CLI-Tester"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read().decode("utf-8")
            try:
                parsed = json.loads(data)
                return resp.status, parsed
            except Exception:
                return resp.status, data
    except urllib.error.HTTPError as e:
        data = e.read().decode("utf-8")
        try:
            return e.code, json.loads(data)
        except Exception:
            return e.code, data
    except Exception as e:
        return 0, str(e)

def http_post_json(url: str, payload: dict, timeout: int = 20) -> tuple[int, dict | str]:
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "AgriNova-CLI-Tester"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(data)
            except Exception:
                return resp.status, data
    except urllib.error.HTTPError as e:
        data = e.read().decode("utf-8")
        try:
            return e.code, json.loads(data)
        except Exception:
            return e.code, data
    except Exception as e:
        return 0, str(e)

def http_post_multipart(url: str, fields: dict, file_field: str, file_path: str, timeout: int = 30) -> tuple[int, dict | str]:
    boundary = "----AgriNovaBoundary" + str(int(time.time()))
    body = bytearray()
    
    for k, v in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode("utf-8"))
        body.extend(f"{v}\r\n".encode("utf-8"))
        
    filename = os.path.basename(file_path)
    mime_type = mimetypes.guess_type(file_path)[0] or "image/jpeg"
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'.encode("utf-8"))
    body.extend(f"Content-Type: {mime_type}\r\n\r\n".encode("utf-8"))
    
    with open(file_path, "rb") as f:
        body.extend(f.read())
    body.extend(f"\r\n--{boundary}--\r\n".encode("utf-8"))
    
    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "User-Agent": "AgriNova-CLI-Tester"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read().decode("utf-8")
            try:
                return resp.status, json.loads(data)
            except Exception:
                return resp.status, data
    except urllib.error.HTTPError as e:
        data = e.read().decode("utf-8")
        try:
            return e.code, json.loads(data)
        except Exception:
            return e.code, data
    except Exception as e:
        return 0, str(e)


def main():
    print(f"\n{BOLD}{CYAN}=============================================================={RESET}")
    print(f"{BOLD}{CYAN}      AgriNova AI — Automated CLI End-to-End Test Suite       {RESET}")
    print(f"{BOLD}{CYAN}=============================================================={RESET}\n")

    # 1. Backend Health Check
    t0 = time.time()
    code, resp = http_get(f"{BACKEND_URL}/health")
    passed = code == 200 and isinstance(resp, dict) and resp.get("data", {}).get("status") == "healthy"
    record("1. Backend Health Service (/health)", passed, (time.time() - t0) * 1000, f"Status: {code}, Healthy: {passed}")

    # 2. Frontend Dev Server Root Check
    t0 = time.time()
    code, resp = http_get(f"{FRONTEND_URL}/")
    passed = code == 200 and "html" in str(resp).lower()
    record("2. Frontend Web Server (http://localhost:5173/)", passed, (time.time() - t0) * 1000, f"Status: {code}, Delivered Index HTML")

    # 3. Submit New Farmer Disease Scan
    image_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/public/images/leaf_macro.jpg"))
    t0 = time.time()
    fields = {
        "crop": "Tomato",
        "description": "Automated verification scan: yellow discoloration along leaf margin",
        "preferred_language": "en",
        "farmer_id": "00000000-0000-0000-0000-000000000001",
        "latitude": "6.9271",
        "longitude": "79.8612",
        "district": "Colombo",
    }
    code, resp = http_post_multipart(f"{BACKEND_URL}/api/reports", fields, "image", image_path)
    report_id = None
    farm_id = None
    passed = code in (200, 201) and isinstance(resp, dict) and resp.get("success") is True
    if passed:
        report_data = resp.get("data", {})
        report_id = report_data.get("id")
        farm_id = report_data.get("farm_id")
        disease = report_data.get("image_analysis", {}).get("disease")
        severity = report_data.get("image_analysis", {}).get("severity")
        details = f"Report ID: {report_id} | Disease: {disease} | Severity: {severity}"
    else:
        details = f"Failed with code {code}: {resp}"
    record("3. Farmer Leaf Scan Pipeline (POST /api/reports)", passed, (time.time() - t0) * 1000, details)

    # 4. Fetch Single Report Details
    if report_id:
        t0 = time.time()
        code, resp = http_get(f"{BACKEND_URL}/api/reports/{report_id}")
        passed = code == 200 and isinstance(resp, dict) and resp.get("data", {}).get("id") == report_id
        record("4. Fetch Report by ID (GET /api/reports/:id)", passed, (time.time() - t0) * 1000, f"Retrieved report {report_id}")
    else:
        record("4. Fetch Report by ID", False, 0, "Skipped due to prior step failure")

    # 5. Full Diagnosis Advisory Analysis
    if report_id:
        t0 = time.time()
        code, resp = http_post_json(f"{BACKEND_URL}/api/reports/{report_id}/complete-analysis", {"preferred_language": "en"})
        passed = code == 200 and isinstance(resp, dict) and resp.get("success") is True
        decision = resp.get("data", {}).get("decision") if passed else ""
        treatment = len(resp.get("data", {}).get("farmer_advice", {}).get("treatment_steps", [])) if passed else 0
        record("5. Smart Advisory & Analysis (POST /api/reports/:id/complete-analysis)", passed, (time.time() - t0) * 1000, f"Decision: {decision} | Treatment Steps: {treatment}")
    else:
        record("5. Smart Advisory & Analysis", False, 0, "Skipped due to missing report ID")

    # 6. Multi-lingual Advice Generation (Sinhala & Tamil)
    if report_id:
        t0 = time.time()
        code_si, resp_si = http_get(f"{BACKEND_URL}/api/reports/{report_id}/advice?language=si")
        passed_si = code_si == 200 and isinstance(resp_si, dict) and resp_si.get("success") is True
        code_ta, resp_ta = http_get(f"{BACKEND_URL}/api/reports/{report_id}/advice?language=ta")
        passed_ta = code_ta == 200 and isinstance(resp_ta, dict) and resp_ta.get("success") is True
        passed = passed_si and passed_ta
        record("6. Multi-lingual Advisory Support (Sinhala 'si' & Tamil 'ta')", passed, (time.time() - t0) * 1000, f"Sinhala HTTP: {code_si}, Tamil HTTP: {code_ta}")
    else:
        record("6. Multi-lingual Advisory Support", False, 0, "Skipped")

    # 7. Weather Risk by GPS Location
    t0 = time.time()
    code, resp = http_get(f"{BACKEND_URL}/api/weather/risk?lat=6.9271&lon=79.8612&disease=Tomato%20Early%20Blight")
    passed = code == 200 and isinstance(resp, dict) and resp.get("success") is True
    wdata = resp.get("data", {}) if passed else {}
    record("7. Open-Meteo Weather Risk Service (GET /api/weather/risk)", passed, (time.time() - t0) * 1000, f"Risk: {wdata.get('weather_risk')} | Temp: {wdata.get('temperature')}°C | Humidity: {wdata.get('humidity')}%")

    # 8. Farm History Reports
    if farm_id:
        t0 = time.time()
        code, resp = http_get(f"{BACKEND_URL}/api/farms/{farm_id}/reports")
        count = len(resp.get("data", {}).get("reports", [])) if isinstance(resp, dict) else 0
        passed = code == 200 and count > 0
        record("8. Farmer Farm Reports History (GET /api/farms/:id/reports)", passed, (time.time() - t0) * 1000, f"Found {count} historical scans for farm {farm_id}")
    else:
        record("8. Farmer Farm Reports History", False, 0, "Skipped")

    # 9. Officer Dashboard Statistics
    t0 = time.time()
    code, resp = http_get(f"{BACKEND_URL}/api/officer/dashboard/stats")
    passed = code == 200 and isinstance(resp, dict) and resp.get("success") is True
    stats = resp.get("data", {}) if passed else {}
    record("9. Officer Dashboard Statistics (GET /api/officer/dashboard/stats)", passed, (time.time() - t0) * 1000, f"Open Cases: {stats.get('open_cases')} | High Priority: {stats.get('high_priority_cases')} | Visits: {stats.get('todays_field_visits')}")

    # 10. Officer Triage Tickets List
    t0 = time.time()
    code, resp = http_get(f"{BACKEND_URL}/api/officer/tickets")
    passed = code == 200 and isinstance(resp, dict) and resp.get("success") is True
    tickets = resp.get("data", []) if passed else []
    record("10. Officer Triage Tickets List (GET /api/officer/tickets)", passed, (time.time() - t0) * 1000, f"Tickets loaded: {len(tickets)}")

    # 11. Officer Regional Map Reports
    t0 = time.time()
    code, resp = http_get(f"{BACKEND_URL}/api/officer/map/reports")
    passed = code == 200 and isinstance(resp, dict) and resp.get("success") is True
    map_points = resp.get("data", []) if passed else []
    record("11. Officer Surveillance Map Reports (GET /api/officer/map/reports)", passed, (time.time() - t0) * 1000, f"Geo-tagged incidents: {len(map_points)}")

    # 12. Officer Regional Outbreak Zones
    t0 = time.time()
    code, resp = http_get(f"{BACKEND_URL}/api/officer/map/outbreaks")
    passed = code == 200 and isinstance(resp, dict) and resp.get("success") is True
    outbreaks = resp.get("data", []) if passed else []
    record("12. Officer Outbreak Zones (GET /api/officer/map/outbreaks)", passed, (time.time() - t0) * 1000, f"Active outbreak zones: {len(outbreaks)}")

    # 13. Officer Outbreak Candidates
    t0 = time.time()
    code, resp = http_get(f"{BACKEND_URL}/api/officer/outbreaks/candidates")
    passed = code == 200 and isinstance(resp, dict) and resp.get("success") is True
    candidates = resp.get("data", []) if passed else []
    record("13. Officer Outbreak Radar Candidates (GET /api/officer/outbreaks/candidates)", passed, (time.time() - t0) * 1000, f"Candidate clusters: {len(candidates)}")

    # 14. Officer Outbreak Confirmed List
    t0 = time.time()
    code, resp = http_get(f"{BACKEND_URL}/api/officer/outbreaks/confirmed")
    passed = code == 200 and isinstance(resp, dict) and resp.get("success") is True
    confirmed = resp.get("data", []) if passed else []
    record("14. Officer Confirmed Outbreak List (GET /api/officer/outbreaks/confirmed)", passed, (time.time() - t0) * 1000, f"Confirmed outbreaks: {len(confirmed)}")

    # Summary
    total = len(results)
    passed_count = sum(1 for r in results if r["passed"])
    failed_count = total - passed_count
    
    print(f"\n{BOLD}{CYAN}=============================================================={RESET}")
    print(f"{BOLD}Test Results: {GREEN}{passed_count} Passed{RESET}, {RED if failed_count else GREEN}{failed_count} Failed{RESET} (Total: {total})")
    print(f"{BOLD}{CYAN}=============================================================={RESET}\n")

    return 0 if failed_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
