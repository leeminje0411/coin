import crypto from 'crypto';

export async function GET() {
  const API_KEY = process.env.MEXC_API_KEY;
  const API_SECRET = process.env.MEXC_API_SECRET;
  const BASE_URL = 'https://contract.mexc.com';
  const recvWindow = 5000;
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
  const signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

  const url = `${BASE_URL}/api/v1/private/account/assets?${queryString}&signature=${signature}`;

  console.log('API 키:', API_KEY ? '존재' : '없음');
  console.log('API 시크릿:', API_SECRET ? '존재' : '없음');
  console.log('요청 URL:', url);
  console.log('시그니처:', signature);
  console.log('타임스탬프:', timestamp);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-MEXC-APIKEY': API_KEY
      }
    });

    console.log('응답 상태:', response.status);
    console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    if (!response.ok) {
      console.error('MEXC API 에러 응답:', data);
      return Response.json({ error: data.message, status: response.status, details: data }, { status: response.status });
    }

    console.log('MEXC API 응답:', JSON.stringify(data, null, 2));
    return Response.json(data);
  } catch (err) {
    console.error('❌ 서버에서 MEXC API 호출 실패:', err);
    return Response.json({ error: '서버 오류', details: err.message }, { status: 500 });
  }
}