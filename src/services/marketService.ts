export interface MarketData {
  goldUSD: number;
  goldINR: number;
  silverUSD: number;
  silverINR: number;
  bitcoin: { price: number; change: number };
  ethereum: { price: number; change: number };
  nifty: { price: number; change: number; trend: 'up' | 'down' };
  sensex: { price: number; change: number; trend: 'up' | 'down' };
  alerts: string[];
}

export interface HistoryDataPoint {
  time: string;
  goldINR: number;
  silverINR: number;
  bitcoin: number;
  ethereum: number;
}

const getMockStockData = (baseNifty: number, baseSensex: number) => {
  const niftyChange = (Math.random() - 0.5) * 100;
  const sensexChange = (Math.random() - 0.5) * 300;
  
  return {
    nifty: {
      price: baseNifty + niftyChange,
      change: Number((niftyChange / baseNifty * 100).toFixed(2)),
      trend: niftyChange >= 0 ? 'up' : 'down' as const
    },
    sensex: {
      price: baseSensex + sensexChange,
      change: Number((sensexChange / baseSensex * 100).toFixed(2)),
      trend: sensexChange >= 0 ? 'up' : 'down' as const
    }
  };
};

const getDefaultData = (): MarketData => {
  const stocks = getMockStockData(22500, 74000);
  return {
    goldUSD: 2350,
    goldINR: 6300,
    silverUSD: 28.5,
    silverINR: 76,
    bitcoin: { price: 5500000, change: 2.5 },
    ethereum: { price: 320000, change: 1.8 },
    nifty: stocks.nifty,
    sensex: stocks.sensex,
    alerts: []
  };
};

export const fetchMarketData = async (): Promise<{ data: MarketData, history: HistoryDataPoint[] }> => {
  let data: MarketData;
  const alerts: string[] = [];

  try {
    const today = new Date().toDateString();

    const [cryptoRes, metalRes, exchangeRes] = await Promise.all([
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=inr&include_24hr_change=true"),
      fetch("https://api.metals.live/v1/spot"),
      fetch("https://api.exchangerate-api.com/v4/latest/USD")
    ]);

    const crypto = await cryptoRes.json();
    const metals = await metalRes.json();
    const exchange = await exchangeRes.json();

    const usdToInr = exchange?.rates?.INR || 83.5;

    // metals API usually returns an array of objects
    const goldObj = Array.isArray(metals) ? metals.find((m: any) => m.gold) : null;
    const silverObj = Array.isArray(metals) ? metals.find((m: any) => m.silver) : null;

    const goldUSD = goldObj?.gold || 2350;
    const silverUSD = silverObj?.silver || 28.5;

    const goldINR = (goldUSD * usdToInr) / 31.1035;
    const silverINR = (silverUSD * usdToInr) / 31.1035;
    
    const stocks = getMockStockData(22500, 74000);

    data = {
      goldUSD,
      goldINR,
      silverUSD,
      silverINR,
      bitcoin: {
        price: crypto.bitcoin?.inr || 5500000,
        change: crypto.bitcoin?.inr_24h_change || 2.5
      },
      ethereum: {
        price: crypto.ethereum?.inr || 320000,
        change: crypto.ethereum?.inr_24h_change || 1.8
      },
      nifty: stocks.nifty,
      sensex: stocks.sensex,
      alerts: []
    };

    localStorage.setItem("marketData", JSON.stringify(data));
    localStorage.setItem("lastFetchDate", today);

  } catch (error) {
    console.error("Failed to fetch market data:", error);
    // fallback
    const cachedData = localStorage.getItem("marketData");
    if (cachedData) {
      try {
        data = JSON.parse(cachedData);
        // Ensure legacy formats don't crash the app
        if (!data.goldUSD) {
          data = { ...getDefaultData(), ...data };
        }
      } catch (e) {
        data = getDefaultData();
      }
    } else {
      data = getDefaultData();
    }
  }

  // Handle History and Alerts
  let history: HistoryDataPoint[] = [];
  const storedHistory = localStorage.getItem("marketHistoryData");
  
  if (storedHistory) {
    try {
      history = JSON.parse(storedHistory);
    } catch (e) {}
  }
  
  if (history.length > 0) {
    const lastData = history[history.length - 1];
    
    if (data.goldINR < lastData.goldINR) {
      alerts.push(`⚠ Gold dropped by ₹${(lastData.goldINR - data.goldINR).toFixed(2)}/g`);
    }
    if (data.silverINR < lastData.silverINR) {
      alerts.push(`⚠ Silver dropped by ₹${(lastData.silverINR - data.silverINR).toFixed(2)}/g`);
    }
    if (data.bitcoin.price < lastData.bitcoin) {
      alerts.push(`⚠ Bitcoin dropped by ₹${(lastData.bitcoin - data.bitcoin.price).toLocaleString('en-IN')}`);
    }
    if (data.ethereum.price < lastData.ethereum) {
      alerts.push(`⚠ Ethereum dropped by ₹${(lastData.ethereum - data.ethereum.price).toLocaleString('en-IN')}`);
    }
  }

  data.alerts = alerts;

  // Append new history point
  const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newHistoryPoint: HistoryDataPoint = {
    time: timeLabel,
    goldINR: Number(data.goldINR.toFixed(2)),
    silverINR: Number(data.silverINR.toFixed(2)),
    bitcoin: data.bitcoin.price,
    ethereum: data.ethereum.price
  };

  history.push(newHistoryPoint);
  if (history.length > 30) {
    history = history.slice(history.length - 30);
  }

  localStorage.setItem("marketHistoryData", JSON.stringify(history));

  return { data, history };
};
