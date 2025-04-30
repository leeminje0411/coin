'use client';

import { 
  HomeIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function formatNumber(number) {
  const roundedNumber = Math.round(number * 10000) / 10000;
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(roundedNumber);
}

const navigation = [
  { name: '대시보드', href: '/', icon: HomeIcon },
  { name: '거래 현황', href: '/transactions', icon: ChartBarIcon },
  { name: '사용자 관리', href: '/users', icon: UserGroupIcon },
  { name: '설정', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar({ summary, trades }) {
  const pathname = usePathname();
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [chartType, setChartType] = useState('profit'); // 'profit' or 'capital'

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

  // 최근 30일 수익률 데이터 가져오기
  const getLast30DaysData = () => {
    if (!trades || trades.length === 0) return { labels: [], data: [] };
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const last30Trades = sortedTrades.slice(-30);
    
    return {
      labels: last30Trades.map(trade => new Date(trade.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })),
      data: last30Trades.map(trade => trade.profit_rate)
    };
  };

  // 전체 수익률 데이터 가져오기
  const getAllProfitData = () => {
    if (!trades || trades.length === 0) return { labels: [], data: [] };
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      labels: sortedTrades.map(trade => new Date(trade.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })),
      data: sortedTrades.map(trade => trade.profit_rate)
    };
  };

  const getLast30DaysCapitalData = () => {
    if (!trades || trades.length === 0) return { labels: [], data: [] };
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const last30Trades = sortedTrades.slice(-30);
    
    return {
      labels: last30Trades.map(trade => new Date(trade.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })),
      data: last30Trades.map(trade => trade.end_amount)
    };
  };

  const getAllCapitalData = () => {
    if (!trades || trades.length === 0) return { labels: [], data: [] };
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      labels: sortedTrades.map(trade => new Date(trade.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })),
      data: sortedTrades.map(trade => trade.end_amount)
    };
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 0
      }
    }
  };

  const modalChartOptions = {
    ...miniChartOptions,
    plugins: {
      ...miniChartOptions.plugins,
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 10
          },
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  const miniCapitalChartOptions = {
    ...miniChartOptions,
    scales: {
      x: {
        display: false
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 10
          },
          callback: function(value) {
            return value.toLocaleString() + ' USDT';
          }
        }
      }
    }
  };

  const modalCapitalChartOptions = {
    ...modalChartOptions,
    scales: {
      ...modalChartOptions.scales,
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 10
          },
          callback: function(value) {
            return value.toLocaleString() + ' USDT';
          }
        }
      }
    }
  };

  const last30DaysData = getLast30DaysData();
  const avgDailyRate = getAverageDailyProfitRate();
  const miniChartData = {
    labels: last30DaysData.labels,
    datasets: [
      {
        data: last30DaysData.data,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true
      },
      {
        label: '평균 수익률',
        data: Array(last30DaysData.labels.length).fill(avgDailyRate),
        borderColor: '#FFB800',
        borderWidth: 1.5,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
      }
    ]
  };

  const allProfitData = getAllProfitData();
  const modalChartData = {
    labels: allProfitData.labels,
    datasets: [
      {
        label: '일일 수익률',
        data: allProfitData.data,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true
      },
      {
        label: '평균 수익률',
        data: Array(allProfitData.labels.length).fill(avgDailyRate),
        borderColor: '#FFB800',
        borderWidth: 1.5,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
      }
    ]
  };

  const last30DaysCapital = getLast30DaysCapitalData();
  const miniCapitalChartData = {
    labels: last30DaysCapital.labels,
    datasets: [{
      data: last30DaysCapital.data,
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true
    }]
  };

  const allCapitalData = getAllCapitalData();
  const modalCapitalChartData = {
    labels: allCapitalData.labels,
    datasets: [{
      label: '자본금',
      data: allCapitalData.data,
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true
    }]
  };

  return (
    <>
      <div className="flex h-screen w-full flex-col bg-[#1a1a1a] border-r border-[#333]">
        <div className="flex h-12 items-center justify-center border-b border-[#333]">
          <h1 className="text-xl font-bold text-white">코인 관리자</h1>
        </div>

        {/* 통계 정보 */}
        <div className="px-4 py-6 space-y-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
              <BanknotesIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">총 수익</div>
              <div className={`text-sm font-bold ${summary?.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatNumber(summary?.totalProfit || 0)} USDT
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-xl">
              <ArrowTrendingUpIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">총 수익률</div>
              <div className={`text-sm font-bold ${summary?.totalProfitRate >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {(summary?.totalProfitRate || 0).toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-xl">
              <ChartBarIcon className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">일평균 수익률</div>
              <div className={`text-sm font-bold ${getAverageDailyProfitRate() >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                {getAverageDailyProfitRate().toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <div className="text-xs text-gray-400">이번 달 수익</div>
              <div className={`text-sm font-bold ${getMonthlyProfit() >= 0 ? 'text-pink-400' : 'text-red-400'}`}>
                {formatNumber(getMonthlyProfit())} USDT
              </div>
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="px-4 py-6 space-y-6 border-b border-[#333]">
          {/* 수익률 차트 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white">수익률 추이</h2>
              <button
                onClick={() => setShowProfitModal(true)}
                className="p-1.5 text-white/50 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[100px]">
              <Line options={miniChartOptions} data={miniChartData} />
            </div>
          </div>

          {/* 자본금 차트 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white">자본금 추이</h2>
              <button
                onClick={() => setShowProfitModal(true)}
                className="p-1.5 text-white/50 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[100px]">
              <Line options={miniCapitalChartOptions} data={miniCapitalChartData} />
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#FF8000] to-[#FF9500] text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#333] p-4">
          <button
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0" />
            로그아웃
          </button>
        </div>
      </div>

      {/* 상세 모달 */}
      {showProfitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1E293B]/95 to-[#0F172A]/95 backdrop-blur-2xl rounded-2xl shadow-xl p-6 border border-white/5 w-[90%] max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">상세 분석</h2>
              <button
                onClick={() => setShowProfitModal(false)}
                className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-white mb-4">수익률 분석</h3>
                <div className="h-[250px]">
                  <Line options={modalChartOptions} data={modalChartData} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-4">자본금 분석</h3>
                <div className="h-[250px]">
                  <Line options={modalCapitalChartOptions} data={modalCapitalChartData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 