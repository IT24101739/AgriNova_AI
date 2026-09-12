import sys, os, sqlite3, uuid
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import dotenv

dotenv.load_dotenv()
from app.database import get_supabase

def sync():
    conn = sqlite3.connect('agrishield.db')
    c = conn.cursor()
    c.execute("UPDATE farms SET farmer_id = '00000000-0000-0000-0000-000000000001' WHERE farmer_id IN ('1', 1)")
    conn.commit()

    c.execute('SELECT id, farmer_id, crop, latitude, longitude, district FROM farms')
    farms = c.fetchall()

    c.execute('SELECT id, farm_id, crop, description, image_url, preferred_language, disease, confidence, severity, spread_risk, status, created_at FROM reports')
    reports = c.fetchall()

    c.execute('SELECT id, report_id, disease, disease_confidence, severity, affected_percentage, weather_risk, outbreak_risk, final_confidence, spread_risk FROM analysis_results')
    analyses = c.fetchall()

    sb = get_supabase()

    print(f'Syncing {len(farms)} farms...')
    for f in farms:
        try:
            f_id = str(uuid.UUID(str(f[0])))
            fm_id = str(uuid.UUID(str(f[1])))
            sb.table('farms').upsert({
                'id': f_id,
                'farmer_id': fm_id,
                'crop': f[2],
                'latitude': float(f[3]),
                'longitude': float(f[4]),
                'district': f[5],
            }).execute()
        except Exception as e:
            print('Farm sync skip:', e)

    print(f'Syncing {len(reports)} reports...')
    for r in reports:
        try:
            r_id = str(uuid.UUID(str(r[0])))
            f_id = str(uuid.UUID(str(r[1])))
            sb.table('reports').upsert({
                'id': r_id,
                'farm_id': f_id,
                'crop': r[2],
                'description': r[3],
                'image_url': r[4],
                'preferred_language': r[5] or 'en',
                'disease': r[6],
                'confidence': float(r[7]) if r[7] is not None else 0.9,
                'severity': r[8],
                'spread_risk': r[9],
                'status': r[10] or 'IMAGE_ANALYZED',
                'created_at': r[11],
            }).execute()
        except Exception as e:
            print('Report sync skip:', e)

    print(f'Syncing {len(analyses)} analyses...')
    for a in analyses:
        try:
            a_id = str(uuid.UUID(str(a[0])))
            r_id = str(uuid.UUID(str(a[1])))
            sb.table('analysis_results').upsert({
                'id': a_id,
                'report_id': r_id,
                'disease': a[2],
                'disease_confidence': float(a[3]) if a[3] is not None else 0.9,
                'severity': a[4],
                'affected_percentage': float(a[5]) if a[5] is not None else 0.0,
                'weather_risk': a[6],
                'outbreak_risk': a[7],
                'final_confidence': float(a[8]) if a[8] is not None else 0.9,
                'spread_risk': a[9],
            }).execute()
        except Exception as e:
            print('Analysis sync skip:', e)

    check = sb.table('reports').select('id, crop, disease, status').execute()
    print(f'SUCCESS! SUPABASE NOW CONTAINS {len(check.data)} REPORTS!')
    for item in check.data[:5]:
        print(' ->', item)

if __name__ == '__main__':
    sync()
