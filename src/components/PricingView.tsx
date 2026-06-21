import React, { useState } from 'react';
import { Check, HelpCircle, ShieldCheck, Sparkles, CreditCard, ExternalLink, Zap } from 'lucide-react';

interface PricingViewProps {
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  subscription: {
    status: 'free' | 'starter' | 'pro' | 'enterprise';
    billingCycle: 'monthly' | 'annual';
    simulated: boolean;
    sessionId?: string;
  };
  onNavigate: (tab: string) => void;
}

export default function PricingView({ showToast, subscription, onNavigate }: PricingViewProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (planId === 'enterprise') {
      showToast('Enterprise contact form request sent! We will email you within 2 hours.', 'info');
      return;
    }

    setLoadingTier(planId);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          origin: window.location.origin,
        }),
      });

      const data = await response.json();
      if (data.url) {
        if (data.simulated) {
          showToast('Redirecting to simulated Stripe Checkout...', 'info');
        } else {
          showToast('Redirecting to Stripe Checkout...', 'success');
        }
        
        // Brief delay for transition feel
        setTimeout(() => {
          window.location.href = data.url;
        }, 600);
      } else {
        showToast(data.error || 'Failed to create checkout session.', 'warning');
        setLoadingTier(null);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error connecting to Stripe service.', 'warning');
      setLoadingTier(null);
    }
  };

  const handlePortalRedirect = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: window.location.origin,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('Failed to open billing portal', 'warning');
      }
    } catch (err) {
      showToast('Error connecting to billing portal', 'warning');
    }
  };

  const tiers = [
    {
      id: 'starter',
      name: 'Essentials Plan',
      desc: 'Includes basic scheduling, shift swaps, and mobile access.',
      priceMonthly: 2,
      priceAnnual: 2,
      features: [
        'Billed at $2 / employee / month',
        'Basic shift scheduling',
        'Employee shift swaps',
        'Mobile access (web browser version free)',
        '30-day free trial included'
      ],
      popular: false,
      buttonText: subscription.status === 'starter' ? 'Active Plan' : 'Upgrade to Essentials',
    },
    {
      id: 'pro',
      name: 'Plus Plan',
      desc: 'Adds attendance/payroll management, break enforcement, and multi-store administration.',
      priceMonthly: 4,
      priceAnnual: 4,
      features: [
        'Billed at $4 / employee / month',
        'Everything in Essentials',
        'GPS Attendance & payroll logs',
        'Break enforcement tools',
        'Multi-store administration',
        '30-day free trial included'
      ],
      popular: true,
      buttonText: subscription.status === 'pro' ? 'Active Plan' : 'Upgrade to Plus',
    },
    {
      id: 'enterprise',
      name: 'Quote-Based Enterprise',
      desc: 'For advanced features like POS integration, labor budgeting, and 24/7 support.',
      priceMonthly: null,
      priceAnnual: null,
      features: [
        'Tailored custom subscription quote',
        'POS integration & live sales feeds',
        'Advanced labor budgeting models',
        'Dedicated 24/7 priority support',
        'Custom API & database access'
      ],
      popular: false,
      buttonText: subscription.status === 'enterprise' ? 'Current Plan' : 'Contact Sales',
    }
  ];

  return (
    <div className="flex flex-col gap-lg animate-fadeIn">
      {/* Premium Header Banner */}
      <div className="text-center py-md px-xs bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-2xl border border-primary/15 relative overflow-hidden custom-shadow">
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 text-[9px] font-bold text-primary">
          <Zap size={10} className="animate-pulse" /> SaaS billing active
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">Upgrade WorkforcePro</h2>
        <p className="text-xs text-on-surface-variant max-w-[448px] mx-auto leading-relaxed">
          Select a pricing tier to match your team size. All plans include a risk-free 30-day trial.
        </p>

        {/* Current status summary if subscribed */}
        {subscription.status !== 'free' && (
          <div className="mt-md inline-flex items-center gap-xs bg-primary text-white text-xs font-semibold px-md py-sm rounded-full shadow-md">
            <ShieldCheck size={14} />
            <span>Active Tier: {subscription.status.toUpperCase()} ({subscription.billingCycle})</span>
            {subscription.simulated && <span className="bg-amber-400 text-on-primary-container px-2 py-0.5 rounded text-[8px] font-black uppercase">Simulated</span>}
            <button 
              onClick={handlePortalRedirect}
              className="ml-2 bg-white/20 hover:bg-white/30 text-white rounded px-2 py-1 text-[9px] uppercase font-bold tracking-wider flex items-center gap-0.5"
            >
              Billing Portal <ExternalLink size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Tier Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {tiers.map((t) => {
          const isCurrentPlan = subscription.status === t.id;
          const displayPrice = t.priceMonthly;

          return (
            <div
              key={t.id}
              className={`rounded-2xl border flex flex-col p-md relative transition-all duration-200 bg-surface-container-lowest ${
                t.popular 
                  ? 'border-primary shadow-md scale-102 z-10 md:-translate-y-2' 
                  : isCurrentPlan
                    ? 'border-secondary/50 shadow-sm'
                    : 'border-outline-variant/30 opacity-95 hover:opacity-100 hover:border-outline/50'
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary-container text-white text-[9px] font-bold uppercase tracking-wider px-sm py-1 rounded-full shadow flex items-center gap-1 border border-primary-container">
                  <Sparkles size={10} /> Recommended
                </div>
              )}

              <div className="mb-sm">
                <h3 className="font-bold text-base text-on-surface">{t.name}</h3>
                <p className="text-[11px] text-on-surface-variant/80 min-h-[32px] mt-1 leading-snug">{t.desc}</p>
              </div>

              {/* Price Tag */}
              <div className="mb-md min-h-[52px] flex items-baseline gap-1">
                {displayPrice !== null ? (
                  <>
                    <span className="text-3xl font-black tracking-tight text-on-surface">${displayPrice}</span>
                    <span className="text-xs text-on-surface-variant">/ employee / month</span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-on-surface">Custom quote</span>
                )}
              </div>

              {/* Action Button */}
              <button
                disabled={isCurrentPlan || loadingTier !== null}
                onClick={() => handleCheckout(t.id)}
                className={`w-full py-2.5 px-md rounded-xl font-bold text-xs transition-all duration-150 active:scale-98 flex items-center justify-center gap-xs cursor-pointer ${
                  isCurrentPlan
                    ? 'bg-surface-container text-on-surface-variant/50 border border-outline-variant/30 cursor-default'
                    : t.popular
                      ? 'bg-primary text-white hover:bg-primary/95 shadow-sm'
                      : 'bg-surface-container text-primary border border-primary/20 hover:bg-primary/5'
                }`}
              >
                {loadingTier === t.id ? (
                  <span className="h-4 w-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={13} />
                    <span>{t.buttonText}</span>
                  </>
                )}
              </button>

              {/* Feature Bullet List */}
              <div className="mt-md border-t border-outline-variant/20 pt-md flex-1">
                <p className="text-[10px] font-bold text-on-surface-variant/90 uppercase tracking-wider mb-sm">Included features:</p>
                <ul className="flex flex-col gap-sm">
                  {t.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-xs text-[11px] text-on-surface-variant leading-tight">
                      <span className="shrink-0 text-primary mt-0.5">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Costs Section */}
      <div className="bg-surface-container-low rounded-2xl p-md border border-outline-variant/20 grid grid-cols-1 md:grid-cols-2 gap-md mt-xs">
        <div>
          <h4 className="font-bold text-xs text-[#002171] dark:text-emerald-400 uppercase tracking-wider mb-xs">App Download Fee</h4>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            Employees must pay a one-time fee of <strong className="text-on-surface font-extrabold">$2.99</strong> to download the mobile app on iOS or Android. The web browser version is completely free to use.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-xs text-[#002171] dark:text-emerald-400 uppercase tracking-wider mb-xs">Setup &amp; Onboarding</h4>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            Implementation, data migration, and training fees start from <strong className="text-on-surface font-extrabold">$99</strong> and scale based on organization size.
          </p>
        </div>
      </div>

      {/* Feature Matrix Breakdown Section */}
      <div className="bg-surface-container-low rounded-2xl p-md border border-outline-variant/20 mt-xs">
        <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider mb-md flex items-center gap-xs">
          <ShieldCheck size={14} className="text-primary" /> Feature Capability Matrix
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 pb-xs">
                <th className="font-semibold text-on-surface-variant pb-2">Capability</th>
                <th className="font-semibold text-on-surface-variant text-center pb-2">Starter</th>
                <th className="font-semibold text-on-surface pb-2 text-center">Growth &amp; AI Pro</th>
                <th className="font-semibold text-on-surface-variant text-center pb-2">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-outline-variant/10">
                <td className="py-2.5 font-medium text-on-surface">Maximum Staff Limit</td>
                <td className="text-center text-on-surface-variant">15 Employees</td>
                <td className="text-center font-bold text-primary">50 Employees</td>
                <td className="text-center text-on-surface-variant">Unlimited</td>
              </tr>
              <tr className="border-b border-outline-variant/10">
                <td className="py-2.5 font-medium text-on-surface">Direct Messaging &amp; Channels</td>
                <td className="text-center text-on-surface-variant">Yes</td>
                <td className="text-center text-on-surface">Yes</td>
                <td className="text-center text-on-surface-variant">Yes</td>
              </tr>
              <tr className="border-b border-outline-variant/10">
                <td className="py-2.5 font-medium text-on-surface">Shift swap board claims</td>
                <td className="text-center text-on-surface-variant">Basic</td>
                <td className="text-center text-on-surface">Automated Swaps</td>
                <td className="text-center text-on-surface-variant">Custom Rules Lock</td>
              </tr>
              <tr className="border-b border-outline-variant/10">
                <td className="py-2.5 font-medium text-on-surface">Gemini Shift swap guidance</td>
                <td className="text-center text-on-surface-variant/40">—</td>
                <td className="text-center font-bold text-primary flex justify-center items-center gap-0.5">
                  Yes <span className="bg-primary/10 text-primary px-1 rounded text-[8px] font-bold">AI</span>
                </td>
                <td className="text-center text-on-surface">Yes</td>
              </tr>
              <tr className="border-b border-outline-variant/10">
                <td className="py-2.5 font-medium text-on-surface">Anonymous closing surveys</td>
                <td className="text-center text-on-surface-variant/40">—</td>
                <td className="text-center text-on-surface">Yes</td>
                <td className="text-center text-on-surface-variant">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-on-surface">API &amp; Franchise Dashboards</td>
                <td className="text-center text-on-surface-variant/40">—</td>
                <td className="text-center text-on-surface-variant/40">—</td>
                <td className="text-center text-on-surface">Yes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="flex flex-col gap-sm">
        <h4 className="font-bold text-sm text-on-surface">Frequently Asked Questions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
          <div className="p-sm bg-surface-container rounded-xl border border-outline-variant/10">
            <h5 className="font-semibold text-xs text-on-surface flex items-center gap-xs mb-xs">
              <HelpCircle size={12} className="text-primary" /> Can I change plans later?
            </h5>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Yes, you can upgrade, downgrade, or cancel your subscription at any time using the Stripe Customer Portal inside your profile settings. Changes apply immediately.
            </p>
          </div>
          <div className="p-sm bg-surface-container rounded-xl border border-outline-variant/10">
            <h5 className="font-semibold text-xs text-on-surface flex items-center gap-xs mb-xs">
              <HelpCircle size={12} className="text-primary" /> How does simulated mode work?
            </h5>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Since you are running locally without Stripe credentials configured, the checkout directs you to a simulator. Once completed, your subscription status refreshes mock-active!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
