import { useMemo, useState } from 'react';

type RiskProfile = 'conservative' | 'balanced' | 'growth';

interface YearlyRow {
  year: number;
  principal: number;
  interest: number;
  totalBalance: number;
}

const RISK_PRESETS: Record<
  RiskProfile,
  { label: string; rate: number; badge: string; description: string }
> = {
  conservative: {
    label: 'Conservative (Treasury & Bonds)',
    rate: 5.2,
    badge: 'Low Volatility',
    description: 'Capital preservation with steady fixed-income yield.',
  },
  balanced: {
    label: 'Balanced (60/40 Index Portfolio)',
    rate: 8.4,
    badge: 'Recommended',
    description: 'Diversified equity and bond allocation for long-term wealth.',
  },
  growth: {
    label: 'Aggressive Growth (Tech & S&P 500)',
    rate: 11.5,
    badge: 'High Yield',
    description: 'Maximum compounding potential over multi-year horizons.',
  },
};

export function App() {
  const [initialDeposit, setInitialDeposit] = useState<number>(15000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(850);
  const [years, setYears] = useState<number>(10);
  const [annualRate, setAnnualRate] = useState<number>(8.4);
  const [activeProfile, setActiveProfile] = useState<RiskProfile>('balanced');
  const [inflationAdjusted, setInflationAdjusted] = useState<boolean>(false);

  const handleSelectProfile = (profile: RiskProfile) => {
    setActiveProfile(profile);
    setAnnualRate(RISK_PRESETS[profile].rate);
  };

  const projection = useMemo(() => {
    const effectiveAnnualRate = inflationAdjusted
      ? Math.max(0.5, annualRate - 2.5)
      : annualRate;
    const monthlyRate = effectiveAnnualRate / 100 / 12;

    const rows: YearlyRow[] = [];
    let currentBalance = initialDeposit;
    let totalPrincipal = initialDeposit;

    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        currentBalance =
          currentBalance * (1 + monthlyRate) + monthlyContribution;
        totalPrincipal += monthlyContribution;
      }

      rows.push({
        year,
        principal: Math.round(totalPrincipal),
        interest: Math.round(currentBalance - totalPrincipal),
        totalBalance: Math.round(currentBalance),
      });
    }

    const finalRow = rows[rows.length - 1] || {
      principal: initialDeposit,
      interest: 0,
      totalBalance: initialDeposit,
    };

    const totalGainPercent =
      finalRow.principal > 0
        ? ((finalRow.interest / finalRow.principal) * 100).toFixed(1)
        : '0.0';

    return {
      rows,
      finalBalance: finalRow.totalBalance,
      totalPrincipal: finalRow.principal,
      totalInterest: finalRow.interest,
      totalGainPercent,
      maxBalance: finalRow.totalBalance || 1,
    };
  }, [initialDeposit, monthlyContribution, years, annualRate, inflationAdjusted]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  const handleExportCSV = () => {
    const headers = ['Year,Total Contributions ($),Compound Gains ($),Ending Balance ($)'];
    const csvRows = projection.rows.map(
      (r) => `${r.year},${r.principal},${r.interest},${r.totalBalance}`
    );
    const blob = new Blob([headers.concat(csvRows).join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `finpulse-projection-${years}yr.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 font-bold text-slate-950 shadow-lg shadow-emerald-500/20">
              FP
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                FinPulse
              </span>
              <span className="ml-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Wealth & ROI Simulator
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInflationAdjusted((prev) => !prev)}
              className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                inflationAdjusted
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
              }`}
            >
              {inflationAdjusted
                ? 'Inflation Adjusted (-2.5% CPI)'
                : 'Nominal Return (No CPI)'}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Export CSV Report
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Strategy Presets */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {(Object.keys(RISK_PRESETS) as RiskProfile[]).map((key) => {
            const preset = RISK_PRESETS[key];
            const isSelected = activeProfile === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectProfile(key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {preset.rate}% APY
                  </span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                    {preset.badge}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">
                  {preset.label}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Calculator + Dashboard Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Panel: Interactive Controls */}
          <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                Portfolio Parameters
              </h2>
              <p className="text-xs text-slate-400">
                Adjust sliders to model compounding growth in real time.
              </p>
            </div>

            {/* Initial Deposit */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <label className="text-slate-300">Initial Investment</label>
                <span className="font-semibold text-emerald-400">
                  {formatCurrency(initialDeposit)}
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={200000}
                step={1000}
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>$1,000</span>
                <span>$200,000</span>
              </div>
            </div>

            {/* Monthly Contribution */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <label className="text-slate-300">Monthly Contribution</label>
                <span className="font-semibold text-emerald-400">
                  {formatCurrency(monthlyContribution)}/mo
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={5000}
                step={50}
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>$0</span>
                <span>$5,000/mo</span>
              </div>
            </div>

            {/* Time Horizon */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <label className="text-slate-300">Investment Horizon</label>
                <span className="font-semibold text-emerald-400">
                  {years} {years === 1 ? 'Year' : 'Years'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>1 Yr</span>
                <span>30 Yrs</span>
              </div>
            </div>

            {/* Expected Annual Return */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <label className="text-slate-300">Expected Annual Return</label>
                <span className="font-semibold text-emerald-400">
                  {annualRate.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={18}
                step={0.2}
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>1.0%</span>
                <span>18.0%</span>
              </div>
            </div>

            {/* Allocation Breakdown Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs font-medium text-slate-400">
                Final Value Composition
              </p>
              <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  style={{
                    width: `${
                      (projection.totalPrincipal / projection.finalBalance) * 100
                    }%`,
                  }}
                  className="bg-sky-500 transition-all duration-300"
                />
                <div
                  style={{
                    width: `${
                      (projection.totalInterest / projection.finalBalance) * 100
                    }%`,
                  }}
                  className="bg-emerald-500 transition-all duration-300"
                />
              </div>
              <div className="mt-3 flex justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                  Principal (
                  {Math.round(
                    (projection.totalPrincipal / projection.finalBalance) * 100
                  )}
                  %)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Compound Gains (
                  {Math.round(
                    (projection.totalInterest / projection.finalBalance) * 100
                  )}
                  %)
                </span>
              </div>
            </div>
          </section>

          {/* Right Panel: KPIs + Visual Chart + Schedule */}
          <section className="space-y-6 lg:col-span-8">
            {/* Top KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-xs font-medium text-slate-400">
                  Projected Portfolio Value
                </p>
                <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {formatCurrency(projection.finalBalance)}
                </p>
                <p className="mt-1 text-xs text-emerald-400">
                  After {years} {years === 1 ? 'year' : 'years'} of compounding
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-xs font-medium text-slate-400">
                  Total Capital Invested
                </p>
                <p className="mt-2 text-2xl font-bold text-sky-400 sm:text-3xl">
                  {formatCurrency(projection.totalPrincipal)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Initial + {years * 12} monthly deposits
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="text-xs font-medium text-slate-400">
                  Net Compound Earnings
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-400 sm:text-3xl">
                  +{formatCurrency(projection.totalInterest)}
                </p>
                <p className="mt-1 text-xs text-emerald-400">
                  +{projection.totalGainPercent}% total return on capital
                </p>
              </div>
            </div>

            {/* Interactive Stacked Bar Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Year-over-Year Growth Trajectory
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hover any bar to inspect annual principal vs. compound interest
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" />
                    Contributions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    Compound Interest
                  </span>
                </div>
              </div>

              <div className="flex h-56 items-end gap-1.5 border-b border-slate-800 pb-2 pt-6 sm:gap-2">
                {projection.rows.map((row) => {
                  const totalHeightPct = Math.max(
                    6,
                    (row.totalBalance / projection.maxBalance) * 100
                  );
                  const principalRatio =
                    row.totalBalance > 0
                      ? (row.principal / row.totalBalance) * 100
                      : 100;
                  const interestRatio = 100 - principalRatio;

                  return (
                    <div
                      key={row.year}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end"
                    >
                      {/* Hover Tooltip */}
                      <div className="pointer-events-none absolute -top-14 z-20 hidden w-40 rounded-lg border border-slate-700 bg-slate-950 p-2 text-[11px] shadow-xl group-hover:block">
                        <p className="font-semibold text-white">
                          Year {row.year}: {formatCurrency(row.totalBalance)}
                        </p>
                        <p className="text-sky-400">
                          Principal: {formatCurrency(row.principal)}
                        </p>
                        <p className="text-emerald-400">
                          Interest: {formatCurrency(row.interest)}
                        </p>
                      </div>

                      <div
                        style={{ height: `${totalHeightPct}%` }}
                        className="flex w-full max-w-[34px] flex-col justify-end overflow-hidden rounded-t-md transition-all duration-300 group-hover:brightness-110"
                      >
                        <div
                          style={{ height: `${interestRatio}%` }}
                          className="w-full bg-emerald-500"
                        />
                        <div
                          style={{ height: `${principalRatio}%` }}
                          className="w-full bg-sky-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>Year 1</span>
                <span>Year {Math.ceil(years / 2)}</span>
                <span>Year {years}</span>
              </div>
            </div>

            {/* Yearly Breakdown Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-6 py-4">
                <h3 className="text-sm font-semibold text-white">
                  Annual Amortization & Compounding Schedule
                </h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-950 text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Year</th>
                      <th className="px-6 py-3 font-medium">Total Invested</th>
                      <th className="px-6 py-3 font-medium">Compound Gains</th>
                      <th className="px-6 py-3 text-right font-medium">
                        Ending Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {projection.rows.map((row) => (
                      <tr
                        key={row.year}
                        className="transition hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-3 font-medium text-slate-200">
                          Year {row.year}
                        </td>
                        <td className="px-6 py-3 text-sky-400">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="px-6 py-3 text-emerald-400">
                          +{formatCurrency(row.interest)}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-white">
                          {formatCurrency(row.totalBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;