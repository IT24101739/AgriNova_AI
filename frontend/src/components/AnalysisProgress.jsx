/**
 * AnalysisProgress — animated step indicator shown while a report is processing.
 * Shows spinner while status = ANALYZING, success/error on completion.
 */

import React from 'react';

const STEPS = [
  { id: 'upload',   label: 'Uploaded',        icon: '📤' },
  { id: 'classify', label: 'Classifying',     icon: '🔬' },
  { id: 'severity', label: 'Severity Check',  icon: '📊' },
  { id: 'done',     label: 'Complete',        icon: '✅' },
];

function getActiveStep(status) {
  switch (status) {
    case 'PENDING':        return 0;
    case 'ANALYZING':      return 2;
    case 'IMAGE_ANALYZED': return 3;
    case 'DIAGNOSED':      return 3;
    case 'COMPLETED':      return 3;
    case 'FAILED':         return -1; // error state
    default:               return 0;
  }
}

export default function AnalysisProgress({ status }) {
  const activeStep = getActiveStep(status);
  const isFailed = status === 'FAILED';
  const isDone = activeStep === 3;
  const isAnalyzing = status === 'ANALYZING';

  return (
    <div
      className="agri-card"
      style={{ textAlign: 'center', padding: '2rem 1.25rem' }}
    >
      {/* Main icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: isFailed
            ? 'rgba(239,68,68,0.1)'
            : isDone
            ? 'rgba(34,197,94,0.1)'
            : 'rgba(59,130,246,0.1)',
          border: `2px solid ${isFailed ? '#ef4444' : isDone ? '#22c55e' : '#3b82f6'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          animation: isAnalyzing ? 'pulse-glow 2s ease-in-out infinite' : 'none',
        }}
      >
        {isAnalyzing ? (
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        ) : (
          <span style={{ fontSize: '2rem' }}>
            {isFailed ? '❌' : isDone ? '✅' : '⏳'}
          </span>
        )}
      </div>

      {/* Status message */}
      <h3 style={{ fontWeight: 700, marginBottom: '0.35rem', fontSize: '1.05rem' }}>
        {isFailed
          ? 'Analysis Failed'
          : isDone
          ? 'Analysis Complete'
          : 'Analyzing your crop…'}
      </h3>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
        {isFailed
          ? 'Please try submitting the report again.'
          : isDone
          ? 'Your results are ready below.'
          : 'Our AI is examining the leaf image. This may take a few seconds.'}
      </p>

      {/* Step dots */}
      {!isFailed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            justifyContent: 'center',
          }}
        >
          {STEPS.map((step, idx) => {
            const isComplete = idx < activeStep;
            const isActive = idx === activeStep || (isDone && idx === STEPS.length - 1);
            const isPending = idx > activeStep;

            return (
              <React.Fragment key={step.id}>
                {/* Step dot */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    minWidth: 64,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isComplete || isActive
                        ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                        : 'var(--color-surface-2)',
                      border: isActive && isAnalyzing
                        ? '2px solid #22c55e'
                        : '2px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      transition: 'all 0.4s ease',
                      boxShadow: isActive
                        ? '0 0 12px rgba(34,197,94,0.4)'
                        : 'none',
                    }}
                  >
                    {isActive && isAnalyzing ? (
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    ) : (
                      <span>{isComplete || isActive ? step.icon : '○'}</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: isComplete || isActive ? '#4ade80' : 'var(--color-muted)',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={`step-line ${isComplete ? 'active' : ''}`}
                    style={{ marginBottom: '1.4rem' }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
