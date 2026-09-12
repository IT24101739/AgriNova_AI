/**
 * AdditionalInfo.jsx – Dev 2
 *
 * Dedicated page for NEED_MORE_INFO cases.
 * Route: /additional-info/:reportId
 *
 * Shows a clear, friendly guide explaining WHY more info is needed
 * and embeds the AdditionalPhotoRequest component.
 */

import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdditionalPhotoRequest from "../components/AdditionalPhotoRequest";

const WHAT_TO_LOOK_FOR = [
  {
    emoji: "🔵",
    title: "Spots or patches",
    desc: "Dark, light, or coloured patches on the leaf surface or edges.",
  },
  {
    emoji: "🟤",
    title: "Brown or yellow areas",
    desc: "Discolouration spreading from the centre or edges of the leaf.",
  },
  {
    emoji: "⚪",
    title: "Mold or powder",
    desc: "White or grey fuzzy coating — especially on the underside of leaves.",
  },
  {
    emoji: "💧",
    title: "Water-soaked lesions",
    desc: "Dark, wet-looking patches that may have a ring pattern around them.",
  },
];

const AdditionalInfo = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const handleSuccess = (result) => {
    // Navigate to the result page with the updated analysis
    navigate(`/results/${reportId}`, { replace: true });
  };

  const handleError = (msg) => {
    alert(`Upload error: ${msg}`); // Simple fallback — replace with toast in production
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20">
      {/* Nav */}
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/40 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="text-white font-semibold text-sm flex-1">Additional Information</h1>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-12">
        {/* Hero explanation */}
        <div className="text-center pt-2 pb-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-4xl">
            🔍
          </div>
          <h2 className="text-white text-xl font-bold mb-2">
            We Need a Clearer Photo
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            The initial photo wasn't sharp enough for a confident diagnosis.
            A better photo will help us give you the right treatment advice.
          </p>
        </div>

        {/* Why section */}
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 p-5">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <span>📋</span> What to photograph
          </h3>
          <div className="space-y-3">
            {WHAT_TO_LOOK_FOR.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                <div>
                  <p className="text-slate-200 text-sm font-medium">{item.title}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underside tip */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-2xl">💡</span>
          <p className="text-emerald-300 text-sm leading-relaxed">
            <span className="font-semibold">Tip:</span> Turn the leaf over and photograph the underside — many diseases first appear there.
          </p>
        </div>

        {/* Upload component */}
        <AdditionalPhotoRequest
          reportId={reportId}
          onSuccess={handleSuccess}
          onError={handleError}
        />

        {/* Skip / officer option */}
        <div className="text-center">
          <p className="text-slate-500 text-xs mb-2">
            Unable to take a better photo right now?
          </p>
          <button
            onClick={() => navigate(`/results/${reportId}`)}
            className="text-slate-400 hover:text-white text-sm underline underline-offset-2 transition-colors"
          >
            View current diagnosis anyway →
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdditionalInfo;
