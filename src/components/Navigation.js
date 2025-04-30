'use client';
import { ChartBarIcon, TableCellsIcon, CurrencyDollarIcon, Bars3Icon, XMarkIcon, GlobeAltIcon, ArrowTrendingUpIcon, BanknotesIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';

function formatNumber(number) {
  const roundedNumber = Math.round(number * 10000) / 10000;
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(roundedNumber);
}

function formatPrice(price) {
  if (!price) return '-';
  return `$${Number(price).toLocaleString()}`;
}

export default function Navigation({ summary, btcPrice, ethPrice, solPrice, xrpPrice, trades }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getAverageDailyProfitRate = () => {
    if (!trades || trades.length === 0) return 0;
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstTrade = sortedTrades[0];
    const lastTrade = sortedTrades[sortedTrades.length - 1];
    
    // 전체 수익률 계산
    const totalProfitRate = ((lastTrade.end_amount - firstTrade.start_amount) / firstTrade.start_amount) * 100;
    
    // 거래 기간 계산 (일 수)
    const firstTradeDate = new Date(firstTrade.date);
    const lastTradeDate = new Date(lastTrade.date);
    const daysDiff = Math.max(1, Math.ceil((lastTradeDate - firstTradeDate) / (1000 * 60 * 60 * 24)) + 1);
    
    // 일평균 수익률 = 전체 수익률 / 거래 기간
    return totalProfitRate / daysDiff;
  };

  const getMonthlyProfit = () => {
    if (!trades || trades.length === 0) return 0;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return trades.reduce((sum, trade) => {
      const tradeDate = new Date(trade.date);
      if (tradeDate.getMonth() === currentMonth && tradeDate.getFullYear() === currentYear) {
        return sum + trade.profit;
      }
      return sum;
    }, 0);
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-[#1a1a1a] border-b border-[#333]">
      <div className="px-6">
        <div className="h-12 flex items-center">
          {/* 왼쪽: 로고와 시작/현재 자본 */}
          <div className="flex items-center space-x-8 flex-1">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-3">
              <div className="p-1.5 bg-[#FF8000] rounded">
                <ChartBarIcon className="h-4 w-4 text-white" />
              </div>
           
            </Link>

            {/* 시작/현재 자본 */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex items-center space-x-8">
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-[#FF8000]" />
                  <span className="text-xs text-gray-400">시작 자본</span>
                  <span className="text-sm font-bold text-white">{formatNumber(summary?.totalStartAmount || 0)}</span>
                  <span className="text-xs text-gray-400">USDT</span>
                </div>
                <div className="flex items-center gap-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-[#FF8000]" />
                  <span className="text-xs text-gray-400">현재 자본</span>
                  <span className="text-sm font-bold text-white">{formatNumber(summary?.totalEndAmount || 0)}</span>
                  <span className="text-xs text-gray-400">USDT</span>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 거래 기록 버튼 */}
          <div className="flex items-center gap-3">
            <Link
              href="/market"
              className="text-gray-400 hover:text-[#FF8000] transition-colors"
            >
              <GlobeAltIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/trades"
              className="text-gray-400 hover:text-[#FF8000] transition-colors"
            >
              <TableCellsIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${
        showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} onClick={() => setShowMobileMenu(false)}>
        <div className="absolute right-0 top-0 h-full w-64 bg-[#1a1a1a] p-6" onClick={e => e.stopPropagation()}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-white">메뉴</h2>
              <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-[#FF8000] font-medium"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>매매 일지</span>
              </Link>
              <Link
                href="/market"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white"
              >
                <GlobeAltIcon className="w-5 h-5" />
                <span>글로벌 마켓</span>
              </Link>
              <Link
                href="/trades"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white"
              >
                <TableCellsIcon className="w-5 h-5" />
                <span>거래 기록</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 md:hidden ${
        isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`} onClick={() => setIsCollapsed(false)}>
        <div className="absolute right-0 top-0 h-full w-64 bg-[#1a1a1a] p-6" onClick={e => e.stopPropagation()}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-white">메뉴</h2>
              <button onClick={() => setIsCollapsed(false)} className="p-2 text-gray-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                  <BanknotesIcon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-white/50">총 수익</div>
                  <div className={`text-sm font-bold ${summary.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatNumber(summary.totalProfit)} USDT
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-white/50">총 수익률</div>
                  <div className={`text-sm font-bold ${summary.totalProfitRate >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {summary.totalProfitRate.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl">
                  <ChartBarIcon className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <div className="text-xs text-white/50">일평균 수익률</div>
                  <div className={`text-sm font-bold ${getAverageDailyProfitRate() >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                    {getAverageDailyProfitRate().toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl">
                  <CalendarIcon className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <div className="text-xs text-white/50">이번 달 수익</div>
                  <div className={`text-sm font-bold ${getMonthlyProfit() >= 0 ? 'text-pink-400' : 'text-red-400'}`}>
                    {formatNumber(getMonthlyProfit())} USDT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 