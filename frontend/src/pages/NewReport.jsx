/**
 * NewReport — full report submission form.
 *
 * Form state machine:
 *   idle → uploading → analyzing → success | error
 *
 * On success: navigates to /reports/:id (ReportStatus)
 * All field validation is done before submit.
 * AI is called via FastAPI only — never directly from React.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReport } from '../services/api';

import CropSelector from '../components/CropSelector';
import ImageUploader from '../components/ImageUploader';
import LanguageSelector from '../components/LanguageSelector';
import LocationSelector from '../components/LocationSelector';

// Demo farmer ID — replace with Supabase Auth user ID
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
  const [location, setLocation]     = useState({ latitude: null, longitude: null });

  // Submission state
  const [submitState, setSubmitState] = useState(SUBMIT_STATES.IDLE);
  const [submitError, setSubmitError] = useState('');

  // Validation errors per field
  const [errors, setErrors] = useState({});

  // ── Validation ──────────────────────────────────────────────

  const validate = () => {
    const newErrors = {};
    if (!crop) newErrors.crop = 'Please select a crop.';
    if (!imageFile) newErrors.image = 'Please upload a leaf image.';
    if (!location.latitude || !location.longitude) newErrors.location = 'Farm location is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────

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

      // Save farm_id to localStorage for the home page
      if (response.data?.farm_id) {
        localStorage.setItem('agrishield_farm_id', response.data.farm_id);
      }

      setSubmitState(SUBMIT_STATES.SUCCESS);
      setTimeout(() => navigate(`/reports/${reportId}`), 800);
    } catch (err) {
      setSubmitState(SUBMIT_STATES.ERROR);
      setSubmitError(err.message || 'Submission failed. Please try again.');
    }
  };

  const isSubmitting =
    submitState === SUBMIT_STATES.UPLOADING ||
    submitState === SUBMIT_STATES.ANALYZING;

  // ── Submission overlay ───────────────────────────────────────

  if (submitState === SUBMIT_STATES.SUCCESS) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            border: '2px solid #22c55e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            marginBottom: '1rem',
            animation: 'pulse-glow 1.5s ease-in-out infinite',
          }}
        >
          ✅
        </div>
        <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Report Submitted!</h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem' }}>
          Redirecting to your results…
        </p>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <div className="spinner spinner-green" style={{ width: 48, height: 48, borderWidth: 4 }} />
        <h2 style={{ fontWeight: 700 }}>
          {submitState === SUBMIT_STATES.UPLOADING ? 'Uploading image…' : 'AI is analyzing…'}
        </h2>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', maxWidth: 280 }}>
          {submitState === SUBMIT_STATES.UPLOADING
            ? 'Uploading your leaf photo securely.'
            : 'Detecting disease and estimating severity. Please wait…'}
        </p>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(12px)',
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/')}
          aria-label="Go back"
          style={{ padding: '0.4rem' }}
        >
          ‹
        </button>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>
            New Disease Report
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
            Upload a leaf photo for AI diagnosis
          </p>
        </div>
      </header>

      {/* Form */}
      <main className="agri-container" style={{ flex: 1, padding: '1.25rem 1rem 2rem' }}>
        <form
          id="new-report-form"
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {/* 1. Crop */}
          <div className="animate-fade-up delay-1">
            <CropSelector
              value={crop}
              onChange={setCrop}
              error={errors.crop}
            />
          </div>

          {/* 2. Image */}
          <div className="animate-fade-up delay-2">
            <ImageUploader
              file={imageFile}
              onFileChange={setImageFile}
              error={errors.image}
            />
          </div>

          {/* 3. Description */}
          <div className="form-group animate-fade-up delay-2">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className="form-input form-textarea"
              placeholder="Describe what you see on the plant — yellowing, spots, wilting…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', alignSelf: 'flex-end' }}>
              {description.length}/500
            </span>
          </div>

          {/* 4. Language */}
          <div className="animate-fade-up delay-3">
            <LanguageSelector
              value={language}
              onChange={setLanguage}
              error={errors.language}
            />
          </div>

          {/* 5. Location */}
          <div className="animate-fade-up delay-3">
            <LocationSelector
              latitude={location.latitude}
              longitude={location.longitude}
              onChange={(loc) => setLocation(loc)}
              error={errors.location}
            />
          </div>

          {/* Submit error */}
          {submitState === SUBMIT_STATES.ERROR && (
            <div
              className="agri-card"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
                padding: '0.875rem 1rem',
              }}
            >
              ❌ {submitError}
            </div>
          )}

          {/* Submit button */}
          <div className="animate-fade-up delay-4">
            <button
              id="btn-submit-report"
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={isSubmitting}
            >
              <span style={{ fontSize: '1.1rem' }}>🌿</span>
              Submit Report
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            Your image is analysed by AI privately. Results appear immediately.
          </p>
        </form>
      </main>
    </div>
  );
}
