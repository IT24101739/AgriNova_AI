/**
 * AdditionalPhotoRequest.jsx – Dev 2
 *
 * Shown when decision = NEED_MORE_INFO.
 * Guides the farmer to upload a better/closer photo and
 * submits it to the backend via submitAdditionalImage().
 */

import React, { useRef, useState } from "react";
import { submitAdditionalImage } from "../services/analysisService";

const TIPS = [
  { icon: "🔍", text: "Take a close-up of the most affected leaf" },
  { icon: "🌿", text: "Also photograph the underside of the leaf" },
  { icon: "☀️", text: "Shoot in good natural light — avoid flash" },
  { icon: "📏", text: "Include the whole leaf in the frame" },
];

const AdditionalPhotoRequest = ({ reportId, onSuccess, onError }) => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    setFile(dropped);
    setPreview(URL.createObjectURL(dropped));
  };

  const handleSubmit = async () => {
    if (!file || !reportId) return;
    setUploading(true);
    setProgress(0);
    try {
      const result = await submitAdditionalImage(reportId, file, setProgress);
      setUploading(false);
      onSuccess?.(result);
    } catch (err) {
      setUploading(false);
      onError?.(err.message || "Upload failed. Please try again.");
    }
  };

  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 overflow-hidden">
      {/* Header */}
      <div className="bg-amber-500/15 border-b border-amber-500/20 p-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📸</span>
          <div>
            <h3 className="text-amber-300 font-bold text-sm">Better Photo Needed</h3>
            <p className="text-amber-200/70 text-xs mt-0.5">
              The system needs a clearer photo to make a confident diagnosis.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Photo tips */}
        <div className="grid grid-cols-2 gap-2">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/30">
              <span className="text-lg flex-shrink-0">{tip.icon}</span>
              <span className="text-slate-300 text-xs leading-snug">{tip.text}</span>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="relative flex flex-col items-center justify-center gap-3 border-2 border-dashed border-amber-500/30 rounded-xl p-6 cursor-pointer hover:border-amber-500/60 hover:bg-amber-500/5 transition-all"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-40 rounded-lg object-cover shadow-lg" />
          ) : (
            <>
              <span className="text-4xl">🖼️</span>
              <p className="text-amber-300 text-sm font-medium">Tap to choose a photo</p>
              <p className="text-slate-400 text-xs">or drag and drop · JPEG, PNG, WEBP · max 10 MB</p>
            </>
          )}
          {file && (
            <p className="text-emerald-400 text-xs">✓ {file.name}</p>
          )}
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading & analysing…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
            file && !uploading
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          {uploading ? "Analysing photo…" : "Submit Photo for Re-analysis"}
        </button>
      </div>
    </div>
  );
};

export default AdditionalPhotoRequest;
