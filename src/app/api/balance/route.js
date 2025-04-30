import { NextResponse } from 'next/server';
import crypto from 'crypto';

const apiKey = process.env.BINANCE_API_KEY;
const apiSecret = process.env.BINANCE_SECRET_KEY;

export async function GET() {
  const timestamp = Date.now();
  const query = `timestamp=${timestamp}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(query).digest('hex');
  const url = `https://testnet.binancefuture.com/fapi/v2/balance?${query}&signature=${signature}`;

  try {
    const res = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    });

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error("❌ Binance 테스트넷 API 실패:", data);
      return NextResponse.json({ error: data }, { status: 500 });
    }

    const usdt = data.find((b) => b.asset === 'USDT');
    const balance = usdt ? parseFloat(usdt.balance) : 0;

    return NextResponse.json({ balance });
  } catch (e) {
    console.error("❌ Binance 테스트넷 잔고 조회 실패:", e);
    return NextResponse.json({ error: "Binance testnet balance fetch failed" }, { status: 500 });
  }
}