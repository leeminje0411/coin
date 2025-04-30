'use client';
import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TableCellsIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';

function formatNumber(number) {
  // 숫자를 소수점 4자리까지 계산한 후 반올림
  const roundedNumber = Math.round(number * 10000) / 10000;
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(roundedNumber);
}

function formatNumberForCopy(number) {
  return number.toString().replace(/,/g, '');
}

function formatDate(date) {
  const tradeDate = new Date(date);
  return `${tradeDate.getMonth() + 1}.${tradeDate.getDate()}`;
}

function formatPrice(price) {
  if (!price) return '-';
  return `$${Number(price).toLocaleString()}`;
}

function formatMonthYear(date) {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
}

export default function TradingJournal() {
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [trades, setTrades] = useState([]);
  const [btcPrice, setBtcPrice] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);
  const [solPrice, setSolPrice] = useState(null);
  const [xrpPrice, setXrpPrice] = useState(null);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [summary, setSummary] = useState({
    totalStartAmount: 0,
    totalEndAmount: 0,
    totalProfit: 0,
    totalProfitRate: 0
  });
  const todayKST = new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
  const [newTrade, setNewTrade] = useState({
    date: todayKST,
    startAmount: '',
    endAmount: ''
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [view, setView] = useState('table');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [leverageMultiplier, setLeverageMultiplier] = useState(1);
  const [coinPrices, setCoinPrices] = useState({
    btc: null,
    eth: null,
    sol: null,
    xrp: null
  });

  const DAILY_TARGET_RATE = 0.47; // 일일 목표 수익률

  const getTodayProfit = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrade = trades.find(trade => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate.getTime() === today.getTime();
    });

    return todayTrade ? todayTrade.profit : 0;
  };

  const getMonthlyProfit = () => {
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

  const getAverageDailyProfit = () => {
    if (trades.length === 0) return 0;
    
    const totalProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
    const firstTradeDate = new Date(trades[0].date);
    const lastTradeDate = new Date(trades[trades.length - 1].date);
    const daysDiff = Math.max(1, Math.ceil((lastTradeDate - firstTradeDate) / (1000 * 60 * 60 * 24)) + 1);
    
    return (totalProfit / daysDiff);
  };

  const getAverageDailyProfitRate = () => {
    if (trades.length === 0) return 0;
    
    // 첫 거래와 마지막 거래를 찾아 전체 수익률 계산
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstTrade = sortedTrades[0];
    const lastTrade = sortedTrades[sortedTrades.length - 1];
    
    // 전체 수익률 계산 ((최종금액 - 시작금액) / 시작금액 * 100)
    const totalProfitRate = ((lastTrade.end_amount - firstTrade.start_amount) / firstTrade.start_amount) * 100;
    
    // 거래 기간 계산 (일 수)
    const firstTradeDate = new Date(firstTrade.date);
    const lastTradeDate = new Date(lastTrade.date);
    const daysDiff = Math.max(1, Math.ceil((lastTradeDate - firstTradeDate) / (1000 * 60 * 60 * 24)) + 1);
    
    // 일평균 수익률 = 전체 수익률 / 거래 기간
    return totalProfitRate / daysDiff;
  };

  const calculateCompoundReturns = () => {
    if (trades.length === 0) return [];
    
    const dailyRate = getAverageDailyProfitRate() / 100; // 일평균 수익률을 소수점으로 변환
    const lastAmount = getLatestEndAmount(); // 마지막 종료 금액
    const months = Array.from({length: 12}, (_, i) => i + 1);
    
    return months.map(month => {
      const days = month * 30; // 한 달을 30일로 계산
      const futureAmount = lastAmount * Math.pow(1 + dailyRate, days);
      const profitAmount = futureAmount - lastAmount;
      const profitRate = (profitAmount / lastAmount) * 100;
      
      return {
        month,
        amount: futureAmount,
        profit: profitAmount,
        profitRate
      };
    });
  };

  const renderPredictionCard = (prediction) => {
    if (!prediction) return null;
    const dailyRate = getAverageDailyProfitRate();

    return (
      <div className="bg-gradient-to-br from-[#1E293B]/95 to-[#0F172A]/95 backdrop-blur-2xl rounded-xl shadow-xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">복리 수익 예측</h2>
          <button
            onClick={() => setShowPredictionModal(true)}
            className="text-xs text-white/70 hover:text-white transition-colors"
          >
            자세히 보기
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-xs text-white/50">
              현재 일평균 수익률 {dailyRate.toFixed(2)}% 기준
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 max-w-[120px]">
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-all"
                  />
                  <div className="absolute top-0 left-0 right-0 flex justify-between px-1">
                    {[1, 3, 6, 9, 12].map((month) => (
                      <div key={month} className="relative">
                        <div className="w-0.5 h-1 bg-white/20"></div>
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-[8px] text-white/50">
                          {month}M
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-white/70">{selectedMonth}개월</span>
                <span className="text-[10px] text-white/50">월 {((Math.pow(1 + dailyRate/100, 30) - 1) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xl font-bold text-white">
              {formatNumber(prediction.amount)} <span className="text-sm text-white/50">USDT</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-sm font-medium ${prediction.profitRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                +{prediction.profitRate.toFixed(2)}%
              </span>
              <span className="text-white/50">|</span>
              <span className="text-sm text-white/70">
                +{formatNumber(prediction.profit)} USDT
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPredictionModal = () => {
    const predictions = calculateCompoundReturns();
    if (!showPredictionModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-[#1E293B]/95 to-[#0F172A]/95 backdrop-blur-2xl rounded-2xl shadow-xl p-6 border border-white/5 w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">복리 수익 예측 상세 보기 🚀</h2>
            <button
              onClick={() => setShowPredictionModal(false)}
              className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((pred) => (
              <div key={pred.month} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70">{pred.month}개월 후</span>
                  <span className={`text-sm font-medium ${pred.profitRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    +{pred.profitRate.toFixed(2)}%
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {formatNumber(pred.amount)} <span className="text-sm text-white/50">USDT</span>
                </div>
                <div className="text-sm text-white/50 mt-1">
                  수익금: +{formatNumber(pred.profit)} USDT
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 실시간 가격 웹소켓 연결 (MEXC 선물 시세)
  useEffect(() => {
    const ws = new WebSocket('wss://contract.mexc.com/edge');

    ws.onopen = () => {
      console.log('WebSocket 연결 성공');

      const subscribeBTC = {
        method: "sub.deal",
        param: {
          symbol: "BTC_USDT"
        },
        id: 1
      };
      const subscribeETH = {
        method: "sub.deal",
        param: {
          symbol: "ETH_USDT"
        },
        id: 2
      };
      const subscribeSOL = {
        method: "sub.deal",
        param: {
          symbol: "SOL_USDT"
        },
        id: 3
      };
      const subscribeXRP = {
        method: "sub.deal",
        param: {
          symbol: "XRP_USDT"
        },
        id: 4
      };

      ws.send(JSON.stringify(subscribeBTC));
      ws.send(JSON.stringify(subscribeETH));
      ws.send(JSON.stringify(subscribeSOL));
      ws.send(JSON.stringify(subscribeXRP));

      // ping 메시지 전송 로직 추가
      const pingInterval = setInterval(() => {
        ws.send(JSON.stringify({ method: "ping" }));
      }, 20000);

      ws.onclose = () => {
        console.warn('WebSocket 연결 종료');
        clearInterval(pingInterval);
      };

      ws.onerror = (error) => {
        console.error('WebSocket 오류 발생:', error);
      };
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.channel === 'push.deal' && data.data) {
        const symbol = data.symbol;
        const price = parseFloat(data.data.p);

        if (symbol === 'BTC_USDT') {
          setBtcPrice(price);
          setCoinPrices(prev => ({ ...prev, btc: price }));
        }
        if (symbol === 'ETH_USDT') {
          setEthPrice(price);
          setCoinPrices(prev => ({ ...prev, eth: price }));
        }
        if (symbol === 'SOL_USDT') {
          setSolPrice(price);
          setCoinPrices(prev => ({ ...prev, sol: price }));
        }
        if (symbol === 'XRP_USDT') {
          setXrpPrice(price);
          setCoinPrices(prev => ({ ...prev, xrp: price }));
        }
      }
    };

    return () => ws.close();
  }, []);

  // 데이터 로드
  useEffect(() => {
    const fetchTrades = async () => {
      const { data: trades, error } = await supabase
        .from('trades')
        .select('*')
        .order('date', { ascending: false });

    if (error) {
        console.error('거래 데이터 로드 실패:', error);
        return;
      }

      // 날짜순으로 정렬하여 시작 자본과 현재 자본 다시 계산
      const sortedByDate = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstTrade = sortedByDate[0]; // 가장 오래된 거래
      const lastTrade = sortedByDate[sortedByDate.length - 1]; // 가장 최근 거래

      if (trades.length > 0) {
        const totalProfit = trades.reduce((sum, t) => sum + Number(t.profit), 0);
        const totalStartAmount = firstTrade.start_amount;
        const totalEndAmount = lastTrade.end_amount;
        const totalProfitRate = ((totalEndAmount - totalStartAmount) / totalStartAmount) * 100;

        setSummary({
          totalStartAmount,
          totalEndAmount,
          totalProfit,
          totalProfitRate
        });

        // 오늘 날짜의 전날 거래 찾기
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const previousTrade = trades.find(trade => {
          const tradeDate = new Date(trade.date);
          tradeDate.setHours(0, 0, 0, 0);
          return tradeDate < today;
        });

        // 전날 거래가 있으면 그 종료 금액을 시작 금액으로 설정
        if (previousTrade) {
          setNewTrade(prev => ({
            ...prev,
            startAmount: previousTrade.end_amount.toString()
          }));
        }
      }

      setTrades(trades);
    };

    fetchTrades();
  }, []);

  // 비밀번호 검증 상태 체크
  useEffect(() => {
    const authExpiry = localStorage.getItem('authExpiry');
    if (authExpiry && new Date(authExpiry) > new Date()) {
        setIsAuthenticated(true);
    }
  }, []);

  const verifyPassword = () => {
    if (password === '**Ww04110812') {
      setIsAuthenticated(true);
      // 한달 후 만료되는 타임스탬프 저장
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      localStorage.setItem('authExpiry', expiryDate.toISOString());
      setShowPasswordModal(false);
      setPassword('');
      
      // 보류 중인 작업 실행
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      alert('비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  const requireAuth = (action) => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setShowPasswordModal(true);
    }
  };

  // 토스트 표시 함수
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 2000);
  };

  const handleAddTrade = async () => {
    if (!newTrade.date || !newTrade.startAmount || !newTrade.endAmount) {
      showToast('모든 필드를 입력해주세요.', 'error');
      return;
    }

    const startAmount = parseFloat(newTrade.startAmount);
    const endAmount = parseFloat(newTrade.endAmount);

    if (editingIndex !== null) {
      // 수정
      const { error } = await supabase
        .from('trades')
        .update({
          date: newTrade.date,
          start_amount: startAmount,
          end_amount: endAmount
        })
        .eq('id', trades[editingIndex].id);

      if (error) {
        showToast('거래 수정 실패', 'error');
        return;
      }
      showToast('거래가 수정되었습니다');
    } else {
      // 새로운 거래 추가
      const { error } = await supabase
        .from('trades')
        .insert({
          date: newTrade.date,
          start_amount: startAmount,
          end_amount: endAmount
        });

      if (error) {
        showToast('거래 추가 실패', 'error');
        return;
      }
      showToast('새로운 거래가 추가되었습니다');
    }

    // 데이터 다시 로드
    const { data: updatedTrades, error: fetchError } = await supabase
      .from('trades')
        .select('*')
        .order('date', { ascending: false });

    if (fetchError) {
      console.error('거래 데이터 로드 실패:', fetchError);
      return;
    }

    setTrades(updatedTrades);
    setNewTrade({
      date: new Date().toISOString().split('T')[0],
      startAmount: '',
      endAmount: ''
    });
    setEditingIndex(null);
    setSelectedRow(null);
  };

  const handleDelete = async (index) => {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', trades[index].id);

    if (error) {
      showToast('거래 삭제 실패', 'error');
      return;
    }

    showToast('거래가 삭제되었습니다');
    // 데이터 다시 로드
    const { data: updatedTrades, error: fetchError } = await supabase
          .from('trades')
      .select('*')
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('거래 데이터 로드 실패:', fetchError);
      return;
    }

    setTrades(updatedTrades);
    setEditingIndex(null);
    setSelectedRow(null);
  };

  const handleEdit = (index) => {
    const trade = trades[index];
    setNewTrade({
      date: trade.date,
      startAmount: trade.start_amount.toString(),
      endAmount: trade.end_amount.toString()
    });
    setEditingIndex(index);
    setSelectedRow(index);
  };

  const checkAmountContinuity = (index, startAmount, endAmount) => {
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentIndex = sortedTrades.findIndex(t => t.date === trades[index].date);
    
    // 이전 거래의 종료 금액과 현재 시작 금액 비교
    if (currentIndex > 0) {
      const prevTrade = sortedTrades[currentIndex - 1];
      if (Math.abs(parseFloat(startAmount) - prevTrade.end_amount) > 0.0001) {
        return {
          isValid: false,
          message: `이전 거래의 종료 금액(${formatNumber(prevTrade.end_amount)} USDT)과 현재 시작 금액(${formatNumber(parseFloat(startAmount))} USDT)이 다릅니다.`
        };
      }
    }

    // 다음 거래의 시작 금액과 현재 종료 금액 비교
    if (currentIndex < sortedTrades.length - 1) {
      const nextTrade = sortedTrades[currentIndex + 1];
      if (Math.abs(parseFloat(endAmount) - nextTrade.start_amount) > 0.0001) {
        return {
          isValid: false,
          message: `현재 종료 금액(${formatNumber(parseFloat(endAmount))} USDT)과 다음 거래의 시작 금액(${formatNumber(nextTrade.start_amount)} USDT)이 다릅니다.`
        };
      }
    }

    return { isValid: true };
  };

  const handleDateChange = (newDate) => {
    // 선택된 날짜의 전날 거래 찾기
    const selectedDate = new Date(newDate);
    selectedDate.setHours(0, 0, 0, 0);

    // 선택된 날짜 이전의 가장 최근 거래 찾기
    const previousTrade = trades.find(trade => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate < selectedDate;
    });

    setNewTrade({
      date: newDate,
      startAmount: previousTrade ? previousTrade.end_amount.toString() : '',
      endAmount: newTrade.endAmount
    });
  };

  // 취소 버튼 추가
  const handleCancel = () => {
    setEditingIndex(null);
    setSelectedRow(null);
    
    // 오늘 날짜의 전날 거래 찾기
    const todayKST = new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const today = new Date(Date.now() + (9 * 60 * 60 * 1000));
    today.setHours(0, 0, 0, 0);
    
    const previousTrade = trades.find(trade => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate < today;
    });

    setNewTrade({
      date: todayKST,
      startAmount: previousTrade ? previousTrade.end_amount.toString() : '',
      endAmount: ''
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
            weight: 500
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          size: 13
        },
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        callbacks: {
          label: function(context) {
            if (context.dataset.label === '수익률') {
              return `수익률: ${context.parsed.y.toFixed(2)}%`;
            } else {
              return `자본금: ${formatNumber(context.parsed.y)} USDT`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 11
          },
          callback: function(value, index, ticks) {
            if (this.chart.data.datasets[0].label === '수익률') {
              return value + '%';
            } else {
              return formatNumber(value) + ' USDT';
            }
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  };

  const chartData = {
    labels: trades.map(trade => formatDate(trade.date)).reverse(),
    datasets: [
      {
        label: '수익률',
        data: trades.map(trade => trade.profit_rate).reverse(),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#3B82F6'
      },
      {
        label: '평균 수익률',
        data: trades.map(() => getAverageDailyProfitRate()),
        borderColor: '#8B5CF6',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const capitalChartData = {
    labels: trades.map(trade => formatDate(trade.date)).reverse(),
      datasets: [
        {
        label: '자본금',
        data: trades.map(trade => trade.end_amount).reverse(),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: '#8B5CF6',
        pointBorderColor: '#8B5CF6'
      }
    ]
  };

  // 달력 관련 함수들
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    let day = 1;
    
    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDayOfMonth) {
          week.push(null);
        } else if (day > daysInMonth) {
          week.push(null);
        } else {
          week.push(new Date(year, month, day++));
        }
      }
      days.push(week);
      if (day > daysInMonth) break;
    }
    
    return days;
  };

  const getProfitForDate = (date) => {
    const trade = trades.find(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getFullYear() === date.getFullYear() &&
             tradeDate.getMonth() === date.getMonth() &&
             tradeDate.getDate() === date.getDate();
    });
    return trade ? trade.profit : null;
  };

  const getMonthlyTarget = () => {
    const lastAmount = getLatestEndAmount();
    return lastAmount * 0.15; // 월 15% 목표
  };

  const getDailyTargetRate = () => {
    // 월 15% 달성을 위한 일일 수익률 계산
    // (1 + x)^n = 1.15 (여기서 x는 일일 수익률, n은 한 달 일수)
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    return (Math.pow(1.15, 1/daysInMonth) - 1) * 100; // 퍼센트로 변환
  };

  const getMonthStartAmount = (date) => {
    // 이번 달 첫 거래의 시작 금액을 찾음
    const firstTradeOfMonth = trades.find(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getMonth() === date.getMonth() && 
             tradeDate.getFullYear() === date.getFullYear();
    });
    return firstTradeOfMonth ? firstTradeOfMonth.start_amount : getLatestEndAmount();
  };

  const getRequiredDailyProfit = (date) => {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const remainingDays = Math.ceil((lastDay - date) / (1000 * 60 * 60 * 24)) + 1;
    
    // 이번 달 시작 금액
    const monthStartAmount = getMonthStartAmount(date);
    let monthlyProgress = 0;
    
    // 이번 달 1일부터 해당 날짜까지의 실제 수익 계산
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    for (let d = new Date(firstDayOfMonth); d <= date; d.setDate(d.getDate() + 1)) {
      const profit = getProfitForDate(d);
      if (profit !== null) {
        monthlyProgress += profit;
      }
    }

    // 월 목표 금액 (시작 금액의 15%)
    const monthlyTarget = monthStartAmount * 0.15;
    
    // 남은 목표 금액
    const remainingTarget = monthlyTarget - monthlyProgress;
    
    // 일일 평균 필요 수익 (남은 금액 / 남은 일수)
    const requiredDailyProfit = remainingTarget > 0 ? remainingTarget / remainingDays : 0;
    
    return {
      requiredDaily: requiredDailyProfit,
      progress: monthlyProgress,
      target: monthlyTarget,
      remaining: remainingTarget,
      progressRate: (monthlyProgress / monthlyTarget) * 100
    };
  };

  const getDailyTarget = (date) => {
    // 이번 달 시작 금액 기준으로 계산
    const monthStartAmount = getMonthStartAmount(date);
    const dailyTargetRate = getDailyTargetRate() / 100;
    return monthStartAmount * dailyTargetRate;
  };

  const getCurrentMonthProgress = () => {
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

  const getRemainingDays = () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return lastDay.getDate() - today.getDate();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // 마우스 위치 추적 함수를 수정
  const handleMouseMove = (e, index) => {
    if (hoveredRow === null) {  // 호버된 행이 없을 때만 위치 설정
      const rect = e.currentTarget.getBoundingClientRect();
      setHoveredRow(index);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRow(null);
  };

  const handleRowClick = (index) => {
    if (selectedRow === index) {
      setSelectedRow(null);
      setEditingIndex(null);
      handleCancel();
    } else {
      setSelectedRow(index);
      handleEdit(index);
    }
  };

  // 레버리지 계산 함수
  const calculateLeverage = (price) => {
    if (!price) return { division: 0, leverage: 0 };
    const divisionAmount = Math.floor(price / 40);
    const leverageAmount = Math.floor(divisionAmount * 15);
    return {
      division: divisionAmount,
      leverage: leverageAmount
    };
  };

  // 선택된 코인의 가격 가져오기
  const getSelectedCoinPrice = () => {
    switch (selectedCoin) {
      case 'BTC': return btcPrice;
      case 'ETH': return ethPrice;
      case 'SOL': return solPrice;
      case 'XRP': return xrpPrice;
      default: return btcPrice;
    }
  };

  // 최근 종료 금액 가져오기
  const getLatestEndAmount = () => {
    if (trades.length === 0) return 0;
    return trades[0].end_amount;
  };

  const getTradeForDate = (date) => {
    return trades.find(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getFullYear() === date.getFullYear() &&
             tradeDate.getMonth() === date.getMonth() &&
             tradeDate.getDate() === date.getDate();
    });
  };

  const getDailyTargetInfo = (date) => {
    const trade = getTradeForDate(date);
    if (!trade) return null;

    const targetProfit = trade.start_amount * (DAILY_TARGET_RATE / 100);
    const actualProfit = trade.profit;
    const profitDiff = actualProfit - targetProfit;
    const profitRate = (actualProfit / trade.start_amount) * 100;
    const remainingTarget = profitDiff < 0 ? Math.abs(profitDiff) : 0;

    return {
      startAmount: trade.start_amount,
      endAmount: trade.end_amount,
      targetProfit,
      actualProfit,
      profitDiff,
      profitRate,
      remainingTarget,
      isAboveTarget: profitRate >= DAILY_TARGET_RATE
    };
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(formatNumberForCopy(text)).then(() => {
      showToast('진입금액이 클립보드에 복사되었습니다');
    }).catch(() => {
      showToast('복사에 실패했습니다', 'error');
    });
  };

  const getLeverageAmount = () => {
    return Math.floor(calculateLeverage(getLatestEndAmount()).leverage * leverageMultiplier);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* 토스트 알림 */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}>
        <div className={`px-6 py-3 rounded-xl shadow-lg backdrop-blur-xl border ${
          toast.type === 'error' 
            ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      </div>

      {/* 비밀번호 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#1E293B]/95 to-[#0F172A]/95 backdrop-blur-2xl rounded-2xl shadow-xl p-6 border border-white/5 w-[90%] max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">비밀번호 확인</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              placeholder="비밀번호를 입력하세요"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingAction(null);
                  setPassword('');
                }}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                취소
              </button>
              <button
                onClick={verifyPassword}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        <div className="flex-1 min-w-0">
          <Navigation 
            summary={summary}
            btcPrice={btcPrice}
            ethPrice={ethPrice}
            solPrice={solPrice}
            xrpPrice={xrpPrice}
          />
          <div className="p-8">
            <main>
              {/* 영감 메시지 티커 */}
              <div className="mb-8 overflow-hidden bg-[#1a1a1a] rounded-2xl border border-[#333]">
                <div className="animate-ticker whitespace-nowrap py-4">
                  <div className="inline-block">
                    {[
                      "💀 이 돈 깨지면 너 인생 끝이다. 0.47%만 하면 1년 뒤 1억인데 왜 무리하냐?",
                      "🔥 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "⚡️ 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "💪 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "🎯 0.47%만 하면 1년 뒤 1억인데 왜 무리해서 도박하냐?",
                      "💥 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "⚔️ 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "💢 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "🎪 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "💣 이 돈 깨지면 너 인생 끝이다. 0.47%만 하면 1년 뒤 1억인데 왜 무리하냐?",
                      "👊 이 돈이 너의 마지막 기회다. 0.47%만 하면 1년 뒤 1억인데 왜 무리하냐?",
                      "💀 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "🔥 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?","뒷바라지하는 엄마, 아빠를 봐라. 그래도 도박할래?",
                      "⚡️ 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "💪 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 병신짓하냐?",
                      "🎯 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "�� 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "⚔️ 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "💢 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "🎪 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "💣 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "👊 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "💀 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "🔥 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "⚡️ 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "💪 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "🎯 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "💥 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "⚔️ 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "💢 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "🎪 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "💣 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "👊 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "💀 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "🔥 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "⚡️ 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "💪 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "🎯 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "💥 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "⚔️ 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "💢 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "🎪 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "💣 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "👊 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "�� 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "🔥 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "⚡️ 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "💪 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "🎯 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "💥 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "⚔️ 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?",
                      "💢 손가락이 근질거리면 손목을 자르든가 해라. 이 돈이 너의 마지막 기회다",
                      "🎪 6달 뒤면 제네시스 한대 뽑는데 그걸 못 참아? 손가락이 근질거리냐?",
                      "💣 0.47%만 하면 무조건 이기는 게임인데 왜 도박하냐?",
                      "👊 이 돈 깨지면 너는 다시는 일어설 수 없다. 0.47%만 하면 되는데 왜 무리하냐?"
                    ].map((message, index) => (
                      <span key={index} className="inline-block mx-8 text-white/70">
                        {message}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 복리 수익 예측 카드 */}
              <div className="mb-8">
                {trades.length > 0 ? (
                  renderPredictionCard(calculateCompoundReturns()[selectedMonth - 1])
                ) : (
                  <div className="bg-[#1a1a1a] rounded-2xl shadow-xl p-6 border border-[#333] w-full">
                    <div className="flex items-center justify-center">
                      <span className="text-white/70">거래 데이터가 없습니다.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 복리 수익 예측 모달 */}
              {renderPredictionModal()}

              {/* 레버리지 계산 섹션 */}
              <div className="relative group mb-8">
                <div className="relative bg-[#1a1a1a] rounded-2xl shadow-xl p-6 border border-[#333]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-[#FF8000]/20 to-[#FF9500]/20 rounded-xl">
                        <ArrowTrendingUpIcon className="w-6 h-6 text-[#FF8000]" />
                      </div>
                      <h2 className="text-xl font-bold text-white">진입금액</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map((multiplier) => (
                          <button
                            key={multiplier}
                            onClick={() => setLeverageMultiplier(multiplier)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              leverageMultiplier === multiplier
                                ? 'bg-[#FF8000] text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {multiplier}x
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCopyToClipboard(getLeverageAmount())}
                        className="px-4 py-2 bg-[#FF8000] text-white rounded-lg hover:bg-[#FF9500] transition-all flex items-center gap-2"
                      >
                        <span>클릭하여 복사하기</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[#FF8000]">
                    {formatNumber(getLeverageAmount())} <span className="text-sm text-white/50">USDT</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* 거래 기록과 캘린더 */}
                <div className="space-y-8">
                  {/* 거래 기록 */}
                  <div className="relative group">
                    <div className="relative bg-[#1a1a1a] rounded-2xl shadow-xl p-6 border border-[#333]">
                      <h2 className="text-xl font-bold text-white mb-6">거래 기록</h2>
                      
                      {/* 거래 입력 폼 */}
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">날짜</label>
                            <input
                              type="date"
                              value={newTrade.date}
                              onChange={(e) => handleDateChange(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all h-[50px]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">시작 금액</label>
                            <input
                              type="number"
                              placeholder="시작 금액"
                              value={newTrade.startAmount}
                              onChange={(e) => setNewTrade({ ...newTrade, startAmount: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all h-[50px]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white/70 mb-2">종료 금액</label>
                            <input
                              type="number"
                              placeholder="종료 금액"
                              value={newTrade.endAmount}
                              onChange={(e) => setNewTrade({ ...newTrade, endAmount: e.target.value })}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all h-[50px]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {editingIndex !== null ? (
                            <>
                              <button
                                onClick={handleCancel}
                                className="w-[120px] bg-slate-600/90 hover:bg-slate-500/90 text-white rounded-xl p-3.5 flex items-center justify-center gap-2 font-medium transition-all h-[50px] border border-white/5 relative z-10"
                              >
                                취소
                              </button>
                              <div className="flex-1 flex items-center gap-3">
                                <button
                                  onClick={() => requireAuth(handleAddTrade)}
                                  className="flex-1 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#DB2777] hover:from-[#4338CA] hover:via-[#6D28D9] hover:to-[#BE185D] text-white rounded-xl p-3.5 flex items-center justify-center gap-2 font-medium transition-all border-none outline-none"
                                >
                                  <div className="relative flex items-center justify-center gap-2">
                                    <PencilIcon className="h-5 w-5" />
                                    <span>수정</span>
                                  </div>
                                </button>
                                <button
                                  onClick={() => requireAuth(() => {
                                    if (confirm('정말로 이 거래를 삭제하시겠습니까?')) {
                                      handleDelete(editingIndex);
                                      handleCancel();
                                    }
                                  })}
                                  className="w-[120px] bg-rose-500/90 hover:bg-rose-600/90 text-white rounded-xl p-3.5 flex items-center justify-center gap-2 font-medium transition-all h-[50px] border border-white/5"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                  <span>삭제</span>
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              onClick={() => requireAuth(handleAddTrade)}
                              className="flex-1 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#DB2777] hover:from-[#4338CA] hover:via-[#6D28D9] hover:to-[#BE185D] text-white rounded-xl p-3.5 flex items-center justify-center gap-2 font-medium transition-all border-none outline-none"
                            >
                              <div className="relative flex items-center justify-center gap-2">
                                <PlusIcon className="h-5 w-5" />
                                <span>추가</span>
                              </div>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 거래 기록 테이블 */}
                      <div className="mt-8 overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                          <div className="overflow-hidden rounded-xl border border-white/10">
                            <table className="min-w-full divide-y divide-white/10">
                              <thead className="bg-[#1a1a1a]">
                                <tr>
                                  <th scope="col" className="py-4 px-6 text-left text-sm font-semibold text-white">날짜</th>
                                  <th scope="col" className="py-4 px-6 text-right text-sm font-semibold text-white hidden">시작 금액</th>
                                  <th scope="col" className="py-4 px-6 text-right text-sm font-semibold text-white">종료 금액</th>
                                  <th scope="col" className="py-4 px-6 text-right text-sm font-semibold text-white">수익금</th>
                                  <th scope="col" className="py-4 px-6 text-right text-sm font-semibold text-white">수익률</th>
                                  <th scope="col" className="py-4 px-6 text-center text-sm font-semibold text-white">작업</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {trades.map((trade, index) => (
                                  <tr 
                                    key={index} 
                                    className="group/row relative hover:bg-white/5 transition-all cursor-pointer"
                                    onClick={() => handleRowClick(index)}
                                  >
                                    <td className="py-4 px-6 text-sm text-white whitespace-nowrap">{formatDate(trade.date)}</td>
                                    <td className="py-4 px-6 text-right text-sm text-white whitespace-nowrap hidden">
                                      {formatNumber(trade.start_amount)} <span className="text-xs text-white/70">USDT</span>
                                    </td>
                                    <td className="py-4 px-6 text-right text-sm text-white whitespace-nowrap">
                                      {formatNumber(trade.end_amount)} <span className="text-xs text-white/70">USDT</span>
                                    </td>
                                    <td className={`py-4 px-6 text-right text-sm whitespace-nowrap ${
                                      trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                      {formatNumber(trade.profit)} <span className="text-xs opacity-70">USDT</span>
                                    </td>
                                    <td className={`py-4 px-6 text-right text-sm whitespace-nowrap ${
                                      trade.profit_rate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                      {trade.profit_rate.toFixed(2)}%
                                    </td>
                                    <td className="py-4 px-6 text-center whitespace-nowrap"></td>
                                  </tr>
                                ))}
                                <tr className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 font-bold">
                                  <td className="py-4 px-6 text-sm text-white">합계</td>
                                  <td className="py-4 px-6 text-right text-sm text-white">
                                    {formatNumber(summary.totalStartAmount)} <span className="text-xs text-white/70">USDT</span>
                                  </td>
                                  <td className="py-4 px-6 text-right text-sm text-white">
                                    {formatNumber(summary.totalEndAmount)} <span className="text-xs text-white/70">USDT</span>
                                  </td>
                                  <td className={`py-4 px-6 text-right text-sm ${
                                    summary.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                    {formatNumber(summary.totalProfit)} <span className="text-xs opacity-70">USDT</span>
                                  </td>
                                  <td className={`py-4 px-6 text-right text-sm ${
                                    summary.totalProfitRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                    {summary.totalProfitRate.toFixed(2)}%
                                  </td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 캘린더 */}
                  <div className="relative group">
                    <div className="relative bg-[#1a1a1a] rounded-2xl shadow-xl p-6 border border-[#333]">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <h2 className="text-xl font-bold text-white">월별 거래 현황</h2>
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                          <button
                            onClick={handlePrevMonth}
                            className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          <span className="text-base font-medium text-white min-w-[120px] text-center">
                            {formatMonthYear(currentMonth)}
                          </span>
                          <button
                            onClick={handleNextMonth}
                            className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-px bg-white/10 rounded-xl overflow-hidden">
                        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                          <div key={day} className="p-2 md:p-3 text-center text-xs md:text-sm font-medium text-white/70 bg-white/5">
                            {day}
                          </div>
                        ))}
                        
                        {getDaysInMonth(currentMonth).map((week, weekIndex) => 
                          week.map((date, dayIndex) => {
                            if (!date) return (
                              <div key={`empty-${weekIndex}-${dayIndex}`} className="p-1.5 md:p-3 bg-white/5 h-[8rem] md:h-[10rem]" />
                            );

                            const profit = getProfitForDate(date);
                            const isToday = new Date().toDateString() === date.toDateString();
                            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                            const dailyTarget = getDailyTarget(date);
                            const dailyTargetRate = getDailyTargetRate();
                            const requiredInfo = getRequiredDailyProfit(date);
                            
                            return (
                              <div
                                key={`day-${weekIndex}-${dayIndex}`}
                                className={`p-2 md:p-3 bg-white/5 transition-all hover:bg-white/10 group h-[8rem] md:h-[10rem] ${
                                  isToday ? 'ring-2 ring-blue-500' : ''
                                }`}
                              >
                                <div className="flex flex-col h-full">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm md:text-base font-medium ${
                                      isToday ? 'text-blue-400' : 'text-white/70'
                                    }`}>
                                      {date.getDate()}
                                    </span>
                                  </div>
                                  {isCurrentMonth && (() => {
                                    const dailyInfo = getDailyTargetInfo(date);
                                    if (!dailyInfo) {
                                      return (
                                        <div className="mt-2 md:mt-3 space-y-1.5">
                                          <div className="text-[10px] md:text-xs text-white/50">
                                            거래 없음
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="mt-2 md:mt-3 space-y-1.5">
                                        <div className={`text-xs md:text-sm font-medium ${
                                          dailyInfo.actualProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                        } opacity-70 group-hover:opacity-100 transition-opacity`}>
                                          {dailyInfo.actualProfit >= 0 ? '+' : ''}{formatNumber(dailyInfo.actualProfit)} USDT
                                        </div>
                                        <div className="text-[10px] md:text-xs text-white/50 flex justify-between">
                                          <span>목표(0.47%):</span>
                                          <span>{formatNumber(dailyInfo.targetProfit)} USDT</span>
                                        </div>
                                        <div className="text-[10px] md:text-xs text-white/50 flex justify-between">
                                          <span>실제 수익률:</span>
                                          <span className={dailyInfo.profitRate >= DAILY_TARGET_RATE ? 'text-emerald-400' : 'text-rose-400'}>
                                            {dailyInfo.profitRate.toFixed(2)}%
                                          </span>
                                        </div>
                                        {!dailyInfo.isAboveTarget && (
                                          <div className="text-[10px] md:text-xs text-rose-400 flex justify-between">
                                            <span>부족액:</span>
                                            <span>{formatNumber(dailyInfo.remainingTarget)} USDT</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
            <Footer 
              btcPrice={btcPrice}
              ethPrice={ethPrice}
              solPrice={solPrice}
              xrpPrice={xrpPrice}
            />
          </div>
        </div>
        <div className="w-[400px] flex-shrink-0 bg-[#1a1a1a] min-h-screen">
          <Sidebar summary={summary} trades={trades} />
        </div>
      </div>
    </div>
  );
}