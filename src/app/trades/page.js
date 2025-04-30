'use client';
import { useState, useEffect } from 'react';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';

function formatNumber(number) {
  return new Intl.NumberFormat('ko-KR').format(number);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('ko-KR');
}

export default function TradesPage() {
  const [trades, setTrades] = useState([]);
  const [newTrade, setNewTrade] = useState({
    date: new Date().toLocaleString('sv', { timeZone: 'Asia/Seoul' }).split(' ')[0],
    startAmount: '',
    endAmount: ''
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [summary, setSummary] = useState({
    totalStartAmount: 0,
    totalEndAmount: 0,
    totalProfit: 0,
    totalProfitRate: 0
  });
  const [btcPrice, setBtcPrice] = useState(null);
  const [ethPrice, setEthPrice] = useState(null);
  const [solPrice, setSolPrice] = useState(null);
  const [xrpPrice, setXrpPrice] = useState(null);

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

      setTrades(trades);

      // 자본금 정보 계산
      const totalStartAmount = trades.reduce((sum, trade) => sum + trade.start_amount, 0);
      const totalEndAmount = trades.reduce((sum, trade) => sum + trade.end_amount, 0);
      const totalProfit = totalEndAmount - totalStartAmount;
      const totalProfitRate = (totalProfit / totalStartAmount) * 100;

      setSummary({
        totalStartAmount,
        totalEndAmount,
        totalProfit,
        totalProfitRate
      });
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
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      localStorage.setItem('authExpiry', expiryDate.toISOString());
      setShowPasswordModal(false);
      setPassword('');
      
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
    const profit = endAmount - startAmount;
    const profitRate = (profit / startAmount) * 100;

    if (editingIndex !== null) {
      const { error } = await supabase
        .from('trades')
        .update({
          date: newTrade.date,
          start_amount: startAmount,
          end_amount: endAmount,
          profit: profit,
          profit_rate: profitRate
        })
        .eq('id', trades[editingIndex].id);

      if (error) {
        showToast('거래 수정 실패', 'error');
        return;
      }
      showToast('거래가 수정되었습니다');
    } else {
      const { error } = await supabase
        .from('trades')
        .insert({
          date: newTrade.date,
          start_amount: startAmount,
          end_amount: endAmount,
          profit: profit,
          profit_rate: profitRate
        });

      if (error) {
        showToast('거래 추가 실패', 'error');
        return;
      }
      showToast('새로운 거래가 추가되었습니다');
    }

    const { data: updatedTrades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('거래 데이터 로드 실패:', fetchError);
      return;
    }

    setTrades(updatedTrades);

    // 자본금 정보 실시간 업데이트
    const totalStartAmount = updatedTrades.reduce((sum, trade) => sum + trade.start_amount, 0);
    const totalEndAmount = updatedTrades.reduce((sum, trade) => sum + trade.end_amount, 0);
    const totalProfit = totalEndAmount - totalStartAmount;
    const totalProfitRate = (totalProfit / totalStartAmount) * 100;

    setSummary({
      totalStartAmount,
      totalEndAmount,
      totalProfit,
      totalProfitRate
    });

    setNewTrade({
      date: new Date().toLocaleString('sv', { timeZone: 'Asia/Seoul' }).split(' ')[0],
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
    const { data: updatedTrades, error: fetchError } = await supabase
      .from('trades')
      .select('*')
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('거래 데이터 로드 실패:', fetchError);
      return;
    }

    setTrades(updatedTrades);

    // 자본금 정보 실시간 업데이트
    const totalStartAmount = updatedTrades.reduce((sum, trade) => sum + trade.start_amount, 0);
    const totalEndAmount = updatedTrades.reduce((sum, trade) => sum + trade.end_amount, 0);
    const totalProfit = totalEndAmount - totalStartAmount;
    const totalProfitRate = (totalProfit / totalStartAmount) * 100;

    setSummary({
      totalStartAmount,
      totalEndAmount,
      totalProfit,
      totalProfitRate
    });

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

  useEffect(() => {
    // 현재 날짜를 한국 시간으로 설정
    const updateCurrentDate = () => {
      const now = new Date();
      const koreanDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      setNewTrade(prev => ({
        ...prev,
        date: koreanDate.toISOString().split('T')[0]
      }));
    };
    
    updateCurrentDate();
  }, []);

  const handleDateChange = (newDate) => {
    const selectedDate = new Date(newDate);
    const koreanDate = new Date(selectedDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    koreanDate.setHours(0, 0, 0, 0);

    const previousTrade = trades.find(trade => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate < koreanDate;
    });

    setNewTrade({
      date: newDate,
      startAmount: previousTrade ? previousTrade.end_amount.toString() : '',
      endAmount: newTrade.endAmount
    });
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setSelectedRow(null);
    
    const now = new Date();
    const koreanDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    
    const previousTrade = trades.find(trade => {
      const tradeDate = new Date(trade.date);
      tradeDate.setHours(0, 0, 0, 0);
      return tradeDate < koreanDate;
    });

    setNewTrade({
      date: koreanDate.toISOString().split('T')[0],
      startAmount: previousTrade ? previousTrade.end_amount.toString() : '',
      endAmount: ''
    });
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

  // 코인 가격 가져오기
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [btcResponse, ethResponse, solResponse, xrpResponse] = await Promise.all([
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT'),
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT'),
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT')
        ]);

        const [btcData, ethData, solData, xrpData] = await Promise.all([
          btcResponse.json(),
          ethResponse.json(),
          solResponse.json(),
          xrpResponse.json()
        ]);

        setBtcPrice(btcData.price);
        setEthPrice(ethData.price);
        setSolPrice(solData.price);
        setXrpPrice(xrpData.price);
      } catch (error) {
        console.error('코인 가격 로드 실패:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // 10초마다 갱신

    return () => clearInterval(interval);
  }, []);

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
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF8000] to-[#FF9500] rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
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
                            className="w-[120px] bg-slate-600/90 hover:bg-slate-500/90 text-white rounded-xl p-3.5 flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-slate-500/25 h-[50px] border border-white/5"
                          >
                            취소
                          </button>
                          <div className="flex-1 flex items-center gap-3">
                            <button
                              onClick={() => requireAuth(handleAddTrade)}
                              className="flex-1 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#DB2777] hover:from-[#4338CA] hover:via-[#6D28D9] hover:to-[#BE185D] text-white rounded-xl p-3.5 flex items-center justify-center gap-2 font-medium transition-all border-none outline-none shadow-none relative overflow-hidden group"
                            >
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-shimmer"></div>
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
                              className="w-[120px] bg-rose-500/90 hover:bg-rose-600/90 text-white rounded-xl p-3.5 flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-rose-500/25 h-[50px] border border-white/5"
                            >
                              <TrashIcon className="h-5 w-5" />
                              <span>삭제</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => requireAuth(handleAddTrade)}
                          className="flex-1 bg-gradient-to-r from-[#4F46E5] via-[#7C3AED] to-[#DB2777] hover:from-[#4338CA] hover:via-[#6D28D9] hover:to-[#BE185D] text-white rounded-xl p-3.5 flex items-center justify-center gap-2 font-medium transition-all border-none outline-none shadow-none relative overflow-hidden group"
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-shimmer"></div>
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
                      <div className="overflow-hidden rounded-xl border border-[#333]">
                        <table className="min-w-full divide-y divide-[#333]">
                          <thead className="bg-gradient-to-r from-[#FF8000]/10 to-[#FF9500]/10">
                            <tr>
                              <th scope="col" className="py-4 px-6 text-left text-sm font-semibold text-white">날짜</th>
                              <th scope="col" className="py-4 px-6 text-right text-sm font-semibold text-white">시작 금액</th>
                              <th scope="col" className="py-4 px-6 text-right text-sm font-semibold text-white">종료 금액</th>
                              <th scope="col" className="py-4 px-6 text-right text-sm font-semibold text-white">수익금</th>
                              <th scope="col" className="py-4 px-6 text-right text-sm font-semibold text-white">수익률</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#333]">
                            {trades.map((trade, index) => (
                              <tr 
                                key={index} 
                                className="group/row relative hover:bg-white/5 transition-all cursor-pointer"
                                onClick={() => handleRowClick(index)}
                              >
                                <td className="py-4 px-6 text-sm text-white whitespace-nowrap">{formatDate(trade.date)}</td>
                                <td className="py-4 px-6 text-right text-sm text-white whitespace-nowrap">
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
} 