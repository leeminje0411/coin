import { Spot } from '@binance/connector';

const apiKey = process.env.NEXT_PUBLIC_BINANCE_API_KEY || '';
const apiSecret = process.env.NEXT_PUBLIC_BINANCE_API_SECRET || '';

export const binanceClient = new Spot(apiKey, apiSecret);

export const getTickerPrice = async (symbol) => {
  try {
    const response = await binanceClient.tickerPrice(symbol);
    return response.data;
  } catch (error) {
    console.error('Error fetching ticker price:', error);
    throw error;
  }
};

export const get24hrTicker = async (symbol) => {
  try {
    const response = await binanceClient.ticker24hr(symbol);
    return response.data;
  } catch (error) {
    console.error('Error fetching 24hr ticker:', error);
    throw error;
  }
};

export const getKlines = async (symbol, interval, limit = 100) => {
  try {
    const response = await binanceClient.klines(symbol, interval, { limit });
    return response.data;
  } catch (error) {
    console.error('Error fetching klines:', error);
    throw error;
  }
}; 