import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    // 임시 데이터 생성
    const newsData = [
      {
        id: 1,
        title: 'Fed, 금리 인하 시기 신중히 검토',
        summary: '연방준비제도 관계자들은 인플레이션 추가 하락 증거가 필요하다고 언급',
        category: '경제',
        datetime: new Date().toISOString()
      },
      {
        id: 2,
        title: 'AI 낙관론에 기술주 강세',
        summary: '인공지능 성장 전망에 투자자들의 기대감 고조',
        category: '마켓',
        datetime: new Date().toISOString()
      },
      {
        id: 3,
        title: '공급 우려에 유가 상승',
        summary: '지정학적 긴장으로 인한 글로벌 공급망 차질 우려 확대',
        category: '원자재',
        datetime: new Date().toISOString()
      },
      {
        id: 4,
        title: '미국 증시 하락에 아시아 증시 혼조',
        summary: '미국 주식시장 약세 영향으로 아시아 주요국 증시 등락 엇갈려',
        category: '글로벌',
        datetime: new Date().toISOString()
      },
      {
        id: 5,
        title: '삼성전자, 신규 AI 칩 개발 발표',
        summary: '차세대 AI 반도체 시장 선점 위한 투자 계획 공개',
        category: '기업',
        datetime: new Date().toISOString()
      },
      {
        id: 6,
        title: '중국 부동산 시장 회복세',
        summary: '정부 지원책 효과로 주요 도시 부동산 거래량 증가',
        category: '아시아',
        datetime: new Date().toISOString()
      },
      {
        id: 7,
        title: 'SK하이닉스, AI 메모리 수요 급증',
        summary: 'AI 서버용 HBM 메모리 판매 호조로 실적 개선 전망',
        category: '기업',
        datetime: new Date().toISOString()
      },
      {
        id: 8,
        title: '테슬라, 중국시장 점유율 하락',
        summary: 'BYD 등 현지 업체들과의 경쟁 심화로 시장 점유율 감소',
        category: '자동차',
        datetime: new Date().toISOString()
      },
      {
        id: 9,
        title: '비트코인 5만달러 돌파',
        summary: '현물 ETF 출시 이후 기관투자자 자금 유입 지속',
        category: '암호화폐',
        datetime: new Date().toISOString()
      },
      {
        id: 10,
        title: 'LG에너지솔루션, 미국 배터리공장 증설',
        summary: 'IRA 세제혜택 활용 위해 조지아 공장 생산능력 확대',
        category: '기업',
        datetime: new Date().toISOString()
      },
      {
        id: 11,
        title: '일본은행, 마이너스 금리 해제 검토',
        summary: '물가상승세 지속에 23년만의 금리정책 전환 가능성',
        category: '경제',
        datetime: new Date().toISOString()
      },
      {
        id: 12,
        title: 'EU, AI 규제법안 최종 승인',
        summary: '세계 최초의 포괄적 AI 규제 프레임워크 도입 예정',
        category: '정책',
        datetime: new Date().toISOString()
      },
      {
        id: 13,
        title: '현대차, 전기차 플랫폼 공개',
        summary: '차세대 전용 플랫폼으로 주행거리 및 충전속도 개선',
        category: '자동차',
        datetime: new Date().toISOString()
      },
      {
        id: 14,
        title: '애플, 인도 생산기지 확대',
        summary: '중국 의존도 낮추기 위해 인도 생산 비중 확대 계획',
        category: '기업',
        datetime: new Date().toISOString()
      },
      {
        id: 15,
        title: '국제유가, 중동 긴장에 상승',
        summary: '이스라엘-하마스 충돌 장기화로 공급 불안 가중',
        category: '원자재',
        datetime: new Date().toISOString()
      },
      {
        id: 16,
        title: '메타, VR 신제품 출시 예고',
        summary: '하반기 신형 퀘스트 출시로 XR 시장 주도권 강화',
        category: '기술',
        datetime: new Date().toISOString()
      },
      {
        id: 17,
        title: '한국은행, 기준금리 동결',
        summary: '고물가 지속에도 경기 둔화 우려로 금리 동결 결정',
        category: '경제',
        datetime: new Date().toISOString()
      },
      {
        id: 18,
        title: 'TSMC, 미국 공장 가동 연기',
        summary: '인력 수급 문제로 애리조나 공장 가동 일정 지연',
        category: '기업',
        datetime: new Date().toISOString()
      }
    ];

    return NextResponse.json(newsData);
  } catch (error) {
    console.error('뉴스 데이터 가져오기 실패:', error);
    return NextResponse.json({ error: '뉴스 데이터를 가져오는데 실패했습니다.' }, { status: 500 });
  }
} 