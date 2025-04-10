'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon, 
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const symbolMap: Record<string, string> = {
  BTCUSDT: '비트코인',
  ETHUSDT: '이더리움',
};

const sideMap: Record<string, string> = {
  BUY: '롱',
  SELL: '숏',
};

const iconMap: Record<string, JSX.Element> = {
  BTCUSDT: <img src="/bitcoin.svg" alt="BTC" className="w-8 h-8" />,
  ETHUSDT: <img src="/ethereum.svg" alt="ETH" className="w-8 h-8" />,
};

function formatDate(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const isSameYear = d.getFullYear() === now.getFullYear();
  return `${isSameYear ? '' : d.getFullYear() + '-'}${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatPrice(price: number | null) {
  if (!price) return '-';
  return `$${Math.floor(price).toLocaleString()}`;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [trades, setTrades] = useState<any[]>([]);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState('PnL 시간순');
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [showAllSchedules, setShowAllSchedules] = useState(false);
  const [allSchedules, setAllSchedules] = useState<Array<{ scheduled_time: string }>>([]);
  
  const fetchAllSchedules = async () => {
    const { data, error } = await supabase
      .from('scheduled_trades')
      .select('scheduled_time')
      .order('scheduled_time', { ascending: true });
    if (error) {
      console.error('❌ 일정 불러오기 실패:', error);
    } else {
      setAllSchedules(data || []);
      setShowAllSchedules(true);
    }
  };
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 세션 확인
    const session = localStorage.getItem('dbResetSession');
    if (session) {
      const sessionData = JSON.parse(session);
      if (new Date().getTime() < sessionData.expiry) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('dbResetSession');
      }
    }
  }, []);

  const handlePasswordSubmit = () => {
    if (password === '**Ww04110812') {
      setIsAuthenticated(true);
      // 30일간의 세션 저장
      const sessionData = {
        expiry: new Date().getTime() + (30 * 24 * 60 * 60 * 1000)
      };
      localStorage.setItem('dbResetSession', JSON.stringify(sessionData));
      setShowPasswordModal(false);
      setPassword('');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
      setPassword('');
    }
  };

  useEffect(() => {
    const fetchTrades = async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*') // Fetch all necessary fields including entry_amount
        .order('entry_time', { ascending: false });
      if (error) console.error('❌ Supabase fetch error (trades):', error);
      else {
        setTrades(data);
        console.log("🧾 전체 trades (UTC → KST):");
        data.forEach((t, i) => {
          const utc = new Date(t.created_at);
          const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
          console.log(`#${i + 1}: UTC=${utc.toISOString()}, KST=${kst.toString()}, entry_amount=${t.entry_amount}`);
        });

        const localToday = new Date();
        const kstStart = new Date(localToday.getFullYear(), localToday.getMonth(), localToday.getDate());
        const utcStart = new Date(kstStart.getTime() - 9 * 60 * 60 * 1000);
        const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);

        const todayTrades = data.filter(t => {
          const created = new Date(t.created_at);
          return created >= utcStart && created < utcEnd;
        });

        console.log("📌 오늘 trades:");
        todayTrades.forEach((t, i) => {
          const utc = new Date(t.created_at);
          const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
          console.log(`#${i + 1}: UTC=${utc.toISOString()}, KST=${kst.toString()}, entry_amount=${t.entry_amount}`);
        });

        const todayEntryAmount = todayTrades.reduce((sum, t) => sum + (t.entry_amount || 0), 0);
        console.log("💰 오늘 진입금 합계:", todayEntryAmount);

        setDailyStats(prev => prev ? { ...prev, today_entry_amount: todayEntryAmount } : { today_entry_amount: todayEntryAmount });
      }
    };

    const fetchDailyStats = async () => {
      const { data, error } = await supabase
        .from('daily_performance')
        .select('*')
        .order('date', { ascending: false });
      if (error) console.error('❌ Supabase fetch error (daily):', error);
      else {
        const winRates = data.map(row => row.win_rate).filter(r => typeof r === 'number');
        const averageWinRate = winRates.length > 0
          ? winRates.reduce((sum, r) => sum + r, 0) / winRates.length
          : 0;
        const totalPnl = data.reduce((sum, row) => sum + (row.pnl || 0), 0);
        const averageEntryCount = data.length > 0
          ? data.reduce((sum, row) => sum + (row.entry_count || 0), 0) / data.length
          : 0;
        
        const latest = data[0];
        latest.total_win_rate = averageWinRate;
        latest.total_pnl = totalPnl;
        latest.average_entry_count = averageEntryCount;
        
        const now = new Date();
        const utcNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
        
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('scheduled_trades')
          .select('scheduled_time')
          .order('scheduled_time', { ascending: true });
        
        if (!scheduleError && scheduleData?.length > 0) {
          // 현재 시간 이후의 가장 가까운 일정 찾기
          const nextSchedule = scheduleData.find(schedule => 
            new Date(schedule.scheduled_time) > now
          );
          if (nextSchedule) {
            latest.next_schedule = nextSchedule.scheduled_time;
          }
        }
        
        setDailyStats(prev => prev ? { ...prev, ...latest } : latest);
      }
    };

    fetchTrades();
    fetchDailyStats();
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/balance");
        const json = await res.json();
        setCurrentBalance(json.balance);
      } catch (err) {
        console.error("❌ 총 자산 API 호출 실패:", err);
      }
    };
    fetchBalance();

    const tradeChannel = supabase
      .channel('realtime:trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => fetchTrades())
      .subscribe();

    const dailyChannel = supabase
      .channel('realtime:daily_performance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_performance' }, () => fetchDailyStats())
      .subscribe();

    // 시간 업데이트
    const updateTime = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${year}. ${month}. ${day}. ${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(tradeChannel);
      supabase.removeChannel(dailyChannel);
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/stream?streams=btcusdt@trade/ethusdt@trade');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const price = parseFloat(message.data.p);
      if (message.stream === 'btcusdt@trade') setBtcPrice(price);
      if (message.stream === 'ethusdt@trade') setEthPrice(price);
    };

    return () => {
      ws.close();
    };
  }, []);

  const stats = dailyStats ? [
    { 
      name: '오늘 총 진입 수', 
      value: `${dailyStats.entry_count}회`, 
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500'
    },
    { 
      name: '익절 / 청산', 
      value: `${dailyStats.win_count} / ${dailyStats.loss_count}`, 
      icon: UserGroupIcon,
      color: 'bg-green-500'
    },
    { 
      name: '다음 진입 예정',
      value: (() => {
        const now = new Date();
        const upcoming = dailyStats?.next_schedule;
        if (!upcoming) return '-';
        const t = new Date(upcoming);
        const diffMin = Math.round((t.getTime() - now.getTime()) / 60000);
        return (
          <div>
            <div>{`${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')} 시`}</div>
            <button 
              onClick={fetchAllSchedules} 
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              오늘 전체 일정 보기
            </button>
          </div>
        );
      })(),
      icon: ArrowTrendingUpIcon,
      color: 'bg-yellow-500',
    }
  ] : [];

  const chartData = {
    labels: [...trades].reverse().map(trade => formatDate(trade.entry_time)),
    datasets: [
      {
        label: chartMode === 'PnL 시간순' ? 'PnL' : chartMode === '진입 수 시간순' ? '진입 수' : '승률',
        data: [...trades].reverse().map(trade => 
          chartMode === 'PnL 시간순' ? trade.pnl : 
          chartMode === '진입 수 시간순' ? trade.entry_count : 
          dailyStats?.win_rate || 0
        ),
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
      }
    ]
  };

  const handleDeleteAllData = async () => {
    if (!isAuthenticated) {
      setShowPasswordModal(true);
      return;
    }

    if (!confirm("정말 모든 데이터를 삭제하시겠습니까?")) return;
    
    const tables = ["daily_performance", "trades", "order_tracker", "scheduled_trades"];
    
    try {
      for (const table of tables) {
        const { error } = await supabase.rpc('truncate_table', { table_name: table });
        if (error) throw error;
      }
      alert("모든 테이블의 데이터가 삭제되었습니다.");
      location.reload();
    } catch (err) {
      console.error("❌ 삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 backdrop-blur-xl rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-indigo-100" />
                </div>
                <div>
                  <p className="text-xs text-indigo-200 font-medium tracking-wide">Trading Bot</p>
                  <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200">
                    MJ의 코인 실험소
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-xl">
                <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-lg">
                  <CurrencyDollarIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-200">총 자산</p>
                  <p className="text-base font-bold text-white">
                    {currentBalance !== null ? `$${Math.floor(currentBalance).toLocaleString()} ` : '-'}
                    <span className="text-xs text-indigo-200">USDT</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-xl">
                <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg shadow-lg">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-200">누적 수익</p>
                  <p className="text-base font-bold text-white">
                    {dailyStats?.total_pnl !== undefined ? `$${Math.floor(dailyStats.total_pnl).toLocaleString()} ` : '-'}
                    <span className="text-xs text-indigo-200">USDT</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-xl">
                <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-violet-400 to-violet-600 rounded-lg shadow-lg">
                  <ChartBarIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-200">누적 승률</p>
                  <p className="text-base font-bold text-white">
                    {dailyStats?.total_win_rate !== undefined ? `${dailyStats.total_win_rate.toFixed(2)}%` : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-xl">
                <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg">
                  <ArrowPathIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-indigo-200">일 평균 진입</p>
                  <p className="text-base font-bold text-white">
                    {dailyStats?.average_entry_count !== undefined ? `${Math.round(dailyStats.average_entry_count)}회` : '-'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-xl">
                <img src="/bitcoin.svg" alt="BTC" className="w-6 h-6" />
                <div>
                  <p className="text-xs font-medium text-indigo-200">비트코인</p>
                  <p className="text-base font-bold text-white">{formatPrice(btcPrice)} <span className="text-xs text-indigo-200">USDT</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-xl rounded-xl">
                <img src="/ethereum.svg" alt="ETH" className="w-6 h-6" />
                <div>
                  <p className="text-xs font-medium text-indigo-200">이더리움</p>
                  <p className="text-base font-bold text-white">{formatPrice(ethPrice)} <span className="text-xs text-indigo-200">USDT</span></p>
                </div>
              </div>
              <button
                onClick={handleDeleteAllData}
                className="bg-red-600 text-white px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-red-700 shadow-md transition-all"
              >
                DB 초기화
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-zinc-100">
        {/* 📊 상단 요약 정보 표시 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 rounded-xl shadow-sm p-6 border border-purple-400/20">
            <p className="text-sm text-purple-100 mb-1">오늘 수익</p>
            <p className="text-2xl font-bold text-white">
              {dailyStats ? `$${Math.floor(dailyStats.pnl || 0).toLocaleString()} ` : '-'}
              <span className="text-lg text-slate-400">USDT</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-xl shadow-sm p-6 border border-cyan-400/20">
            <p className="text-sm text-cyan-100 mb-1">오늘 진입금</p>
            <p className="text-2xl font-bold text-white">
              {dailyStats ? `$${Math.floor(dailyStats.today_entry_amount || 0).toLocaleString()} ` : '-'}
              <span className="text-lg text-slate-400">USDT</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 rounded-xl shadow-sm p-6 border border-pink-400/20">
            <p className="text-sm text-pink-100 mb-1">오늘 승률</p>
            <p className="text-2xl font-bold text-white">
              {dailyStats ? `${((dailyStats.win_count / (dailyStats.win_count + dailyStats.loss_count)) * 100).toFixed(2)}%` : '-'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-6">
          {/* 왼쪽 통계 정보 */}
          <div className="w-1/4 space-y-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-xl p-3 ${stat.color} bg-opacity-90`}>
                      <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <p className="text-sm font-medium text-slate-500 truncate">{stat.name}</p>
                      <div className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 오른쪽 그래프 */}
          <div className="w-3/4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">거래량 추이</h2>
                <div className="flex space-x-2">
                  {['PnL 시간순', '진입 수 시간순', '승률 시간순'].map((period) => (
                    <button
                      key={period}
                      className={`px-4 py-2 text-sm font-medium ${chartMode === period ? 'text-slate-900 bg-slate-200' : 'text-slate-600 hover:text-slate-900 bg-slate-100'} rounded-lg hover:bg-slate-200 transition-colors duration-200`}
                      onClick={() => setChartMode(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[300px]">
                <Line data={chartData} options={{ maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">최근 거래</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">거래 ID</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">코인</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">방향</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">레버리지</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">진입가</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">진입금</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">종료가</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">수익</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">시간</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{trade.id.slice(0, 8)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {iconMap[trade.symbol]}
                          </div>
                          <div className="ml-2 text-sm font-medium text-slate-900">
                            {symbolMap[trade.symbol] || trade.symbol}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium ${
                          trade.side === 'BUY' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {trade.side === 'BUY' 
                            ? <ArrowUpIcon className="w-3.5 h-3.5 mr-1" />
                            : <ArrowDownIcon className="w-3.5 h-3.5 mr-1" />
                          }
                          {sideMap[trade.side]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{trade.leverage}x</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{trade.entry_price?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{trade.entry_amount ? `$${trade.entry_amount.toLocaleString()} USDT` : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{trade.exit_price?.toLocaleString() || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={trade.pnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          ${trade.pnl?.toLocaleString()} USDT
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm ${
                          trade.is_win === true 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : trade.is_win === false 
                            ? 'bg-rose-50 text-rose-700' 
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          <div className="flex items-center">
                            <span className={`w-1 h-1 rounded-full mr-1.5 ${
                              trade.is_win === true 
                                ? 'bg-emerald-500' 
                                : trade.is_win === false 
                                ? 'bg-rose-500' 
                                : 'bg-amber-500'
                            }`}></span>
                            {trade.is_win === true ? '익절' : trade.is_win === false ? '청산' : '진행중'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDate(trade.entry_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {showAllSchedules && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAllSchedules(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-sm p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">📅 오늘 전체 예정 일정</h3>
              <button
                onClick={() => setShowAllSchedules(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <ul className="text-sm text-slate-800 space-y-2 max-h-96 overflow-y-auto">
              {allSchedules.map((s, i) => {
                const t = new Date(s.scheduled_time);
                const kst = new Date(t.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
                return (
                  <li key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-400 mr-2">{i + 1}.</span>
                    <span className="font-medium text-center flex-1">
                      {`${kst.getFullYear()}-${String(kst.getMonth() + 1).padStart(2, '0')}-${String(kst.getDate()).padStart(2, '0')} ${kst.getHours().toString().padStart(2, '0')}:${kst.getMinutes().toString().padStart(2, '0')}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowPasswordModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">비밀번호 확인</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border text-slate-900 border-gray-300 rounded-md mb-4"
              placeholder="비밀번호를 입력하세요"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}
// New function to handle socket messages with debug logs
function handle_socket_message(message) {
  // Assume entry_price, exit_price, qty, and pnl are calculated here
  const entry_price = message.entry_price;
  const exit_price = message.exit_price;
  const qty = message.qty;
  const pnl = message.pnl;
  const rounded_pnl = Math.round(pnl * 100) / 100;
  const is_win = pnl > 0;
  logger.debug(`🧮 진입가(entry_price): ${entry_price}`);
  logger.debug(`📤 종료가(exit_price): ${exit_price}`);
  logger.debug(`📦 체결 수량(qty): ${qty}`);
  logger.debug(`💰 계산된 손익(pnl): ${rounded_pnl}`);
  logger.debug(`🏁 승리 여부(is_win): ${is_win}`);
  logger.debug(`📤 Supabase update 준비: order_id_entry=${order_tracker[message.symbol]['entry']}`);
}