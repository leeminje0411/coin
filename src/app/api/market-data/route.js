import axios from 'axios';

export async function GET() {
  try {
    const symbols = [
      '^DJI',    // 다우존스
      'SPY',     // S&P 500
      '^IXIC',   // 나스닥
      '^RUT',    // 러셀 2000
      '^FTSE',   // FTSE 100
      '^GDAXI',  // DAX
      '^FCHI',   // CAC 40
      '^N225',   // 닛케이
      '^HSI',    // 항셍
      '000001.SS', // 상해종합
      '^KS11',   // KOSPI
      '^KQ11'    // KOSDAQ
    ];

    const results = await Promise.all(
      symbols.map(async (symbol) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;

        const response = await axios.get(url);
        const result = response.data.chart.result[0];

        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        const closes = quotes.close;
        const lastClose = closes[closes.length - 1];
        const prevClose = closes[closes.length - 2];
        const changeAmount = lastClose - prevClose;
        const changePercent = (changeAmount / prevClose) * 100;

        return {
          symbol,
          name: getMarketName(symbol),
          price: lastClose,
          change: changePercent,
          changeAmount: changeAmount,
          historical: {
            dates: timestamps.map(ts => new Date(ts * 1000).toISOString().split('T')[0]),
            prices: closes,
            sma: calculateSMA(closes, 7)
          }
        };
      })
    );

    return Response.json(results);
  } catch (error) {
    console.error('Error fetching market data:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

function getMarketName(symbol) {
  const marketNames = {
    '^DJI': '다우존스',
    'SPY': 'S&P 500',
    '^IXIC': '나스닥',
    '^RUT': '러셀 2000',
    '^FTSE': 'FTSE 100',
    '^GDAXI': 'DAX',
    '^FCHI': 'CAC 40',
    '^N225': '닛케이',
    '^HSI': '항셍',
    '000001.SS': '상해종합',
    '^KS11': 'KOSPI',
    '^KQ11': 'KOSDAQ'
  };
  return marketNames[symbol] || symbol;
}

function calculateSMA(prices, period = 7) {
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
} 