export default function Footer({ btcPrice, ethPrice, solPrice, xrpPrice }) {
  function formatPrice(price) {
    if (!price) return '-';
    return `$${Number(price).toLocaleString()}`;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center space-x-8">
            {/* 코인 가격 */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center gap-2">
                <img src="/bitcoin.svg" alt="BTC" className="w-5 h-5" />
                <span className="text-xs text-gray-400">Bitcoin</span>
                <span className="text-sm font-bold text-white">{formatPrice(btcPrice)}</span>
                <span className="text-xs text-gray-400">USDT</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="/ethereum.svg" alt="ETH" className="w-5 h-5" />
                <span className="text-xs text-gray-400">Ethereum</span>
                <span className="text-sm font-bold text-white">{formatPrice(ethPrice)}</span>
                <span className="text-xs text-gray-400">USDT</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="/solana.svg" alt="SOL" className="w-5 h-5" />
                <span className="text-xs text-gray-400">Solana</span>
                <span className="text-sm font-bold text-white">{formatPrice(solPrice)}</span>
                <span className="text-xs text-gray-400">USDT</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="/ripple.svg" alt="XRP" className="w-5 h-5" />
                <span className="text-xs text-gray-400">Ripple</span>
                <span className="text-sm font-bold text-white">{formatPrice(xrpPrice)}</span>
                <span className="text-xs text-gray-400">USDT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 