import React, { useState } from 'react';
  import {
  Recycle,
  PlusCircle,
  ShieldCheck,
  Truck,
  HeartHandshake,
  BarChart3,
  User as UserIcon,
  LogIn,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building,
  Sparkles,
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';
import { DatabaseHealthBadge } from './DatabaseHealthBadge.tsx';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateDonation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateDonation,
}) => {
  const { currentUser, firebaseUser, signInWithGoogle, switchDemoRole, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'browse', label: 'Browse Food', icon: Recycle },
    { id: 'impact', label: 'Impact Hub', icon: BarChart3 },
    { id: 'claims', label: 'My Claims', icon: HeartHandshake },
    { id: 'volunteer', label: 'Rescue Logistics', icon: Truck },
    { id: 'admin', label: 'Admin Portal', icon: ShieldCheck, adminOnly: true },
  ];

  const handleRoleSelect = (role: UserRole) => {
    switchDemoRole(role);
    setRoleDropdownOpen(false);
    if (role === 'admin') setActiveTab('admin');
    else if (role === 'volunteer') setActiveTab('volunteer');
    else if (role === 'recipient') setActiveTab('claims');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('browse')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                <Recycle className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-700 bg-clip-text text-transparent font-['Outfit']">
                  Food<span className="text-emerald-600">Cycle</span>
                </span>
                <span className="hidden sm:block text-[11px] font-semibold text-emerald-800 tracking-wider uppercase">
                  Surplus Food Rescue & Redistribution
                </span>
              </div>
            </button>
            <DatabaseHealthBadge />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  {link.label}
                  {link.adminOnly && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                      Admin
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* New Donation CTA */}
            <button
              onClick={onOpenCreateDonation}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Donate Food</span>
            </button>

            {/* Persona Switcher / User Profile */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase overflow-hidden border border-emerald-300">
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.fullName?.charAt(0) || 'U'
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                    {currentUser?.fullName}
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-700 capitalize flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    {currentUser?.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role & Persona Menu Dropdown */}
              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Active User Profile
                    </p>
                    <p className="text-sm font-bold text-slate-900">{currentUser?.fullName}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                    {currentUser?.organization && (
                      <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3" /> {currentUser.organization}
                      </p>
                    )}
                  </div>

                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> Switch Test Persona
                    </p>
                    <div className="space-y-1">
                      {(Object.keys(DEMO_USERS) as UserRole[]).map((r) => {
                        const persona = DEMO_USERS[r];
                        const isSelected = currentUser?.role === r;
                        return (
                          <button
                            key={r}
                            onClick={() => handleRoleSelect(r)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">{persona.fullName}</div>
                              <div className="text-[10px] text-slate-500 capitalize">{r} · {persona.organization}</div>
                            </div>
                            {isSelected && <span className="text-emerald-700 font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Google OAuth Login option */}
                  <div className="p-2 space-y-1">
                    {!firebaseUser ? (
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          signInWithGoogle();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Sign in with Google
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => {
              onOpenCreateDonation();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs mb-3"
          >
            <PlusCircle className="w-4 h-4" />
            Donate Surplus Food
          </button>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
