'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Loader2, ArrowUpRight, ArrowDownRight, BarChart3, Wallet, Landmark } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface StatementData {
  income: { total: number; byCategory: { category: string; total: number; count: number }[] };
  expenses: { total: number; byCategory: { category: string; total: number; count: number }[] };
  orderRevenue: number;
  cashSalesTotal: number;
  bankDepositsTotal: number;
  netProfit: number;
  profitMargin: string;
  period: { from: string; to: string };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function StatementsPage() {
  const { data: session } = useSession() || {};
  const currency = (session?.user as any)?.tenantCurrency ?? 'NGN';
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const getDateRange = useCallback(() => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    if (periodType === 'month') {
      const from = new Date(year, month, 1).toISOString().slice(0, 10);
      const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      return { from, to };
    } else if (periodType === 'year') {
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    } else {
      return { from: customFrom, to: customTo };
    }
  }, [periodType, selectedMonth, selectedYear, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      if (!from || !to) { setLoading(false); return; }
      const res = await fetch(`/api/finance/statements?from=${from}&to=${to}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [getDateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  const maxIncome = data ? Math.max(...data.income.byCategory.map(c => c.total), 1) : 1;
  const maxExpense = data ? Math.max(...data.expenses.byCategory.map(c => c.total), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight">Financial Statements</h1>
        <p className="text-muted-foreground mt-1">Profit & Loss summary and financial analysis</p>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-32">
              <Label className="text-xs">Period</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="month">Monthly</SelectItem><SelectItem value="year">Yearly</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
              </Select>
            </div>
            {periodType === 'month' && (
              <>
                <div className="w-36">
                  <Label className="text-xs">Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label className="text-xs">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </>
            )}
            {periodType === 'year' && (
              <div className="w-24">
                <Label className="text-xs">Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {periodType === 'custom' && (
              <>
                <div><Label className="text-xs">From</Label><Input type="date" className="h-9 w-36" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></div>
                <div><Label className="text-xs">To</Label><Input type="date" className="h-9 w-36" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-muted-foreground font-medium">Total Income</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.income.total, currency)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-muted-foreground font-medium">Total Expenses</span>
                </div>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(data.expenses.total, currency)}</p>
              </CardContent>
            </Card>
            <Card className={`border-l-4 ${data.netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className={`w-5 h-5 ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`} />
                  <span className="text-sm text-muted-foreground font-medium">Net Profit/Loss</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(Math.abs(data.netProfit), currency)}</p>
                  {data.netProfit >= 0 ? <ArrowUpRight className="w-5 h-5 text-emerald-500" /> : <ArrowDownRight className="w-5 h-5 text-red-500" />}
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <PieChart className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm text-muted-foreground font-medium">Profit Margin</span>
                </div>
                <p className={`text-2xl font-bold ${parseFloat(data.profitMargin) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{data.profitMargin}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-sm text-muted-foreground">Order Revenue</p><p className="text-lg font-bold">{formatCurrency(data.orderRevenue, currency)}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><Wallet className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="text-sm text-muted-foreground">Cash Sales</p><p className="text-lg font-bold">{formatCurrency(data.cashSalesTotal, currency)}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"><Landmark className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="text-sm text-muted-foreground">Bank Deposits</p><p className="text-lg font-bold">{formatCurrency(data.bankDepositsTotal, currency)}</p></div>
            </CardContent></Card>
          </div>

          {/* P&L Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" />Income Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.income.byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No income data for this period</p>
                ) : (
                  data.income.byCategory.sort((a, b) => b.total - a.total).map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat.category}</span>
                        <span className="font-semibold text-emerald-600">{formatCurrency(cat.total, currency)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(cat.total / maxIncome) * 100}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{cat.count} record{cat.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" />Expense Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.expenses.byCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No expense data for this period</p>
                ) : (
                  data.expenses.byCategory.sort((a, b) => b.total - a.total).map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat.category}</span>
                        <span className="font-semibold text-red-500">{formatCurrency(cat.total, currency)}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(cat.total / maxExpense) * 100}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{cat.count} record{cat.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* P&L Statement Table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Profit & Loss Statement</CardTitle></CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 border-b">
                  <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">Revenue / Income</p>
                </div>
                {data.income.byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between px-4 py-2.5 border-b text-sm">
                    <span className="pl-4">{cat.category}</span>
                    <span className="font-medium">{formatCurrency(cat.total, currency)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-emerald-50/50 dark:bg-emerald-950/10">
                  <span className="font-bold text-sm">Total Income</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(data.income.total, currency)}</span>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 px-4 py-3 border-b">
                  <p className="font-semibold text-sm text-red-800 dark:text-red-300">Expenses</p>
                </div>
                {data.expenses.byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between px-4 py-2.5 border-b text-sm">
                    <span className="pl-4">{cat.category}</span>
                    <span className="font-medium">({formatCurrency(cat.total, currency)})</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-red-50/50 dark:bg-red-950/10">
                  <span className="font-bold text-sm">Total Expenses</span>
                  <span className="font-bold text-red-500">({formatCurrency(data.expenses.total, currency)})</span>
                </div>

                <div className={`flex items-center justify-between px-4 py-4 ${data.netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                  <span className="font-bold">Net Profit / (Loss)</span>
                  <span className={`font-bold text-lg ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {data.netProfit < 0 && '('}{formatCurrency(Math.abs(data.netProfit), currency)}{data.netProfit < 0 && ')'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-20">
          <PieChart className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Select a period to view statements</p>
        </div>
      )}
    </div>
  );
}
