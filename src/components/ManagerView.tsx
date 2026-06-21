import React, { useState, useEffect } from 'react';
import { 
  Plus, Calendar, Clock, MapPin, Check, X, ShieldAlert, Sparkles,
  AlertCircle, Trash2, Archive, TrendingUp, Package
} from 'lucide-react';
import { Shift } from '../types';
import { db, isConfigured } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface ManagerViewProps {
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  vacations: any[];
  setVacations: React.Dispatch<React.SetStateAction<any[]>>;
  showToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
  onLogout: () => void;
  managerName: string;
}

export default function ManagerView({
  shifts,
  setShifts,
  vacations,
  setVacations,
  showToast,
  onLogout,
  managerName,
}: ManagerViewProps) {
  // Tabs: 'scheduler' (Create shift), 'approvals' (Swap / Vacation approvals), 'inventory' (Stock & Recipes)
  const [activeTab, setActiveTab] = useState<'scheduler' | 'approvals' | 'inventory'>('scheduler');

  // Form states for creating a new shift
  const [newRole, setNewRole] = useState('Server');
  const [newRate, setNewRate] = useState(22);
  const [newDate, setNewDate] = useState('May 14');
  const [newTimeRange, setNewTimeRange] = useState('4:00 PM - 10:00 PM');
  const [newLocation, setNewLocation] = useState('Wayback Bar & Grill');

  // Inventory Stock states
  const [ingredients, setIngredients] = useState([
    { id: 'i1', name: 'Hamburger Buns', quantity: 120, unit: 'pcs', costPerUnit: 0.45, minAlertThreshold: 50 },
    { id: 'i2', name: 'Beef Patties (Angus)', quantity: 95, unit: 'pcs', costPerUnit: 1.85, minAlertThreshold: 40 },
    { id: 'i3', name: 'Cheddar Cheese Slices', quantity: 240, unit: 'slices', costPerUnit: 0.15, minAlertThreshold: 60 },
    { id: 'i4', name: 'Fresh Lettuce Heads', quantity: 15, unit: 'pcs', costPerUnit: 1.20, minAlertThreshold: 8 },
    { id: 'i5', name: 'Craft IPA Kegs', quantity: 3, unit: 'kegs', costPerUnit: 110.00, minAlertThreshold: 2 },
  ]);

  // Recipe Margins optimizer states
  const [recipes, setRecipes] = useState([
    {
      id: 'r1',
      name: 'Wayback Classic Burger',
      retailPrice: 12.50,
      ingredientsList: [
        { name: 'Hamburger Buns', qtyNeeded: 1, cost: 0.45 },
        { name: 'Beef Patties (Angus)', qtyNeeded: 1, cost: 1.85 },
        { name: 'Cheddar Cheese Slices', qtyNeeded: 2, cost: 0.30 },
        { name: 'Fresh Lettuce Heads', qtyNeeded: 0.05, cost: 0.06 },
      ]
    },
    {
      id: 'r2',
      name: 'Draft IPA Pint',
      retailPrice: 7.00,
      ingredientsList: [
        { name: 'Craft IPA Kegs', qtyNeeded: 0.008, cost: 0.88 }, // ~124 pints per keg
      ]
    }
  ]);

  // Waste logs audits
  const [wasteLogs, setWasteLogs] = useState([
    { id: 'w1', name: 'Fresh Lettuce Heads', qty: 2, cost: 2.40, reason: 'Spoiled / Moldy', date: 'Yesterday' },
    { id: 'w2', name: 'Hamburger Buns', qty: 10, cost: 4.50, reason: 'Dropped / Damaged', date: '2 days ago' }
  ]);

  // Form states for logging stock delivery
  const [deliveryIngId, setDeliveryIngId] = useState('i1');
  const [deliveryQty, setDeliveryQty] = useState(50);
  const [deliveryCost, setDeliveryCost] = useState(0.45);

  // Form states for logging waste
  const [wasteIngId, setWasteIngId] = useState('i1');
  const [wasteQty, setWasteQty] = useState(5);
  const [wasteReason, setWasteReason] = useState('Spoiled / Moldy');

  // Synchronize inventory with Firestore
  useEffect(() => {
    if (!isConfigured || !db) return;
    const fetchInventory = async () => {
      try {
        const docRef = doc(db, 'inventory', 'data');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.ingredients) setIngredients(data.ingredients);
          if (data.recipes) setRecipes(data.recipes);
          if (data.wasteLogs) setWasteLogs(data.wasteLogs);
        } else {
          // Initialize in Firestore with default values
          await setDoc(docRef, {
            ingredients,
            recipes,
            wasteLogs
          });
        }
      } catch (err) {
        console.error('[Firebase] Failed to fetch inventory:', err);
      }
    };
    fetchInventory();
  }, []);

  const saveInventory = async (ings: any[], recs: any[], logs: any[]) => {
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'inventory', 'data'), {
          ingredients: ings,
          recipes: recs,
          wasteLogs: logs
        });
      } catch (err) {
        console.error('[Firebase] Failed to save inventory:', err);
      }
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const newShiftItem: Shift = {
      id: `s_mgr_${Date.now()}`,
      role: newRole,
      rate: Number(newRate),
      hours: 6,
      date: newDate,
      dateLabel: `Thursday, ${newDate}`,
      timeRange: newTimeRange,
      location: newLocation,
      status: 'Available',
      isMyShift: false,
    };

    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'shifts', newShiftItem.id), newShiftItem);
      } catch (err) {
        console.error('[Firebase] Failed to write shift:', err);
      }
    }

    setShifts((prev) => [...prev, newShiftItem]);
    showToast(`Published available shift: ${newRole} on ${newDate}!`, 'success');
  };

  const handleApproveVacation = (vacationId: string, status: 'Approved' | 'Denied') => {
    setVacations((prev) =>
      prev.map((v) => {
        if (v.id === vacationId) {
          return { ...v, status };
        }
        return v;
      })
    );
    showToast(`Vacation request marked as ${status}.`, 'info');
  };

  const handleApproveSwap = async (shiftId: string, status: 'Approved' | 'Denied') => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === shiftId) {
          const nextStatus = status === 'Approved' ? 'Available' : 'Confirmed';
          const updated = { ...s, status: nextStatus, isMyShift: false };
          if (isConfigured && db) {
            setDoc(doc(db, 'shifts', shiftId), updated).catch((e) =>
              console.error('Failed updating shift in Firestore:', e)
            );
          }
          return updated;
        }
        return s;
      })
    );
    showToast(`Swap request marked as ${status}.`, 'info');
  };

  // Record delivery update stock levels
  const handleRecordDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = ingredients.map(ing => {
      if (ing.id === deliveryIngId) {
        const nextQty = ing.quantity + Number(deliveryQty);
        return { 
          ...ing, 
          quantity: nextQty,
          costPerUnit: Number(deliveryCost) > 0 ? Number(deliveryCost) : ing.costPerUnit
        };
      }
      return ing;
    });
    setIngredients(updated);
    saveInventory(updated, recipes, wasteLogs);
    const ingName = ingredients.find(i => i.id === deliveryIngId)?.name;
    showToast(`Recorded delivery of ${deliveryQty} units of ${ingName}!`, 'success');
  };

  // Waste logging cost impact
  const handleLogWaste = (e: React.FormEvent) => {
    e.preventDefault();
    const ing = ingredients.find(i => i.id === wasteIngId);
    if (!ing) return;
    if (ing.quantity < Number(wasteQty)) {
      showToast('Cannot log waste exceeding current stock count!', 'warning');
      return;
    }

    const updatedIngredients = ingredients.map(i => {
      if (i.id === wasteIngId) {
        return { ...i, quantity: Math.max(0, i.quantity - Number(wasteQty)) };
      }
      return i;
    });

    const costImpact = Number(wasteQty) * ing.costPerUnit;
    const updatedLogs = [
      {
        id: Math.random().toString(),
        name: ing.name,
        qty: Number(wasteQty),
        cost: Number(costImpact.toFixed(2)),
        reason: wasteReason,
        date: 'Just now'
      },
      ...wasteLogs
    ];

    setIngredients(updatedIngredients);
    setWasteLogs(updatedLogs);
    saveInventory(updatedIngredients, recipes, updatedLogs);

    showToast(`Logged waste of ${wasteQty} units of ${ing.name} (Loss: -$${costImpact.toFixed(2)})`, 'warning');
  };

  const handleUpdateRecipePrice = (recipeId: string, price: number) => {
    const updatedRecipes = recipes.map(rec => {
      if (rec.id === recipeId) {
        return { ...rec, retailPrice: Number(price) };
      }
      return rec;
    });
    setRecipes(updatedRecipes);
    saveInventory(ingredients, updatedRecipes, wasteLogs);
    showToast('Recipe retail price updated!', 'success');
  };

  const pendingSwaps = shifts.filter((s) => s.status === 'Swap Requested');
  const pendingVacations = vacations.filter((v) => v.status === 'Pending');

  return (
    <div className="pb-16 max-w-[512px] mx-auto scroll-smooth animate-[slideUp_0.3s_ease]">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-lg">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Manager Portal</span>
          <h2 className="text-xl font-bold text-secondary">Hello, {managerName}</h2>
        </div>
        <button 
          onClick={onLogout}
          className="text-xs text-error border border-error/25 hover:bg-error/5 px-3 py-1.5 rounded-xl font-bold transition-all"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs toggle */}
      <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 mb-lg">
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'scheduler'
              ? 'bg-white text-secondary shadow-sm'
              : 'text-on-surface-variant hover:text-secondary'
          }`}
        >
          Shift Creator
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'bg-white text-secondary shadow-sm'
              : 'text-on-surface-variant hover:text-secondary'
          }`}
        >
          Approvals
          {(pendingSwaps.length + pendingVacations.length) > 0 && (
            <span className="w-5 h-5 rounded-full bg-error text-white text-[10px] flex items-center justify-center font-bold">
              {pendingSwaps.length + pendingVacations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'inventory'
              ? 'bg-white text-secondary shadow-sm'
              : 'text-on-surface-variant hover:text-secondary'
          }`}
        >
          Inventory
        </button>
      </div>

      {/* Scheduler Tab */}
      {activeTab === 'scheduler' && (
        <div className="space-y-md">
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/10 shadow-sm">
            <h3 className="font-bold text-sm text-secondary mb-sm flex items-center gap-2">
              <Plus size={16} className="text-primary" /> Publish Available Shift
            </h3>
            
            <form onSubmit={handleCreateShift} className="space-y-md text-left">
              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Role / Position</label>
                <select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-xs bg-white focus:outline-primary"
                >
                  <option value="Server">Server</option>
                  <option value="Host">Host</option>
                  <option value="Bartender">Bartender</option>
                  <option value="Kitchen Staff">Kitchen Staff</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">Hourly Rate ($)</label>
                  <input 
                    type="number" 
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full border border-outline-variant rounded-lg p-2.5 text-xs focus:outline-primary" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-secondary mb-1">Date</label>
                  <input 
                    type="text" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    placeholder="e.g. May 14"
                    className="w-full border border-outline-variant rounded-lg p-2.5 text-xs focus:outline-primary" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Time Frame</label>
                <input 
                  type="text" 
                  value={newTimeRange}
                  onChange={(e) => setNewTimeRange(e.target.value)}
                  placeholder="e.g. 11:00 AM - 5:00 PM"
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-xs focus:outline-primary" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-secondary mb-1">Location</label>
                <input 
                  type="text" 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg p-2.5 text-xs focus:outline-primary" 
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-primary hover:brightness-[1.03] text-white font-semibold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles size={14} />
                Publish Shift
              </button>
            </form>
          </div>

          {/* List of current available shifts */}
          <div className="space-y-sm">
            <h3 className="font-bold text-sm text-secondary">Active Published Shifts</h3>
            <div className="space-y-sm">
              {shifts.filter(s => s.status === 'Available').map(shift => (
                <div key={shift.id} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/10 shadow-xs flex justify-between items-center text-left">
                  <div>
                    <h4 className="text-xs font-bold text-secondary">{shift.role}</h4>
                    <p className="text-[10px] text-on-surface-variant flex items-center gap-1 mt-1">
                      <Clock size={11} /> {shift.dateLabel} • {shift.timeRange}
                    </p>
                    <p className="text-[10px] text-on-surface-variant flex items-center gap-1">
                      <MapPin size={11} /> {shift.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-primary">${shift.rate}/hr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="space-y-md">
          {/* Shift Swaps Approval Board */}
          <div className="space-y-sm">
            <h3 className="font-bold text-sm text-secondary">Pending Shift Swap Offers</h3>
            {pendingSwaps.length > 0 ? (
              pendingSwaps.map((swap) => (
                <div key={swap.id} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/10 shadow-sm space-y-md text-left">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">SWAP OFFER APPROVAL</p>
                    <h4 className="text-xs font-bold text-secondary mt-1">{swap.role} • {swap.location}</h4>
                    <p className="text-[10px] text-on-surface-variant mt-1">{swap.dateLabel} • {swap.timeRange}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <button
                      onClick={() => handleApproveSwap(swap.id, 'Denied')}
                      className="py-1.5 rounded-lg border border-outline-variant text-xs text-secondary hover:bg-slate-50 flex items-center justify-center gap-1"
                    >
                      <X size={13} /> Reject
                    </button>
                    <button
                      onClick={() => handleApproveSwap(swap.id, 'Approved')}
                      className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Check size={13} /> Approve Swap
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-surface-container-low p-md rounded-xl text-center text-xs text-on-surface-variant">
                No shift trade requests pending approval.
              </div>
            )}
          </div>

          {/* Leave / Vacation requests approvals */}
          <div className="space-y-sm">
            <h3 className="font-bold text-sm text-secondary">Leave &amp; Vacation Requests</h3>
            {pendingVacations.length > 0 ? (
              pendingVacations.map((v) => (
                <div key={v.id} className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/10 shadow-sm space-y-md text-left">
                  <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{v.type} REQUEST</p>
                    <h4 className="text-xs font-bold text-secondary mt-1">{v.reason}</h4>
                    <p className="text-[10px] text-on-surface-variant mt-1">Duration: {v.start} to {v.end}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-sm">
                    <button
                      onClick={() => handleApproveVacation(v.id, 'Denied')}
                      className="py-1.5 rounded-lg border border-outline-variant text-xs text-secondary hover:bg-slate-50 flex items-center justify-center gap-1"
                    >
                      <X size={13} /> Deny
                    </button>
                    <button
                      onClick={() => handleApproveVacation(v.id, 'Approved')}
                      className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Check size={13} /> Approve Leave
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-surface-container-low p-md rounded-xl text-center text-xs text-on-surface-variant">
                No vacation or time off requests pending approval.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-lg text-left">
          {/* Section: Stock Levels */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/10 shadow-sm space-y-md">
            <h3 className="font-bold text-sm text-secondary flex items-center gap-2">
              <Archive size={16} className="text-primary" /> Ingredient Stock Levels
            </h3>

            <div className="divide-y divide-outline-variant/30">
              {ingredients.map(ing => {
                const isLow = ing.quantity <= ing.minAlertThreshold;
                return (
                  <div key={ing.id} className="py-md first:pt-0 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-secondary">{ing.name}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        Stock Alert Level: &lt;{ing.minAlertThreshold} {ing.unit} • Cost per unit: ${ing.costPerUnit.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-sm">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isLow ? 'text-amber-600' : 'text-primary'}`}>
                          {ing.quantity} {ing.unit}
                        </p>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold inline-block ${
                          isLow ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Recipe margin optimizer */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/10 shadow-sm space-y-md">
            <h3 className="font-bold text-sm text-secondary flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" /> Recipe Margin Optimizer
            </h3>

            <div className="space-y-md">
              {recipes.map(rec => {
                // Sum ingredient costs
                const foodCost = rec.ingredientsList.reduce((acc, item) => acc + (item.cost * item.qtyNeeded), 0);
                const foodCostPct = (foodCost / rec.retailPrice) * 100;
                const margin = ((rec.retailPrice - foodCost) / rec.retailPrice) * 100;

                return (
                  <div key={rec.id} className="p-md rounded-xl bg-slate-50 dark:bg-slate-800 border border-outline-variant/10 space-y-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-secondary">{rec.name}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium">
                          Total Food Cost: ${foodCost.toFixed(2)} ({foodCostPct.toFixed(1)}% Cost of Goods)
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {margin.toFixed(1)}% Margin
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-sm items-center">
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant mb-1">Selling Price ($)</label>
                        <input 
                          type="number"
                          step="0.1"
                          value={rec.retailPrice}
                          onChange={(e) => handleUpdateRecipePrice(rec.id, Number(e.target.value))}
                          className="w-full border border-outline-variant rounded p-1.5 text-xs bg-white dark:bg-slate-700 dark:text-white focus:outline-primary font-bold text-secondary"
                        />
                      </div>
                      <div className="text-right pr-2">
                        <p className="text-[10px] font-bold text-on-surface-variant leading-none">EST. PROFIT PER ITEM</p>
                        <p className="text-md font-bold text-primary mt-1">${(rec.retailPrice - foodCost).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Forms: Delivery & Waste Logger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            
            {/* Delivery Form */}
            <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/10 shadow-sm space-y-sm">
              <h4 className="font-bold text-xs text-secondary flex items-center gap-1.5">
                <Package size={14} className="text-primary" /> Log Supplier Delivery
              </h4>

              <form onSubmit={handleRecordDelivery} className="space-y-sm text-[11px]">
                <div>
                  <label className="block text-[10px] font-bold text-secondary mb-1">Select Ingredient</label>
                  <select
                    value={deliveryIngId}
                    onChange={(e) => setDeliveryIngId(e.target.value)}
                    className="w-full border border-outline-variant rounded p-2 text-xs bg-white dark:bg-slate-750"
                  >
                    {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-secondary mb-1">Quantity</label>
                    <input 
                      type="number"
                      value={deliveryQty}
                      onChange={(e) => setDeliveryQty(Number(e.target.value))}
                      className="w-full border border-outline-variant rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-secondary mb-1">Unit Cost ($)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={deliveryCost}
                      onChange={(e) => setDeliveryCost(Number(e.target.value))}
                      className="w-full border border-outline-variant rounded p-1.5 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:brightness-[1.03] text-white font-semibold py-1.5 rounded text-[11px] transition-all"
                >
                  Record Delivery
                </button>
              </form>
            </div>

            {/* Waste Logger */}
            <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/10 shadow-sm space-y-sm">
              <h4 className="font-bold text-xs text-secondary flex items-center gap-1.5">
                <Trash2 size={14} className="text-error" /> Log Spoilage / Waste
              </h4>

              <form onSubmit={handleLogWaste} className="space-y-sm text-[11px]">
                <div>
                  <label className="block text-[10px] font-bold text-secondary mb-1">Select Ingredient</label>
                  <select
                    value={wasteIngId}
                    onChange={(e) => setWasteIngId(e.target.value)}
                    className="w-full border border-outline-variant rounded p-2 text-xs bg-white dark:bg-slate-750"
                  >
                    {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-secondary mb-1">Quantity</label>
                    <input 
                      type="number"
                      value={wasteQty}
                      onChange={(e) => setWasteQty(Number(e.target.value))}
                      className="w-full border border-outline-variant rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-secondary mb-1">Reason</label>
                    <select
                      value={wasteReason}
                      onChange={(e) => setWasteReason(e.target.value)}
                      className="w-full border border-outline-variant rounded p-1.5 text-xs bg-white dark:bg-slate-750"
                    >
                      <option value="Spoiled / Moldy">Spoiled / Moldy</option>
                      <option value="Dropped / Damaged">Dropped / Damaged</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-error/90 hover:bg-error text-white font-semibold py-1.5 rounded text-[11px] transition-all"
                >
                  Log Waste Count
                </button>
              </form>
            </div>
          </div>

          {/* Waste History Log Table */}
          <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/10 shadow-sm space-y-sm">
            <h4 className="font-bold text-xs text-secondary flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" /> Recent Waste &amp; Loss Logs
            </h4>

            <div className="divide-y divide-outline-variant/30">
              {wasteLogs.map(log => (
                <div key={log.id} className="py-sm first:pt-0 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-secondary">{log.name}</p>
                    <p className="text-[10px] text-on-surface-variant">Reason: {log.reason} • {log.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-error">-${log.cost.toFixed(2)}</p>
                    <p className="text-[9px] text-on-surface-variant font-medium">{log.qty} wasted</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
