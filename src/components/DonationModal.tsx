import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Donation, FoodCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Donation>) => Promise<void>;
  initialData?: Donation | null;
}

const CATEGORIES: FoodCategory[] = [
  'Prepared Meals',
  'Produce',
  'Bakery',
  'Dairy',
  'Pantry',
  'Other',
];

const PRESET_IMAGES = [
  { label: 'Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80' },
  { label: 'Produce', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80' },
  { label: 'Meals', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Dairy', url: 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80' },
  { label: 'Pantry', url: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80' },
];

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Prepared Meals');
  const [quantity, setQuantity] = useState('');
  const [servings, setServings] = useState(20);
  const [expiryDate, setExpiryDate] = useState('Tomorrow 20:00');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupWindow, setPickupWindow] = useState('Today 5:00 PM - 8:00 PM');
  const [dietaryInfo, setDietaryInfo] = useState('Vegetarian, Halal');
  const [storageCondition, setStorageCondition] = useState('Refrigerated');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[2].url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory((initialData.category as FoodCategory) || 'Prepared Meals');
      setQuantity(initialData.quantity || '');
      setServings(initialData.servings || 10);
      setExpiryDate(initialData.expiryDate || '');
      setPickupLocation(initialData.pickupLocation || '');
      setPickupWindow(initialData.pickupWindow || '');
      setDietaryInfo(initialData.dietaryInfo || '');
      setStorageCondition(initialData.storageCondition || 'Refrigerated');
      setImageUrl(initialData.imageUrl || PRESET_IMAGES[0].url);
    } else {
      // Default clean values for new listing
      setTitle('');
      setDescription('');
      setCategory('Prepared Meals');
      setQuantity('15 portions');
      setServings(25);
      setExpiryDate('Tomorrow 19:00');
      setPickupLocation(currentUser?.address || '424 S Market St, Loading Bay');
      setPickupWindow('Today 6:00 PM - 8:30 PM');
      setDietaryInfo('Vegetarian');
      setStorageCondition('Refrigerated');
      setImageUrl(PRESET_IMAGES[2].url);
    }
    setError(null);
  }, [initialData, isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !quantity.trim() || !pickupLocation.trim()) {
      setError('Please fill out all required fields marked with *');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title,
        description,
        category,
        quantity,
        servings: Number(servings),
        expiryDate,
        pickupLocation,
        pickupWindow,
        dietaryInfo,
        storageCondition,
        imageUrl,
        donorId: currentUser?.id,
        donorUid: currentUser?.uid,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save donation listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-900 text-white">
          <div>
            <h2 className="text-lg font-bold">
              {initialData ? 'Edit Surplus Food Listing' : 'Post Surplus Food for Rescue'}
            </h2>
            <p className="text-xs text-emerald-200">
              Listing goes live to verified community shelters and food pantries.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Food Item Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fresh Artisan Sourdough Breads & Pastries"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Packaging Details *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the condition, packaging, allergens, and preparation time..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Storage Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Storage Condition
              </label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Ambient">Ambient / Room Temperature</option>
                <option value="Refrigerated">Refrigerated (35°F - 40°F)</option>
                <option value="Frozen">Frozen (&lt; 0°F)</option>
              </select>
            </div>
          </div>

          {/* Quantity & Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity & Packaging *
              </label>
              <input
                type="text"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 8 catering trays, 40 lbs"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated People Fed (Servings) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Expiry & Pickup Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Best Before / Expiry Time *
              </label>
              <input
                type="text"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="e.g. Tomorrow 8:00 PM"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pickup Window *
              </label>
              <input
                type="text"
                required
                value={pickupWindow}
                onChange={(e) => setPickupWindow(e.target.value)}
                placeholder="e.g. Today 6:00 PM - 9:00 PM"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Pickup Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pickup Address & Access Note *
            </label>
            <input
              type="text"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g. 424 S Market St, Back Delivery Bay door #3"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dietary Info */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dietary & Allergen Notes
            </label>
            <input
              type="text"
              value={dietaryInfo}
              onChange={(e) => setDietaryInfo(e.target.value)}
              placeholder="e.g. Vegan, Gluten-Free, Halal, Nut-Free"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Image Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              Listing Photo Preset
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {PRESET_IMAGES.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setImageUrl(img.url)}
                  className={`flex-shrink-0 relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    imageUrl === img.url ? 'border-emerald-600 scale-105 shadow-xs' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.5">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isSubmitting ? 'Saving to Database...' : initialData ? 'Update Listing' : 'Publish Donation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
