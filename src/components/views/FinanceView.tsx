import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  PieChart,
  Edit2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinanceState, FinanceTransaction, FinanceAccount, FinanceCategory } from '../../types';
import { MeridianStorage, fmtNaira, fmtDateShort, todayStr, daysAgoStr } from '../../services/storage';
import { Haptics } from '../../services/haptics';

export const FinanceView: React.FC = () => {
  const [state, setState] = useState<FinanceState>(() => MeridianStorage.getFinance());
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'transactions' | 'budgets' | 'accounts'>('overview');

  // Quick Expense Tray Modal
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState<string>('1500');
  const [quickCategory, setQuickCategory] = useState<string>('cat_food');
  const [quickAccount, setQuickAccount] = useState<string>('acc_opay');
  const [quickMerchant, setQuickMerchant] = useState<string>('');

  // Transaction filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate account balances
  const calculateBalance = (account: FinanceAccount) => {
    let bal = account.opening;
    state.transactions.forEach(t => {
      if (t.type === 'income' && t.accountId === account.id) bal += t.amountKobo;
      else if (t.type === 'expense' && t.accountId === account.id) bal -= t.amountKobo;
      else if (t.type === 'adjustment' && t.accountId === account.id) bal += t.amountKobo;
      else if (t.type === 'transfer') {
        if (t.fromAccountId === account.id) bal -= t.amountKobo;
        if (t.toAccountId === account.id) bal += t.amountKobo;
      }
    });
    return bal;
  };

  const totalNetWorthKobo = state.accounts.reduce((sum, a) => sum + calculateBalance(a), 0);

  // Month & Calendar Headroom Calculations
  const today = todayStr();
  const ym = today.slice(0, 7);
  const now = new Date();
  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemainingInMonth = Math.max(1, totalDaysInMonth - currentDay + 1);

  const monthTransactions = state.transactions.filter(t => t.date.slice(0, 7) === ym);
  const monthIncomeKobo = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + t.amountKobo, 0);
  const monthExpenseKobo = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + t.amountKobo, 0);

  // Total Monthly Budget across categories
  const totalMonthlyBudgetCents = Object.values(state.budgets).reduce((acc, b) => acc + (b || 0), 0) || 12000000; // default ₦120,000 if empty
  const remainingMonthlyBudgetKobo = Math.max(0, totalMonthlyBudgetCents - monthExpenseKobo);

  // Daily Headroom Engine
  const dailySafeSpendHeadroomKobo = Math.round(remainingMonthlyBudgetKobo / daysRemainingInMonth);
  const todayExpenseKobo = monthTransactions
    .filter(t => t.type === 'expense' && t.date === today)
    .reduce((s, t) => s + t.amountKobo, 0);
  const todayRemainingHeadroomKobo = dailySafeSpendHeadroomKobo - todayExpenseKobo;
  const isOverTodayHeadroom = todayRemainingHeadroomKobo < 0;

  // Monthly savings rate
  const savingsRate =
    monthIncomeKobo > 0
      ? Math.round(((monthIncomeKobo - monthExpenseKobo) / monthIncomeKobo) * 100)
      : null;

  // Financial Runway (Months of survival at current expense burn)
  const averageDailyBurnKobo = currentDay > 0 ? monthExpenseKobo / currentDay : 0;
  const estimatedMonthlyBurnKobo = averageDailyBurnKobo * 30;
  const runwayMonths = estimatedMonthlyBurnKobo > 0 ? (totalNetWorthKobo / estimatedMonthlyBurnKobo).toFixed(1) : '∞';

  // Category spending breakdown for current month
  const categorySpend: Record<string, number> = {};
  monthTransactions
    .filter(t => t.type === 'expense' && t.categoryId)
    .forEach(t => {
      categorySpend[t.categoryId!] = (categorySpend[t.categoryId!] || 0) + t.amountKobo;
    });

  // 14-Day Rolling Cash Flow Telemetry for Bar Visual
  const last14DaysData = useMemo(() => {
    const list = [];
    for (let i = 13; i >= 0; i--) {
      const dateKey = daysAgoStr(i);
      const dayTxns = state.transactions.filter(t => t.date === dateKey);
      const inc = dayTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amountKobo, 0);
      const exp = dayTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amountKobo, 0);
      list.push({
        date: dateKey,
        label: dateKey.slice(8), // day of month e.g. "26"
        incomeKobo: inc,
        expenseKobo: exp,
        netKobo: inc - exp,
      });
    }
    return list;
  }, [state.transactions]);

  const maxDailyBarVal = Math.max(
    ...last14DaysData.map(d => Math.max(d.incomeKobo, d.expenseKobo)),
    100000 // minimum ₦1,000 scale
  );

  const handleCreateQuickExpense = () => {
    const amt = parseFloat(quickAmount);
    if (isNaN(amt) || amt <= 0) return;

    Haptics.success();
    const newTx: FinanceTransaction = {
      id: 'tx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: 'expense',
      date: today,
      accountId: quickAccount,
      categoryId: quickCategory,
      merchant: quickMerchant.trim() || state.categories.find(c => c.id === quickCategory)?.name || 'Quick Expense',
      amountKobo: Math.round(amt * 100),
      note: 'Logged via Quick Spend Hub',
      timestamp: new Date().toISOString(),
    };

    const updated = {
      ...state,
      transactions: [newTx, ...state.transactions],
    };
    setState(updated);
    MeridianStorage.saveFinance(updated);
    setIsQuickExpenseOpen(false);
    setQuickMerchant('');
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Delete this transaction entry?')) {
      Haptics.light();
      const updated = state.transactions.filter(t => t.id !== id);
      const newState = { ...state, transactions: updated };
      setState(newState);
      MeridianStorage.saveFinance(newState);
    }
  };

  const handleExportCSV = () => {
    Haptics.medium();
    const header = ['Date', 'Type', 'Account', 'Category', 'Merchant/Note', 'Amount (NGN)'];
    const rows = state.transactions.map(t => {
      const acc = state.accounts.find(a => a.id === t.accountId);
      const cat = state.categories.find(c => c.id === t.categoryId);
      return [
        t.date,
        t.type,
        acc ? acc.name : '',
        cat ? cat.name : '',
        `"${(t.merchant || t.note || '').replace(/"/g, '""')}"`,
        (t.amountKobo / 100).toFixed(2),
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meridian-finance-transactions-${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTransactions = state.transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (accountFilter !== 'all' && t.accountId !== accountFilter && t.fromAccountId !== accountFilter && t.toAccountId !== accountFilter)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (t.merchant && t.merchant.toLowerCase().includes(q)) ||
        (t.note && t.note.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Sub-Navigation Tabs */}
      <div
        className="p-1.5 rounded-2xl border flex items-center justify-between gap-1 overflow-x-auto"
        style={{
          backgroundColor: 'var(--md-sys-color-surface-container)',
          borderColor: 'var(--md-sys-color-outline-variant)',
        }}
      >
        <div className="flex items-center gap-1">
          {[
            { id: 'overview', label: 'Financial Overview', icon: Wallet },
            { id: 'transactions', label: `Transactions (${state.transactions.length})`, icon: ArrowRightLeft },
            { id: 'budgets', label: 'Monthly Budgets', icon: PieChart },
            { id: 'accounts', label: 'Asset Vaults', icon: DollarSign },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  Haptics.selection();
                  setActiveSubTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Spend Action Button */}
        <button
          type="button"
          onClick={() => {
            Haptics.medium();
            setIsQuickExpenseOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-on-primary shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Quick Log</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: FINANCIAL OVERVIEW & DAILY HEADROOM ENGINE
          ═══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Main Net Worth & Flow Ribbon */}
          <div
            className="p-6 rounded-3xl border shadow-sm space-y-5"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-primary tracking-wider">
                  Total Combined Capital Assets
                </span>
                <div className="text-3xl sm:text-4xl font-bold font-mono text-on-surface mt-1">
                  {fmtNaira(totalNetWorthKobo)}
                </div>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1.5">
                  <span>Runway: <strong className="font-mono text-on-surface">{runwayMonths} months</strong></span>
                  <span>·</span>
                  <span>Savings Rate: <strong className="font-mono text-emerald-400">{savingsRate != null ? `${savingsRate}%` : 'N/A'}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant text-left">
                  <span className="text-[11px] font-mono text-on-surface-variant">This Month In</span>
                  <div className="text-sm sm:text-base font-bold font-mono text-emerald-400">+{fmtNaira(monthIncomeKobo)}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant text-left">
                  <span className="text-[11px] font-mono text-on-surface-variant">This Month Out</span>
                  <div className="text-sm sm:text-base font-bold font-mono text-rose-400">−{fmtNaira(monthExpenseKobo)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DAILY BUDGET HEADROOM & SAFE SPEND ENGINE
              ═══════════════════════════════════════════════════════════════ */}
          <div
            className="p-6 rounded-3xl border shadow-sm space-y-4"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderColor: isOverTodayHeadroom ? 'rgba(239, 68, 68, 0.4)' : 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isOverTodayHeadroom
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isOverTodayHeadroom ? (
                    <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                      Daily Spend Headroom
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-on-surface-variant">
                      {daysRemainingInMonth} Days Left in {ym}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold font-display text-on-surface mt-0.5">
                    {isOverTodayHeadroom
                      ? `₦${Math.abs(todayRemainingHeadroomKobo / 100).toLocaleString()} over daily target pace`
                      : `${fmtNaira(todayRemainingHeadroomKobo)} safe buffer remaining today`}
                  </h4>
                </div>
              </div>

              {/* Quick Log Button right from Headroom */}
              <button
                type="button"
                onClick={() => {
                  Haptics.light();
                  setIsQuickExpenseOpen(true);
                }}
                className="px-3.5 py-2 rounded-2xl text-xs font-bold border border-outline-variant hover:bg-black/5 dark:hover:bg-white/5 text-on-surface flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Today’s Spend</span>
              </button>
            </div>

            {/* Metrics Breakdown Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant">
                <div className="text-[10px] font-mono text-on-surface-variant">Target Safe Daily Pace</div>
                <div className="text-base font-bold font-mono text-primary mt-0.5">
                  {fmtNaira(dailySafeSpendHeadroomKobo)}/day
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  {fmtNaira(remainingMonthlyBudgetKobo)} left in monthly cap
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant">
                <div className="text-[10px] font-mono text-on-surface-variant">Today's Total Outflow</div>
                <div className="text-base font-bold font-mono text-on-surface mt-0.5">
                  {fmtNaira(todayExpenseKobo)}
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  {monthTransactions.filter(t => t.date === today && t.type === 'expense').length} transactions
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant">
                <div className="text-[10px] font-mono text-on-surface-variant">Pace Health</div>
                <div className={`text-base font-bold font-mono mt-0.5 ${isOverTodayHeadroom ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isOverTodayHeadroom ? 'Caution: Pace Breached' : 'Optimum Discipline'}
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  Monthly Cap: {fmtNaira(totalMonthlyBudgetCents)}
                </div>
              </div>
            </div>

            {/* Visual Headroom Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
                <span>Today's Headroom Utilization:</span>
                <span className="font-bold">
                  {dailySafeSpendHeadroomKobo > 0
                    ? `${Math.min(200, Math.round((todayExpenseKobo / dailySafeSpendHeadroomKobo) * 100))}%`
                    : '100%'}
                </span>
              </div>
              <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverTodayHeadroom
                      ? 'bg-rose-500'
                      : todayRemainingHeadroomKobo < dailySafeSpendHeadroomKobo * 0.3
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (todayExpenseKobo / Math.max(1, dailySafeSpendHeadroomKobo)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              14-DAY CASHFLOW WATERFALL VISUALIZATION
              ═══════════════════════════════════════════════════════════════ */}
          <div
            className="p-6 rounded-3xl border shadow-sm space-y-4"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono font-bold uppercase text-primary tracking-wider">
                  Cashflow Momentum
                </div>
                <h3 className="text-base font-bold font-display text-on-surface mt-0.5">
                  14-Day Inflow vs. Outflow Trajectory
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Inflow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span>Outflow</span>
                </div>
              </div>
            </div>

            {/* Bar Waterfall Chart */}
            <div className="pt-4 pb-2">
              <div className="h-36 flex items-end gap-2 px-1">
                {last14DaysData.map(day => {
                  const isCurrentDay = day.date === today;
                  const inHeight = Math.max(4, Math.round((day.incomeKobo / maxDailyBarVal) * 110));
                  const outHeight = Math.max(4, Math.round((day.expenseKobo / maxDailyBarVal) * 110));

                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end cursor-pointer"
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-black/90 text-white text-[10px] font-mono px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap shadow-md">
                        <span>{day.date}</span>
                        <span className="text-emerald-400">+{fmtNaira(day.incomeKobo)}</span>
                        <span className="text-rose-400">−{fmtNaira(day.expenseKobo)}</span>
                      </div>

                      {/* Bars Column */}
                      <div className="w-full flex items-end justify-center gap-0.5">
                        {/* Income Bar */}
                        <div
                          className="w-1.5 sm:w-2.5 rounded-t-sm bg-emerald-400/80 transition-all duration-300 group-hover:bg-emerald-400"
                          style={{ height: `${day.incomeKobo > 0 ? inHeight : 0}px` }}
                        />
                        {/* Expense Bar */}
                        <div
                          className="w-1.5 sm:w-2.5 rounded-t-sm bg-rose-400/80 transition-all duration-300 group-hover:bg-rose-400"
                          style={{ height: `${day.expenseKobo > 0 ? outHeight : 0}px` }}
                        />
                      </div>

                      {/* Day Label */}
                      <span
                        className={`text-[9px] font-mono ${
                          isCurrentDay ? 'text-primary font-bold underline' : 'text-on-surface-variant'
                        }`}
                      >
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Account Balances Grid */}
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-on-surface-variant mb-3 px-1">
              Active Vault Balances
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {state.accounts.map(acc => {
                const bal = calculateBalance(acc);
                return (
                  <div
                    key={acc.id}
                    className="p-4 rounded-2xl border bg-surface-container space-y-2 shadow-sm"
                    style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{acc.name}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: acc.accent }}
                      />
                    </div>
                    <div className="text-lg font-bold font-mono text-on-surface">{fmtNaira(bal)}</div>
                    <div className="text-[10px] text-on-surface-variant font-mono uppercase">
                      {acc.kind} Account
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: TRANSACTIONS LIST WITH ADVANCED FILTERS & SEARCH
          ═══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full px-3.5 py-2 text-xs rounded-full border bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface"
              />
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-full border bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface"
              >
                <option value="all" className="dark:bg-zinc-800">All Types</option>
                <option value="expense" className="dark:bg-zinc-800">Expense</option>
                <option value="income" className="dark:bg-zinc-800">Income</option>
                <option value="transfer" className="dark:bg-zinc-800">Transfer</option>
                <option value="adjustment" className="dark:bg-zinc-800">Adjustment</option>
              </select>
            </div>
            <button
              onClick={handleExportCSV}
              type="button"
              className="px-4 py-2 text-xs font-semibold rounded-full border border-outline-variant hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 text-on-surface-variant shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Transactions List */}
          <div
            className="rounded-3xl border divide-y overflow-hidden shadow-sm"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-on-surface-variant">
                No transactions match your filter criteria.
              </div>
            ) : (
              filteredTransactions.map(t => {
                const acc = state.accounts.find(a => a.id === t.accountId);
                const cat = state.categories.find(c => c.id === t.categoryId);
                const isExpense = t.type === 'expense';
                const isIncome = t.type === 'income';

                return (
                  <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isExpense
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : isExpense ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowRightLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs sm:text-sm font-semibold text-on-surface truncate">
                          {t.merchant || t.note || (t.type[0].toUpperCase() + t.type.slice(1))}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-on-surface-variant flex-wrap">
                          <span>{fmtDateShort(t.date)}</span>
                          {acc && <span>· {acc.name}</span>}
                          {cat && (
                            <span
                              className="px-2 py-0.2 rounded-full font-mono text-[10px]"
                              style={{ backgroundColor: cat.color + '22', color: cat.color }}
                            >
                              {cat.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-mono font-bold ${
                          isIncome ? 'text-emerald-400' : isExpense ? 'text-rose-400' : 'text-on-surface'
                        }`}
                      >
                        {isExpense ? '−' : isIncome ? '+' : ''}
                        {fmtNaira(t.amountKobo)}
                      </span>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-rose-400"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: BUDGETS BREAKDOWN
          ═══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'budgets' && (
        <div
          className="p-6 rounded-3xl border space-y-4 shadow-sm"
          style={{
            backgroundColor: 'var(--md-sys-color-surface-container)',
            borderColor: 'var(--md-sys-color-outline-variant)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display">Monthly Category Budgets</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Cap targets for {ym} · Headroom calculated against these caps
              </p>
            </div>
            <span className="text-xs font-mono text-primary font-bold">
              Total Budget: {fmtNaira(totalMonthlyBudgetCents)}
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {state.categories
              .filter(c => c.kind === 'expense')
              .map(cat => {
                const budgetKobo = state.budgets[cat.id] || 0;
                const spentKobo = categorySpend[cat.id] || 0;
                const pct = budgetKobo > 0 ? Math.min(100, Math.round((spentKobo / budgetKobo) * 100)) : 0;
                const isOver = budgetKobo > 0 && spentKobo > budgetKobo;

                return (
                  <div key={cat.id} className="space-y-1.5 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-outline-variant">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-semibold">{cat.name}</span>
                      </div>
                      <div className="font-mono text-xs">
                        <span className={isOver ? 'text-rose-400 font-bold' : 'text-on-surface'}>{fmtNaira(spentKobo)}</span>
                        {budgetKobo > 0 && <span className="text-on-surface-variant"> / {fmtNaira(budgetKobo)}</span>}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : 'bg-primary'}`}
                        style={{ width: `${budgetKobo > 0 ? pct : spentKobo > 0 ? 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 4: ASSET VAULTS
          ═══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'accounts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {state.accounts.map(acc => {
            const bal = calculateBalance(acc);
            return (
              <div
                key={acc.id}
                className="p-5 rounded-3xl border bg-surface-container space-y-3"
                style={{ borderColor: 'var(--md-sys-color-outline-variant)' }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">{acc.name}</h4>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold"
                    style={{ backgroundColor: acc.accent + '22', color: acc.accent }}
                  >
                    {acc.kind}
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-on-surface">{fmtNaira(bal)}</div>
                <p className="text-xs text-on-surface-variant font-mono">
                  Initial balance {fmtNaira(acc.opening)} on {fmtDateShort(acc.openingDate)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          QUICK EXPENSE LOG MODAL
          ═══════════════════════════════════════════════════════════════ */}
      {isQuickExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderColor: 'var(--md-sys-color-outline-variant)',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-on-surface">Quick Spend Log</h3>
                  <p className="text-[11px] text-on-surface-variant font-mono">Instant deduction from daily headroom</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickExpenseOpen(false)}
                className="p-1 rounded-xl text-xs text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            {/* Amount Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Amount (₦):</label>
              <input
                type="number"
                value={quickAmount}
                onChange={e => setQuickAmount(e.target.value)}
                placeholder="Amount (₦)"
                className="w-full p-3 rounded-2xl border text-base font-mono font-bold bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface focus:outline-hidden focus:border-primary"
              />
              <div className="flex gap-1.5 flex-wrap pt-1">
                {['500', '1000', '2000', '5000', '10000'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      Haptics.selection();
                      setQuickAmount(p);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xl border transition-all ${
                      quickAmount === p
                        ? 'bg-primary-container text-on-primary-container border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    ₦{parseInt(p).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Category:</label>
              <select
                value={quickCategory}
                onChange={e => setQuickCategory(e.target.value)}
                className="w-full p-2.5 rounded-2xl border bg-black/5 dark:bg-white/5 border-outline-variant text-xs text-on-surface font-medium"
              >
                {state.categories
                  .filter(c => c.kind === 'expense')
                  .map(c => (
                    <option key={c.id} value={c.id} className="dark:bg-zinc-800">
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Account Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Account Vault:</label>
              <select
                value={quickAccount}
                onChange={e => setQuickAccount(e.target.value)}
                className="w-full p-2.5 rounded-2xl border bg-black/5 dark:bg-white/5 border-outline-variant text-xs text-on-surface font-medium"
              >
                {state.accounts.map(a => (
                  <option key={a.id} value={a.id} className="dark:bg-zinc-800">
                    {a.name} ({fmtNaira(calculateBalance(a))})
                  </option>
                ))}
              </select>
            </div>

            {/* Merchant / Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface">Merchant / Description (Optional):</label>
              <input
                type="text"
                value={quickMerchant}
                onChange={e => setQuickMerchant(e.target.value)}
                placeholder="e.g. Lunch cafeteria, Lab printouts..."
                className="w-full p-2.5 rounded-2xl border text-xs bg-black/5 dark:bg-white/5 border-outline-variant text-on-surface focus:outline-hidden focus:border-primary"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuickExpenseOpen(false)}
                className="px-4 py-2 rounded-2xl text-xs font-semibold text-on-surface-variant hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateQuickExpense}
                className="px-5 py-2 rounded-2xl text-xs font-bold text-on-primary shadow-md flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--md-sys-color-primary)' }}
              >
                <span>Deduct from Headroom</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
