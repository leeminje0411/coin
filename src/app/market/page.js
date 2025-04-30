'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// 차트 데이터 생성 헬퍼 함수
const generateChartData = (basePrice, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const data = Array.from({ length: days }).map((_, index) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + index);
    
    // 일별 변동폭을 더 현실적으로 조정 (0.5% 내외)
    const dailyChange = basePrice * (0.005 * (Math.random() - 0.5));
    return {
      date: date.toISOString().split('T')[0],
      price: basePrice + dailyChange
    };
  });

  return {
    dates: data.map(d => d.date),
    prices: data.map(d => d.price),
    sma: calculateSMA(data.map(d => d.price), 7)
  };
};

const calculateSMA = (prices, period = 30) => {
  if (!prices || prices.length === 0) return [];
  
  const sma = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(null);
      continue;
    }
    
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
};

const PriceChart = ({ symbol, historicalData }) => {
  if (!historicalData || !historicalData.dates || !historicalData.prices) {
    return <div className="h-[40px] flex items-center justify-center text-xs">로딩중...</div>;
  }

  const data = {
    labels: historicalData.dates,
    datasets: [
      {
        label: '종가',
        data: historicalData.prices,
        borderColor: '#FF8000',
        backgroundColor: 'rgba(255, 128, 0, 0.1)',
        tension: 0.3,
        fill: true,
        borderWidth: 1.5,
        pointRadius: 0
      },
      {
        label: '7일 이동평균선',
        data: historicalData.sma,
        borderColor: '#FFFFFF',
        tension: 0.3,
        fill: false,
        borderDash: [2, 2],
        borderWidth: 1,
        pointRadius: 0
      }
    ]
  };

  const options = {
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FF8000',
        bodyColor: '#FFFFFF',
        borderColor: '#333333',
        borderWidth: 1,
        padding: 8,
        displayColors: false,
        callbacks: {
          title: () => '',
          label: (context) => context.parsed.y.toFixed(2)
        }
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false,
        grace: '5%'
      }
    }
  };

  return (
    <div className="h-[40px]">
      <Line data={data} options={options} />
    </div>
  );
};

