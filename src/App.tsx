import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
  Utensils,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DonationCard } from './components/DonationCard.tsx';
import { DonationModal } from './components/DonationModal.tsx';
import { ClaimModal } from './components/ClaimModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { VolunteerMissions } from './components/VolunteerMissions.tsx';
import { RecipientClaims } from './components/RecipientClaims.tsx';
import { ImpactStats } from './components/ImpactStats.tsx';
import { Donation, FoodCategory } from './types.ts';
import { api } from './api.ts';

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Items', value: 'all' },
  { label: 'Prepared Meals', value: 'Prepared Meals' },
  { label: 'Fresh Produce', value: 'Produce' },
  { label: 'Bakery & Bread', value: 'Bakery' },
  { label: 'Dairy & Eggs', value: 'Dairy' },
  { label: 'Pantry Goods', value: 'Pantry' },
];

function MainContent() {
  const { currentUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [claimingDonation, setClaimingDonation] = useState<Donation | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDonations = async () => {
    setLoading(true);
    try {
      const data = await api.getDonations({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });
      setDonations(data);
    } catch (err: any) {
      console.error('Error fetching donations:', err);
      showToast(err.message || 'Error loading food donations from PostgreSQL.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [selectedCategory, selectedStatus]);

  // CRUD Operations
  const handleSaveDonation = async (data: Partial<Donation>) => {
    try {
      if (editingDonation) {
        await api.updateDonation(editingDonation.id, data, token || undefined);
        showToast('Food listing updated successfully in PostgreSQL!', 'success');
      } else {
        await api.createDonation(data, token || undefined);
        showToast('Surplus food published for rescue in PostgreSQL!', 'success');
      }
      setIsDonationModalOpen(false);
      setEditingDonation(null);
      loadDonations();
    } catch (err: any) {
      showToast(err.message || 'Failed to save donation listing.', 'error');
      throw err;
    }
  };

  const handleDeleteDonation = async (donation: Donation) => {
    if (!confirm(`Delete listing "${donation.title}"?`)) return;
    try {
      await api.deleteDonation(donation.id, token || undefined);
      showToast(`Listing #${donation.id} removed from PostgreSQL`, 'info');
      loadDonations();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  const handleClaimSubmit = async (data: {
    donationId: number;
    requestedServings: number;
    urgency: string;
    notes: string;
  }) => {
    try {
      await api.createClaim(
        {
          donationId: data.donationId,
          recipientId: currentUser?.id,
          recipientUid: currentUser?.uid,
          requestedServings: data.requestedServings,
          urgency: data.urgency,
          notes: data.notes,
        },
        token || undefined
      );
      showToast('Food claim reserved! Driver will be notified for pickup.', 'success');
      setClaimingDonation(null);
      loadDonations();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit food claim.', 'error');
      throw err;
    }
  };

  // Client search filtering
  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.dietaryInfo && d.dietaryInfo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : toast.type === 'error'
              ? 'bg-red-900 text-white border-red-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateDonation={() => {
          setEditingDonation(null);
          setIsDonationModalOpen(true);
        }}
      />

      {/* Main Container View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Hero Ticker Section */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950 mb-3 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" /> Live Surplus Food Network
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-['Outfit']">
                    Fresh Surplus Food Rescued Daily
                  </h1>
                  <p className="text-emerald-100 text-xs sm:text-sm mt-2 leading-relaxed">
                    Connecting local restaurants, commercial kitchens, and grocery grocers with emergency shelters and volunteers in real-time.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingDonation(null);
                      setIsDonationModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Donate Surplus Food
                  </button>
                  <button
                    onClick={() => setActiveTab('volunteer')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                  >
                    Volunteer to Drive
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by food name, bakery, diet (e.g., sourdough, vegan, halal)..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Status & Refresh Controls */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="available">Available Now</option>
                    <option value="claimed">Claimed</option>
                    <option value="in_transit">In Transit</option>
                    <option value="completed">Completed</option>
                  </select>

                  <button
                    onClick={loadDonations}
                    disabled={loading}
                    title="Refresh from PostgreSQL"
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Food Donations Grid */}
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
                <p className="text-sm font-semibold text-slate-600">
                  Querying PostgreSQL Cloud SQL Database...
                </p>
              </div>
            ) : filteredDonations.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto">
                <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No surplus food listings found</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Try adjusting your search filters or be the first to post surplus meals!
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDonations.map((item) => (
                  <DonationCard
                    key={item.id}
                    donation={item}
                    onClaim={(d) => setClaimingDonation(d)}
                    onEdit={(d) => {
                      setEditingDonation(d);
                      setIsDonationModalOpen(true);
                    }}
                    onDelete={handleDeleteDonation}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* View: Recipient Claims */}
        {activeTab === 'claims' && (
          <RecipientClaims onBrowseMore={() => setActiveTab('browse')} />
        )}

        {/* View: Volunteer Missions */}
        {activeTab === 'volunteer' && <VolunteerMissions />}

        {/* View: Impact Analytics */}
        {activeTab === 'impact' && <ImpactStats />}

        {/* View: Admin Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onEditDonation={(d) => {
              setEditingDonation(d);
              setIsDonationModalOpen(true);
            }}
            onRefreshData={loadDonations}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 font-['Outfit']">
              Food<span className="text-emerald-600">Cycle</span>
            </span>
            <span>· Full-Stack PostgreSQL Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Render Deploy Ready</span>
            <span>·</span>
            <span>Python Flask & Node.js Express</span>
            <span>·</span>
            <span>Google Cloud SQL</span>
          </div>
        </div>
      </footer>

      {/* Donation Create/Edit Modal */}
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => {
          setIsDonationModalOpen(false);
          setEditingDonation(null);
        }}
        onSubmit={handleSaveDonation}
        initialData={editingDonation}
      />

      {/* Claim Modal */}
      <ClaimModal
        isOpen={!!claimingDonation}
        donation={claimingDonation}
        onClose={() => setClaimingDonation(null)}
        onSubmit={handleClaimSubmit}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
