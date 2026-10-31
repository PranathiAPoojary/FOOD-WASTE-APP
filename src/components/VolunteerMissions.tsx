import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, CheckCircle2, Navigation, AlertCircle, ChevronRight } from 'lucide-react';
import { Delivery, Donation } from '../types.ts';
import { api } from '../api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const VolunteerMissions: React.FC = () => {
  const { currentUser } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNotes, setActiveNotes] = useState<Record<number, string>>({});

  const loadLogistics = async () => {
    setLoading(true);
    try {
      const [delList, donList] = await Promise.all([
        api.getDeliveries(),
        api.getDonations({ status: 'claimed' }),
      ]);
      setDeliveries(delList);
      setDonations(donList);
    } catch (err: any) {
      console.error('Error loading logistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogistics();
  }, []);

  const handleClaimMission = async (donation: Donation) => {
    try {
      await api.createDelivery({
        donationId: donation.id,
        volunteerId: currentUser?.id || 7,
        volunteerUid: currentUser?.uid || 'volunteer_alex_uid',
        status: 'assigned',
      });
      loadLogistics();
    } catch (err: any) {
      alert(`Error accepting mission: ${err.message}`);
    }
  };

  const handleStatusUpdate = async (deliveryId: number, nextStatus: string) => {
    try {
      const notes = activeNotes[deliveryId];
      await api.updateDeliveryStatus(deliveryId, nextStatus, notes);
      loadLogistics();
    } catch (err: any) {
      alert(`Error updating mission: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Volunteer Header */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-400 text-teal-950 mb-3">
              <Truck className="w-3.5 h-3.5" /> Volunteer Driver Dispatch
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit']">
              Food Rescue Missions & Logistics
            </h1>
            <p className="text-teal-200 text-sm mt-1 max-w-xl">
              Transport surplus food from donor restaurants and bakeries directly to community shelters.
            </p>
          </div>
          <button
            onClick={loadLogistics}
            className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold border border-white/20 transition-all"
          >
            Refresh Missions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Claimed Donations Needing Drivers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600" />
            Unassigned Pickups Needing Volunteers ({donations.length})
          </h2>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading missions...</div>
          ) : donations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              No unclaimed deliveries right now. Great job! Check back when new donations are claimed.
            </div>
          ) : (
            <div className="space-y-3">
              {donations.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.servings} Servings
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.pickupLocation}</span>
                    </div>
                    <div className="text-xs text-amber-700 mt-1 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Window: {item.pickupWindow}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaimMission(item)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 transition-all shadow-2xs"
                  >
                    Accept Pickup & Delivery Mission
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active & Completed Deliveries */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-teal-600" />
            Active Delivery Missions ({deliveries.length})
          </h2>

          {deliveries.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
              No delivery missions assigned yet. Accept a pickup from the left panel to begin.
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((del) => (
                <div
                  key={del.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        MISSION #{del.id}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {del.donationTitle || 'Surplus Food Cargo'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pickup: {del.pickupLocation}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        del.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : del.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {del.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Delivery Status Progression Controls */}
                  {del.status !== 'delivered' && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder="Driver note (e.g. handed to reception, gate code)..."
                        value={activeNotes[del.id] || ''}
                        onChange={(e) =>
                          setActiveNotes({ ...activeNotes, [del.id]: e.target.value })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <div className="flex gap-2">
                        {del.status === 'assigned' && (
                          <button
                            onClick={() => handleStatusUpdate(del.id, 'picked_up')}
                            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Mark Picked Up
                          </button>
                        )}
                        {del.status === 'picked_up' && (
                          <button
                            onClick={() => handleStatusUpdate(del.id, 'in_transit')}
                            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Mark In Transit
                          </button>
                        )}
                        {(del.status === 'in_transit' || del.status === 'picked_up') && (
                          <button
                            onClick={() => handleStatusUpdate(del.id, 'delivered')}
                            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                          >
                            Mark Delivered ✓
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {del.status === 'delivered' && (
                    <div className="text-xs text-emerald-700 flex items-center gap-1 font-semibold pt-1">
                      <CheckCircle2 className="w-4 h-4" /> Delivered to shelter successfully!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