// 임시 데이터 생성 함수
const generateMarketData = () => {
  const indices = [
    { 
      symbol: 'DJI',
      name: '다우존스',
      price: 38563.80,
      change: -0.32,
      changeAmount: -124.35,
      type: 'index'
    },
    { 
      symbol: 'SPX', 
      name: 'S&P 500', 
      price: 4958.61, 
      change: -0.28, 
      changeAmount: -13.83,
      type: 'index'
    },
    { 
      symbol: 'IXIC',
      name: '나스닥',
      price: 15509.90,
      change: -0.56,
      changeAmount: -87.56,
      type: 'index'
    },
    { 
      symbol: 'RUT',
      name: '러셀 2000',
      price: 1961.62,
      change: -0.89,
      changeAmount: -17.63,
      type: 'index'
    },
    { 
      symbol: 'FTSE', 
      name: 'FTSE 100', 
      price: 7612.86, 
      change: -0.82, 
      changeAmount: -62.87,
      type: 'index'
    },
    { 
      symbol: 'DAX', 
      name: 'DAX', 
      price: 16921.96, 
      change: 0.35, 
      changeAmount: 59.11,
      type: 'index'
    },
    { 
      symbol: 'FCHI',
      name: 'CAC 40',
      price: 7589.96,
      change: -0.16,
      changeAmount: -12.23,
      type: 'index'
    },
    { 
      symbol: 'N225',
      name: '닛케이',
      price: 36897.42,
      change: 0.91,
      changeAmount: 332.14,
      type: 'index'
    },
    { 
      symbol: 'HSI', 
      name: '항셍', 
      price: 15386.96, 
      change: -2.16, 
      changeAmount: -339.38,
      type: 'index'
    },
    { 
      symbol: '000001.SS',
      name: '상해종합',
      price: 2865.90,
      change: -1.98,
      changeAmount: -57.86,
      type: 'index'
    },
    { 
      symbol: 'KS11',
      name: 'KOSPI',
      price: 2576.20,
      change: -0.95,
      changeAmount: -24.71,
      type: 'index'
    },
    { 
      symbol: 'KQ11',
      name: 'KOSDAQ',
      price: 842.83,
      change: -1.28,
      changeAmount: -10.93,
      type: 'index'
    }
  ];

  const stocks = [
    {
      symbol: 'AAPL',
      name: '애플',
      price: 182.52,
      change: -0.76,
      changeAmount: -1.40,
      type: 'stock'
    },
    {
      symbol: 'MSFT',
      name: '마이크로소프트',
      price: 404.87,
      change: 1.56,
      changeAmount: 6.23,
      type: 'stock'
    },
    {
      symbol: 'GOOGL',
      name: '알파벳',
      price: 143.96,
      change: 0.48,
      changeAmount: 0.69,
      type: 'stock'
    },
    {
      symbol: 'AMZN',
      name: '아마존',
      price: 169.51,
      change: 0.98,
      changeAmount: 1.64,
      type: 'stock'
    },
    {
      symbol: 'NVDA',
      name: '엔비디아',
      price: 721.28,
      change: 2.46,
      changeAmount: 17.32,
      type: 'stock'
    },
    {
      symbol: 'META',
      name: '메타',
      price: 468.11,
      change: 1.23,
      changeAmount: 5.69,
      type: 'stock'
    },
    {
      symbol: 'BRK.A',
      name: '버크셔 해서웨이',
      price: 552847,
      change: -0.12,
      changeAmount: -663.42,
      type: 'stock'
    },
    {
      symbol: 'TSLA',
      name: '테슬라',
      price: 193.57,
      change: -2.76,
      changeAmount: -5.49,
      type: 'stock'
    },
    {
      symbol: 'V',
      name: '비자',
      price: 278.56,
      change: 0.47,
      changeAmount: 1.30,
      type: 'stock'
    },
    {
      symbol: 'JPM',
      name: 'JP모건',
      price: 183.99,
      change: 0.85,
      changeAmount: 1.55,
      type: 'stock'
    },
    {
      symbol: 'WMT',
      name: '월마트',
      price: 170.36,
      change: 0.32,
      changeAmount: 0.54,
      type: 'stock'
    },
    {
      symbol: 'JNJ',
      name: '존슨앤존슨',
      price: 156.76,
      change: -0.45,
      changeAmount: -0.71,
      type: 'stock'
    }
  ];

  return { indices, stocks };
};

const fetchMarketData = async () => {
  try {
    console.log('API 서버에서 실데이터 가져오기 시도 중...');
    const response = await axios.get('/api/market-data');
    const data = response.data;
    
    if (!data || data.length === 0) {
      console.log('API 데이터가 없거나 잘못됨, 임시 데이터 사용');
      return generateMarketData();
    }
    
    // API 응답이 배열인 경우 (이전 형식)
    if (Array.isArray(data)) {
      return generateMarketData(); // 임시 데이터 사용
    }
    
    // API 응답이 이미 올바른 형식인 경우
    if (data.indices && data.stocks) {
      return {
        indices: data.indices.map(item => ({
          ...item,
          price: Number(item.price) || 0,
          change: Number(item.change) || 0,
          changeAmount: Number(item.changeAmount) || 0
        })),
        stocks: data.stocks.map(item => ({
          ...item,
          price: Number(item.price) || 0,
          change: Number(item.change) || 0,
          changeAmount: Number(item.changeAmount) || 0
        }))
      };
    }
    
    // 기본적으로 임시 데이터 반환
    return generateMarketData();
  } catch (error) {
    console.error('실데이터 API 호출 실패:', error);
    return generateMarketData();
  }
};

// 레버리지 계산 함수 추가
const calculateLeverage = (price) => {
  const divisionAmount = price / 40; // 1/40 분할
  const leverageAmount = divisionAmount * 15; // 15배 레버리지
  return {
    division: divisionAmount.toFixed(2),
    leverage: leverageAmount.toFixed(2)
  };
};

