/**
 * NewReport — AI leaf disease diagnosis form.
 * Polished glassmorphism UI with field validation and real-time inference trigger.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReport } from '../services/api';

import CropSelector from '../components/CropSelector';
import ImageUploader from '../components/ImageUploader';
import LanguageSelector from '../components/LanguageSelector';
import LocationSelector from '../components/LocationSelector';
import { ArrowLeft, Sparkles, CheckCircle2, AlertCircle, Camera, Shield } from 'lucide-react';

const DEMO_FARMER_ID = localStorage.getItem('agrishield_farmer_id') || '00000000-0000-0000-0000-000000000001';

const SUBMIT_STATES = {
  IDLE:      'idle',
  UPLOADING: 'uploading',
  ANALYZING: 'analyzing',
  SUCCESS:   'success',
  ERROR:     'error',
};

export default function NewReport() {
  const navigate = useNavigate();

  // Form state
  const [crop, setCrop]             = useState('');
  const [imageFile, setImageFile]   = useState(null);
  const [description, setDescription] = useState('');
  const [language, setLanguage]     = useState('en');
  const [location, setLocation]     = useState({ latitude: 6.9271, longitude: 79.8612 }); // Default: Colombo/Western

  // Submission state
  const [submitState, setSubmitState] = useState(SUBMIT_STATES.IDLE);
  const [submitError, setSubmitError] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!crop) newErrors.crop = 'Please select a crop type.';
    if (!imageFile) newErrors.image = 'Please capture or upload a leaf photo.';
    if (!location.latitude || !location.longitude) newErrors.location = 'Farm GPS coordinates are required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    setSubmitState(SUBMIT_STATES.UPLOADING);

    const formData = new FormData();
    formData.append('farmer_id', DEMO_FARMER_ID);
    formData.append('crop', crop);
    formData.append('description', description);
    formData.append('preferred_language', language);
    formData.append('latitude', location.latitude);
    formData.append('longitude', location.longitude);
    formData.append('image', imageFile);

    setSubmitState(SUBMIT_STATES.ANALYZING);

    try {
      const response = await createReport(formData);
      const reportId = response.data?.id;

      if (response.data?.farm_id) {
        localStorage.setItem('agrishield_farm_id', response.data.farm_id);
      }

      setSubmitState(SUBMIT_STATES.SUCCESS);
      setTimeout(() => navigate(`/reports/${reportId}`), 800);
    } catch (err) {
      setSubmitState(SUBMIT_STATES.ERROR);
      setSubmitError(err.message || 'Submission failed. Please verify the backend connection.');
    }
  };

  const isSubmitting =
    submitState === SUBMIT_STATES.UPLOADING ||
    submitState === SUBMIT_STATES.ANALYZING;

  // ── Success State ──
  if (submitState === SUBMIT_STATES.SUCCESS) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mb-4 shadow-xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Scan Submitted!</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Image analyzed by EfficientNet-B0 and HSV lesion estimator. Redirecting to your diagnostic results…
        </p>
      </div>
    );
  }

  // ── Submitting State ──
  if (isSubmitting) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin mb-6" />
        <h2 className="text-xl font-bold text-white mb-2">
          {submitState === SUBMIT_STATES.UPLOADING ? 'Uploading Leaf Image…' : 'Neural Network Analyzing…'}
        </h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          {submitState === SUBMIT_STATES.UPLOADING
            ? 'Sending photo to secure Supabase storage…'
            : 'Extracting leaf contours, computing lesion severity, and generating weather advisory…'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      
      {/* ── Breadcrumbs & Back ── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <button
          onClick={() => navigate('/farmer')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Feature Slice 1 & 2
        </span>
      </div>

      {/* ── Title Card ── */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Camera className="w-7 h-7 text-emerald-400" />
          New Disease Diagnostic Scan
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload a high-clarity photo of infected crop foliage to get an instant AI diagnosis and advisory.
        </p>
      </div>

      {/* ── Form Card ── */}
      <div className="glass-elevated rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          
          {/* 1. Crop Selection */}
          <div>
            <CropSelector
              value={crop}
              onChange={setCrop}
              error={errors.crop}
            />
          </div>

          {/* 2. Leaf Photo Upload */}
          <div>
            <ImageUploader
              file={imageFile}
              onFileChange={setImageFile}
              error={errors.image}
            />
          </div>

          {/* 3. Symptoms Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Visual Symptoms & Notes (Optional)
            </label>
            <textarea
              id="description"
              className="w-full bg-[#0b1329] border border-white/10 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all min-h-[90px] resize-y"
              placeholder="E.g., Yellow rings on lower leaves, brown curling tips, spotted stems after rain…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-slate-500 font-mono">
                {description.length}/500
              </span>
            </div>
          </div>

          {/* 4. Language & 5. Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-white/5">
            <div>
              <LanguageSelector
                value={language}
                onChange={setLanguage}
                error={errors.language}
              />
            </div>
            <div>
              <LocationSelector
                latitude={location.latitude}
                longitude={location.longitude}
                onChange={(loc) => setLocation(loc)}
                error={errors.location}
              />
            </div>
          </div>

          {/* Error Banner */}
          {submitState === SUBMIT_STATES.ERROR && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 border-t border-white/10">
            <button
              id="btn-submit-report"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-xl shadow-emerald-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Analyze Leaf Disease Now</span>
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2.5">
              Encrypted end-to-end. Low confidence cases are automatically routed to regional officers.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
