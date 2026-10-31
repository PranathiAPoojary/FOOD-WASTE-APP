import React, { useState } from 'react';
import { X, Heart, ShieldCheck, MapPin, Users, Clock, AlertCircle } from 'lucide-react';
import { Donation } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ClaimModalProps {
  donation: Donation | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    donationId: number;
    requestedServings: number;
    urgency: string;
    notes: string;
  }) => Promise<void>;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  donation,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { currentUser } = useAuth();
  const [requestedServings, setRequestedServings] = useState(donation?.servings || 20);
  const [urgency, setUrgency] = useState('Standard');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !donation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        donationId: donation.id,
        requestedServings: Number(requestedServings),
        urgency,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit food claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Heart className="w-4 h-4 fill-emerald-300 text-emerald-300" />
              Claim Food for Community
            </h2>
            <p className="text-xs text-emerald-100">
              Reserve this surplus donation for your shelter or kitchen.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-5 mb-0 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Donation Summary Preview */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <h4 className="text-sm font-bold text-slate-900">{donation.title}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
              <span className="flex items-center gap-1 font-medium text-emerald-800">
                <Users className="w-3.5 h-3.5" /> Total Servings: {donation.servings}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {donation.pickupLocation}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> {donation.pickupWindow}
              </span>
            </div>
          </div>

          {/* Requested Servings */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Servings Needed
            </label>
            <input
              type="number"
              min="1"
              max={donation.servings}
              value={requestedServings}
              onChange={(e) => setRequestedServings(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Up to {donation.servings} servings available from this donor.
            </p>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="Urgent">Urgent (Can pick up within 1-2 hours)</option>
              <option value="Standard">Standard (Within scheduled pickup window)</option>
              <option value="Flexible">Flexible / Needs Volunteer Transport</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Recipient Notes & Delivery Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. We have refrigerator space ready. Gate code is #402..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Claiming as <strong>{currentUser?.organization || currentUser?.fullName}</strong>. Donor will be notified immediately.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md active:scale-95"
            >
              {isSubmitting ? 'Confirming Claim...' : 'Confirm Food Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
