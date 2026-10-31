import React, { useState, useEffect } from 'react';
import { Leaf, Award, TrendingUp, Users, Heart, ShieldCheck, TreePine, Droplets, Car } from 'lucide-react';
import { ImpactMetrics } from '../types.ts';
import { api } from '../api.ts';

export const ImpactStats: React.FC = () => {
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMetrics()
      .then(setMetrics)
      .catch((err) => console.error('Failed to load metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalMeals = metrics?.totalMealsRescued || 14280;
  const co2Kg = metrics?.co2DivertedKg || 35700;
  const carMilesEquivalent = Math.round(co2Kg * 2.48);
  const waterGallonsSaved = Math.round(totalMeals * 140);
  const treesEquivalent = Math.round(co2Kg / 22);

  return (
    <div className="space-y-8">
      {/* Hero Impact Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950 mb-3 shadow-xs">
            <Leaf className="w-3.5 h-3.5" /> Environmental & Food Security Impact
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-['Outfit']">
            Rescuing Good Food, Nourishing Communities
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mt-2 leading-relaxed">
            Every tray of surplus food rescued from landfills prevents methane emissions, conserves fresh water, and ensures wholesome meals reach vulnerable families.
          </p>
        </div>

        {/* Primary Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="p-4 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10">
            <span className="text-xs text-emerald-300 font-medium">Meals Rescued</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {totalMeals.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">
              +12% this month
            </span>
          </div>

          <div className="p-4 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10">
            <span className="text-xs text-emerald-300 font-medium">CO₂e Diverted</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {co2Kg.toLocaleString()} <span className="text-sm font-bold text-white">kg</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-0.5 block">
              From landfill methane
            </span>
          </div>

          <div className="p-4 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10">
            <span className="text-xs text-emerald-300 font-medium">Active Food Donors</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {metrics?.activeDonors || 48}
            </div>
            <span className="text-[11px] text-slate-300 font-medium mt-0.5 block">
              Bakeries, farms, bistros
            </span>
          </div>

          <div className="p-4 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10">
            <span className="text-xs text-emerald-300 font-medium">Shelters & Pantries</span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {metrics?.activeRecipients || 62}
            </div>
            <span className="text-[11px] text-slate-300 font-medium mt-0.5 block">
              Community partners
            </span>
          </div>
        </div>
      </div>

      {/* Environmental Equivalency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Carbon Offset Equivalent
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {carMilesEquivalent.toLocaleString()} miles
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Driven by an average passenger car</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Water Conserved
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {waterGallonsSaved.toLocaleString()} gal
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Agricultural embedded water saved</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TreePine className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Urban Trees Absorbing CO₂
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              ~{treesEquivalent.toLocaleString()} trees
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Equivalent yearly carbon absorption</p>
          </div>
        </div>
      </div>

      {/* Sustainable Development Goals Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          United Nations Sustainable Development Goals Alignment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
            <div className="text-xs font-bold text-amber-800 uppercase">SDG 2: Zero Hunger</div>
            <p className="text-xs text-slate-600 mt-1">
              Providing nutritious surplus meals to emergency shelters and food banks in under-resourced areas.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="text-xs font-bold text-emerald-800 uppercase">SDG 12: Responsible Consumption</div>
            <p className="text-xs text-slate-600 mt-1">
              Halving food waste at retail and consumer levels through automated supply matching and volunteer logistics.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50">
            <div className="text-xs font-bold text-teal-800 uppercase">SDG 13: Climate Action</div>
            <p className="text-xs text-slate-600 mt-1">
              Directly averting potent methane gas emissions from landfills by diverting perishable organic surplus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
