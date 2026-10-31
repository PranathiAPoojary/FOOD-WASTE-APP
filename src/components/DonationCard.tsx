import React from 'react';
import {
  Clock,
  MapPin,
  Users,
  Thermometer,
  ShieldAlert,
  Edit2,
  Trash2,
  CheckCircle,
  Truck,
  Heart,
} from 'lucide-react';
import { Donation } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface DonationCardProps {
  donation: Donation;
  onClaim: (donation: Donation) => void;
  onEdit: (donation: Donation) => void;
  onDelete: (donation: Donation) => void;
}

export const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  onClaim,
  onEdit,
  onDelete,
}) => {
  const { currentUser } = useAuth();

  const isOwnerOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.id === donation.donorId ||
    currentUser?.uid === donation.donorUid;

  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Available' },
    claimed: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Claimed / Reserved' },
    in_transit: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Driver En Route' },
    completed: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Rescued & Delivered' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  };

  const currentStatus = statusStyles[donation.status] || statusStyles.available;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* Food Image with Badges */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={
            donation.imageUrl ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
          }
          alt={donation.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
            {donation.category}
          </span>
          {donation.storageCondition && (
            <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-emerald-900/80 backdrop-blur-md text-white flex items-center gap-1 shadow-xs">
              <Thermometer className="w-3 h-3 text-emerald-300" />
              {donation.storageCondition}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-xs ${currentStatus.bg} ${currentStatus.text}`}
          >
            {currentStatus.label}
          </span>
        </div>

        {/* Bottom Banner on Image: Servings & Quantity */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Feeds ~{donation.servings} people ({donation.quantity})</span>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
              {donation.title}
            </h3>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
            {donation.description}
          </p>

          {/* Dietary tags */}
          {donation.dietaryInfo && (
            <div className="flex flex-wrap gap-1 mb-4">
              {donation.dietaryInfo.split(',').map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Logistics Metadata Grid */}
          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{donation.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Window: {donation.pickupWindow}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500">
              <span>Donor: <strong className="text-slate-800 font-semibold">{donation.donorOrg || donation.donorName || 'Local Donor'}</strong></span>
              <span>Expires: {donation.expiryDate}</span>
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-2">
          {/* Claim Button for Recipients or Visitors */}
          {donation.status === 'available' ? (
            <button
              onClick={() => onClaim(donation)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
            >
              <Heart className="w-3.5 h-3.5 fill-white/20" />
              Request / Claim Food
            </button>
          ) : (
            <div className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 text-center flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Reserved for Shelter
            </div>
          )}

          {/* Owner / Admin Management Buttons */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(donation)}
                title="Edit listing details"
                className="p-2 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(donation)}
                title="Delete listing"
                className="p-2 rounded-lg text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