export default function MarketDashboard() {
  const [marketData, setMarketData] = useState({ indices: [], stocks: [] });
  const [sectorData, setSectorData] = useState([]);
  const [historicalData, setHistoricalData] = useState({});
  const [showSoundMessage, setShowSoundMessage] = useState(true);
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [showStocks, setShowStocks] = useState(false);

  const channels = [
    {
      id: 'iEpJwprxDdk',
      title: 'Bloomberg TV'
    },
    {
      id: 'KQp-e_XQnDE',
      title: 'Yahoo Finance'
    },
    {
      id: '9NyxcX3rhQs',
      title: 'CNBC'
    }
  ];

  const nextChannel = () => {
    setCurrentChannelIndex((prev) => (prev + 1) % channels.length);
  };

  const prevChannel = () => {
    setCurrentChannelIndex((prev) => (prev - 1 + channels.length) % channels.length);
  };

  const fetchNewsData = async () => {
    try {
      const response = await fetch('/api/news-data');
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setNewsData(data);
      }
    } catch (error) {
      console.error('뉴스 데이터 가져오기 실패:', error);
    }
  };

  const fetchSectorData = async () => {
    // 임시 섹터 데이터
    return [
      { name: '정보기술', change: (Math.random() - 0.5) * 2 },
      { name: '금융', change: (Math.random() - 0.5) * 2 },
      { name: '에너지', change: (Math.random() - 0.5) * 2 },
      { name: '헬스케어', change: (Math.random() - 0.5) * 2 },
      { name: '소재', change: (Math.random() - 0.5) * 2 },
      { name: '통신서비스', change: (Math.random() - 0.5) * 2 },
      { name: '필수소비재', change: (Math.random() - 0.5) * 2 },
      { name: '산업재', change: (Math.random() - 0.5) * 2 }
    ];
  };

  // 현재 시간 업데이트
  useEffect(() => {
    // 초기 시간 설정
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // 시간 포맷팅 함수
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatTimeWithTimezone = (date, offsetHours = 0) => {
    if (!date) return '';
    const newDate = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
    return newDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // 뉴스 데이터 업데이트
  useEffect(() => {
    fetchNewsData();
    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => (prevIndex + 1) % newsData.length);
    }, 5000); // 5초마다 다음 뉴스로 전환

    return () => clearInterval(interval);
  }, [newsData.length]);

  // 15초마다 지수/주식 전환
  useEffect(() => {
    const timer = setInterval(() => {
      setShowStocks(prev => !prev);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const market = await fetchMarketData();
        setMarketData(market);
        setSectorData(await fetchSectorData());

        const historicalObj = {};
        market.indices.forEach((item) => {
          historicalObj[item.symbol] = generateChartData(item.price);
        });
        market.stocks.forEach((item) => {
          historicalObj[item.symbol] = generateChartData(item.price);
        });
        setHistoricalData(historicalObj);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* 메인 네비게이션 */}
      <div className="h-14 bg-[#121212] border-b border-gray-800 flex items-center px-6">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-4">
            <span className="text-[#FF8000] font-bold text-2xl tracking-tighter">bloomberg</span>
          </div>
          <div className="flex items-center space-x-8 text-sm">
            <button className="text-white hover:text-[#FF8000]">시장</button>
            <button className="text-white hover:text-[#FF8000]">기술</button>
            <button className="text-white hover:text-[#FF8000]">정치</button>
            <button className="text-white hover:text-[#FF8000]">경제</button>
            <button className="text-white hover:text-[#FF8000]">산업</button>
            <button className="text-white hover:text-[#FF8000]">오피니언</button>
            <button className="text-white hover:text-[#FF8000]">비즈니스</button>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-6">
          <div className="flex items-center space-x-4 text-sm">
            <button className="text-white hover:text-[#FF8000]">로그인</button>
            <button className="text-white hover:text-[#FF8000]">구독하기</button>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-[#FF8000]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="text-gray-300 hover:text-[#FF8000]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 상단 정보 섹션 */}
      <div className="bg-[#0A0A14] p-4">
        {/* 첫 번째 줄: 잔고 및 코인 정보 */}
        <div className="flex items-center space-x-4 mb-6">
          {/* 로고 */}
          <div className="w-12 h-12 bg-[#8A63FB] rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          </div>

          {/* 시작 자본 */}
          <div className="bg-[#0F1421] rounded-xl p-3 flex items-center space-x-3">
            <div className="bg-[#1C2231] rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#3B82F6]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-400">시작 자본</div>
              <div className="text-white font-bold">12,687.511 <span className="text-gray-400 text-sm">USDT</span></div>
            </div>
          </div>

          {/* 현재 자본 */}
          <div className="bg-[#0F1421] rounded-xl p-3 flex items-center space-x-3">
            <div className="bg-[#1C2231] rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#8B5CF6]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-400">현재 자본</div>
              <div className="text-white font-bold">12,866.216 <span className="text-gray-400 text-sm">USDT</span></div>
            </div>
          </div>

          {/* 코인 정보들 */}
          <div className="flex-1 flex items-center justify-end space-x-4">
            <div className="flex items-center space-x-2">
              <img src="/bitcoin.svg" alt="Bitcoin" className="w-8 h-8" />
              <div>
                <div className="text-xs text-gray-400">Bitcoin</div>
                <div className="text-white">$94,632.7 <span className="text-sm">USDT</span></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <img src="/ethereum.svg" alt="Ethereum" className="w-8 h-8" />
              <div>
                <div className="text-xs text-gray-400">Ethereum</div>
                <div className="text-white">$1,801.56 <span className="text-sm">USDT</span></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <img src="/solana.svg" alt="Solana" className="w-8 h-8" />
              <div>
                <div className="text-xs text-gray-400">Solana</div>
                <div className="text-white">$147.27 <span className="text-sm">USDT</span></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <img src="/ripple.svg" alt="Ripple" className="w-8 h-8" />
              <div>
                <div className="text-xs text-gray-400">Ripple</div>
                <div className="text-white">$2.239 <span className="text-sm">USDT</span></div>
              </div>
            </div>
          </div>

          {/* 설정 아이콘 */}
          <div className="w-12 h-12 bg-[#8A63FB] rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* 두 번째 줄: 수익 정보 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0F1421] rounded-xl p-4 border-l-4 border-[#10B981]">
            <div className="flex items-center space-x-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#10B981]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <span className="text-gray-400">총 수익</span>
            </div>
            <div className="text-[#10B981] text-2xl font-bold">178.705 <span className="text-sm">USDT</span></div>
          </div>

          <div className="bg-[#0F1421] rounded-xl p-4 border-l-4 border-[#3B82F6]">
            <div className="flex items-center space-x-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#3B82F6]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-400">총 수익률</span>
            </div>
            <div className="text-[#3B82F6] text-2xl font-bold">1.41%</div>
          </div>

          <div className="bg-[#0F1421] rounded-xl p-4 border-l-4 border-[#8B5CF6]">
            <div className="flex items-center space-x-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#8B5CF6]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-400">오늘의 수익</span>
            </div>
            <div className="text-[#8B5CF6] text-2xl font-bold">43.491 <span className="text-sm">USDT</span></div>
          </div>

          <div className="bg-[#0F1421] rounded-xl p-4 border-l-4 border-[#EC4899]">
            <div className="flex items-center space-x-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#EC4899]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-400">이번 달 수익</span>
            </div>
            <div className="text-[#EC4899] text-2xl font-bold">178.705 <span className="text-sm">USDT</span></div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex">
        {/* 왼쪽: TV 화면 (50%) */}
        <div className="w-[50%] bg-black flex flex-col">
          {/* 비디오 섹션 */}
          <div className="h-[500px] relative overflow-hidden bg-black">
            <div className="absolute inset-0">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${channels[currentChannelIndex].id}?autoplay=1&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Top News 섹션 */}
          <div className="h-[60px] bg-black flex items-center">
            <div className="w-[140px] h-full bg-[#1C1C1C] flex items-center justify-center">
              <span className="text-white font-bold text-xl">Top News</span>
            </div>
            <div className="flex-1 bg-black h-full flex items-center overflow-hidden">
              <div className="animate-marquee text-white text-xl font-bold px-4">
                Quarter Orders Beat Estimates on Strong China Demand • Asian Currencies Lift Emerging Markets • Conflict Signed by Trump
              </div>
            </div>
          </div>

          {/* 채널 컨트롤 */}
          <div className="h-12 bg-[#1C1C1C] flex items-center justify-between px-4">
            <button onClick={prevChannel} className="text-gray-400 hover:text-[#FF8000]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-white text-sm">{channels[currentChannelIndex].title}</span>
            <button onClick={nextChannel} className="text-gray-400 hover:text-[#FF8000]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 중앙: 뉴스 리스트 (30%) */}
        <div className="w-[30%] bg-[#121212] border-l border-r border-gray-800 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-[#FF8000] text-lg font-bold mb-4">최신 뉴스</h2>
            {newsData.map((news, index) => (
              <div key={news.id} className="mb-6 border-b border-gray-800 pb-4 last:border-b-0">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-bold mb-2">{news.title}</h3>
                    <p className="text-gray-400 text-sm mb-2">{news.summary}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="bg-[#FF8000] text-black px-2 py-0.5 rounded mr-2">{news.category}</span>
                      <span>{new Date(news.datetime).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 시장 데이터 패널 (20%) */}
        <div className="w-[20%] bg-black flex flex-col">
          {/* 레버리지 계산 섹션 */}
          <div className="bg-[#1C1C1C] border-b border-gray-800">
            <div className="p-4">
              <div className="text-[#FF8000] font-bold mb-2">레버리지 계산</div>
              {showStocks ? marketData.stocks[0] : marketData.indices[0] && (
                <div className="bg-black rounded p-3">
                  <div className="text-sm text-white mb-2">
                    {showStocks ? marketData.stocks[0].name : marketData.indices[0].name}
                    <span className="text-gray-400 ml-2">
                      {showStocks ? marketData.stocks[0].price.toFixed(2) : marketData.indices[0].price.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">1/40 분할:</span>
                      <span className="text-white font-mono">
                        {(showStocks ? marketData.stocks[0].price : marketData.indices[0].price / 40).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">15x 레버리지:</span>
                      <span className="text-[#FF8000] font-mono">
                        {(showStocks ? marketData.stocks[0].price : marketData.indices[0].price / 40 * 15).toFixed(2)} USDT
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 시장 데이터 헤더 */}
          <div className="h-10 bg-[#1C1C1C] flex items-center justify-between px-4 border-b border-gray-800">
            <span className="text-[#FF8000] font-bold">
              {showStocks ? '주요 기업' : '글로벌 지수'}
            </span>
          </div>

          {/* 시장 데이터 목록 */}
          <div className="flex-1 overflow-y-auto">
            {(showStocks ? marketData.stocks : marketData.indices).map((item) => (
              <div key={item.symbol} className="h-[85px] border-b border-gray-800 fade-enter">
                <div className="p-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[#FF8000] text-xs font-bold">{item.name}</span>
                    <span className={`text-xs ${item.change >= 0 ? 'text-[#00B061]' : 'text-[#FF3B30]'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-mono">{item.price.toFixed(2)}</span>
                    <span className={`text-xs ${item.change >= 0 ? 'text-[#00B061]' : 'text-[#FF3B30]'}`}>
                      {item.changeAmount >= 0 ? '+' : ''}{item.changeAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-[40px] mt-1">
                    <PriceChart symbol={item.symbol} historicalData={historicalData[item.symbol]} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단: 실시간 뉴스 티커 */}
      <div className="h-12 bg-[#0A0A0A] border-t border-gray-800 flex items-center">
        <div className="flex items-center w-[120px] h-full bg-[#00B061] px-4">
          <span className="font-bold text-white">{newsData[0]?.category || '뉴스'}</span>
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap px-4">
          <div className="animate-marquee flex items-center">
            {newsData.map((news, index) => (
              <div key={news.id} className="flex items-center">
                <span className="text-white">{news.title}</span>
                {index < newsData.length - 1 && <span className="mx-4 text-gray-500">|</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="w-[300px] px-4">
          <div className="flex justify-between items-center">
            <div className="text-white">다음 일정</div>
            {currentTime && (
              <div className="text-sm text-gray-400">{formatTimeWithTimezone(currentTime)} ET</div>
            )}
          </div>
          {currentTime && (
            <div className="text-sm text-[#FF8000]">
              {`${formatTimeWithTimezone(currentTime)} NY | ${formatTimeWithTimezone(currentTime, 5)} UK | ${formatTimeWithTimezone(currentTime, 12)} HK`}
            </div>
          )}
        </div>
      </div>

      {/* News Section */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-black border-t border-gray-800 flex items-center overflow-hidden">
        <div className="bg-[#FF8000] text-black font-bold px-4 h-full flex items-center">
          뉴스
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          {newsData && newsData.length > 0 && (
            <div className="animate-marquee inline-block">
              {newsData.map((news, index) => (
                <span key={index} className="text-white mx-8">
                  {news.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 