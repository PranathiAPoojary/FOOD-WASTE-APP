import React, { useState, useEffect } from 'react';
import { HeartHandshake, MapPin, Clock, CheckCircle2, AlertCircle, Building, Plus } from 'lucide-react';
import { Claim } from '../types.ts';
import { api } from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface RecipientClaimsProps {
  onBrowseMore: () => void;
}

export const RecipientClaims: React.FC<RecipientClaimsProps> = ({ onBrowseMore }) => {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const all = await api.getClaims();
      // Filter for this recipient if not admin
      const filtered =
        currentUser?.role === 'admin'
          ? all
          : all.filter((c) => c.recipientId === currentUser?.id || c.recipientUid === currentUser?.uid);
      setClaims(filtered.length > 0 ? filtered : all);
    } catch (err) {
      console.error('Failed to load recipient claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, [currentUser]);

  const totalServingsClaimed = claims.reduce((acc, c) => acc + (c.requestedServings || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950 mb-3">
              <HeartHandshake className="w-3.5 h-3.5" /> Community Recipient Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit']">
              My Food Claims & Distribution
            </h1>
            <p className="text-emerald-200 text-sm mt-1 max-w-xl">
              Track food reserved by your shelter or organization, monitor driver pickups, and confirm deliveries.
            </p>
          </div>

          <button
            onClick={onBrowseMore}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-emerald-50 active:scale-95 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Claim More Food
          </button>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-xs text-emerald-300 font-medium">Total Claims</span>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{claims.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <span className="text-xs text-emerald-300 font-medium">Servings Secured</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-0.5">
              ~{totalServingsClaimed} meals
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-xs text-emerald-300 font-medium">Partner Organization</span>
            <p className="text-sm font-bold text-white mt-1 truncate">
              {currentUser?.organization || 'Community Partner'}
            </p>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-600" />
          Claim Records & Rescue Progress
        </h2>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading food claims...</div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-600 text-sm font-semibold">No food claimed yet.</p>
            <p className="text-slate-400 text-xs mt-1">Browse surplus donations in your area and claim food for your community.</p>
            <button
              onClick={onBrowseMore}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
            >
              Browse Surplus Food
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">CLAIM #{claim.id}</span>
                      <h4 className="text-base font-bold text-slate-900">{claim.donationTitle || 'Surplus Food'}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 capitalize">
                      {claim.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                      <span>Servings: <strong>{claim.requestedServings} portions</strong></span>
                    </div>
                    {claim.donationLocation && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{claim.donationLocation}</span>
                      </div>
                    )}
                    {claim.notes && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 text-[11px] mt-2">
                        "{claim.notes}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Urgency: <strong className="text-slate-800">{claim.urgency}</strong></span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Logged in PostgreSQL
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
