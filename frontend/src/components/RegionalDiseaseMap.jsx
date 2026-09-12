import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Sri Lanka center
const SRI_LANKA = [7.8731, 80.7718];
const ZOOM = 8;

function markerColor(report) {
  const status = report.status?.toUpperCase();
  const severity = report.severity?.toUpperCase();
  if (status === 'CONFIRMED' && severity === 'HIGH') return '#ef4444';  // RED
  if (status === 'CONFIRMED' && severity !== 'HIGH') return '#22c55e';  // GREEN
  if (status === 'RESOLVED') return '#22c55e';
  return '#f59e0b';                                                       // YELLOW (investigating)
}

function FitBounds({ reports }) {
  const map = useMap();
  useEffect(() => {
    if (!reports?.length) return;
    const coords = reports
      .filter(r => r.farms?.latitude && r.farms?.longitude)
      .map(r => [parseFloat(r.farms.latitude), parseFloat(r.farms.longitude)]);
    if (coords.length > 0) {
      try { map.fitBounds(coords, { padding: [40, 40], maxZoom: 12 }); }
      catch { /* silently ignore if coords invalid */ }
    }
  }, [reports, map]);
  return null;
}

function ReportPopup({ report }) {
  const pct = report.confidence ? `${Math.round(report.confidence * 100)}%` : '—';
  return (
    <div className="text-sm space-y-1.5 min-w-[200px]">
      <p className="font-bold text-white text-base">{report.disease || 'Undiagnosed'}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-slate-400">Crop</span>
        <span className="text-slate-200">{report.crop || '—'}</span>
        <span className="text-slate-400">AI Confidence</span>
        <span className="text-slate-200">{pct}</span>
        <span className="text-slate-400">Severity</span>
        <span className={`font-semibold ${
          report.severity === 'HIGH' ? 'text-red-400' :
          report.severity === 'MEDIUM' ? 'text-amber-400' : 'text-green-400'
        }`}>{report.severity || '—'}</span>
        <span className="text-slate-400">Spread Risk</span>
        <span className="text-slate-200">{report.spread_risk || '—'}</span>
        <span className="text-slate-400">Status</span>
        <span className="text-slate-200">{report.status?.replace(/_/g, ' ') || '—'}</span>
      </div>
      <p className="text-[10px] text-slate-500 pt-1">
        {report.created_at
          ? new Date(report.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : ''}
      </p>
    </div>
  );
}

export default function RegionalDiseaseMap({
  reports = [],
  outbreaks = [],
  height = '100%',
  autoFit = true,
}) {
  const validReports = reports.filter(
    r => r.farms?.latitude && r.farms?.longitude
  );

  return (
    <MapContainer
      center={SRI_LANKA}
      zoom={ZOOM}
      style={{ width: '100%', height }}
      className="rounded-xl"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
      />

      {autoFit && <FitBounds reports={validReports} />}

      {/* Outbreak zones (purple circles) */}
      {outbreaks.map(ob => (
        ob.latitude && ob.longitude ? (
          <Circle
            key={ob.id}
            center={[parseFloat(ob.latitude), parseFloat(ob.longitude)]}
            radius={(ob.radius_km || 25) * 1000}
            pathOptions={{
              color: '#8b5cf6',
              fillColor: '#8b5cf6',
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '6 4',
            }}
          >
            <Popup>
              <div className="text-sm space-y-1">
                <p className="font-bold text-violet-400">⚠ Confirmed Outbreak</p>
                <p className="text-white">{ob.disease}</p>
                <p className="text-slate-400 text-xs">Crop: {ob.crop}</p>
                <p className="text-slate-400 text-xs">Radius: {ob.radius_km} km</p>
              </div>
            </Popup>
          </Circle>
        ) : null
      ))}

      {/* Report markers */}
      {validReports.map(report => {
        const color = markerColor(report);
        const lat = parseFloat(report.farms.latitude);
        const lon = parseFloat(report.farms.longitude);
        return (
          <CircleMarker
            key={report.id}
            center={[lat, lon]}
            radius={7}
            pathOptions={{
              color: '#000',
              weight: 1.5,
              fillColor: color,
              fillOpacity: 0.85,
            }}
          >
            <Popup minWidth={220}>
              <ReportPopup report={report} />
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
