import React, { useState, useEffect } from 'react';
import { BarcodeFormat, GeneratedBarcode } from './types';
import { generateSmartBarcode } from './services/geminiService';
import BarcodeRenderer from './components/BarcodeRenderer';
import QRCodeRenderer from './components/QRCodeRenderer';
import HistoryList from './components/HistoryList';
import { ScanBarcode, Wand2, RefreshCw, Smartphone, QrCode, History } from 'lucide-react';

type Tab = 'barcode' | 'qrcode' | 'history';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>('barcode');

  // App Data State
  const [format, setFormat] = useState<BarcodeFormat>(BarcodeFormat.EAN13);
  const [currentBarcode, setCurrentBarcode] = useState<GeneratedBarcode | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<GeneratedBarcode[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('barcode_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('barcode_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // API Call to Gemini
      // If we are in QR tab, we might want to generate generic content, 
      // but for now we keep the smart product generation for consistency.
      const result = await generateSmartBarcode(format);
      
      const newBarcode: GeneratedBarcode = {
        id: Date.now().toString(),
        code: result.code,
        description: result.description,
        format: format,
        timestamp: Date.now()
      };

      setCurrentBarcode(newBarcode);
      setHistory(prev => [newBarcode, ...prev].slice(0, 50)); // Keep last 50
    } catch (error) {
      alert("Errore durante la generazione. Controlla la tua chiave API o riprova.");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if(confirm("Vuoi davvero cancellare tutta la cronologia?")) {
      setHistory([]);
      setCurrentBarcode(null);
    }
  };

  const handleSelectHistory = (item: GeneratedBarcode) => {
    setCurrentBarcode(item);
    // Automatically switch to the visualization tab relevant to the current viewing preference?
    // Let's stay on history tab or switch to the main view.
    // Switching to barcode view is usually expected.
    setActiveTab('barcode');
  };

  // --- RENDERERS FOR PAGES ---

  const renderBarcodePage = () => (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
          Formato Barcode
        </label>
        <div className="relative">
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value as BarcodeFormat)}
            className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
          >
            {Object.values(BarcodeFormat).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="min-h-[200px] flex flex-col items-center justify-center">
        {currentBarcode ? (
          <div className="w-full">
            <div className="flex flex-col items-center gap-2 mb-4">
                <span className="text-xl font-bold text-gray-900 leading-tight text-center px-4">
                  {currentBarcode.description}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {currentBarcode.format} • {currentBarcode.id.slice(-6)}
                </span>
            </div>
            <BarcodeRenderer 
              value={currentBarcode.code} 
              format={currentBarcode.format} 
            />
            <div className="mt-4 text-center">
                <span className="text-lg font-mono font-bold text-gray-600 tracking-widest">
                  {currentBarcode.code}
                </span>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10">
            <ScanBarcode size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Premi "Genera" per iniziare</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderQRCodePage = () => (
    <div className="animate-fade-in space-y-6">
       <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            Genera un QR Code basato sugli stessi dati del prodotto.
          </p>
       </div>

      <div className="min-h-[200px] flex flex-col items-center justify-center">
        {currentBarcode ? (
          <div className="w-full flex flex-col items-center">
             <div className="flex flex-col items-center gap-1 mb-6">
                <span className="text-lg font-bold text-gray-900 text-center px-4">
                  {currentBarcode.description}
                </span>
                 <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  QR Version
                </span>
            </div>
            
            <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-100">
               <QRCodeRenderer value={currentBarcode.code} size={220} />
            </div>

            <div className="mt-6 text-center w-full px-8">
               <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Dati contenuti</p>
               <div className="bg-gray-100 p-3 rounded-lg break-all font-mono text-xs text-gray-600">
                 {currentBarcode.code}
               </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-10">
            <QrCode size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Genera un codice per vedere il QR</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistoryPage = () => (
    <div className="animate-fade-in">
      <HistoryList 
        items={history} 
        onSelect={handleSelectHistory} 
        onClear={clearHistory}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex justify-center">
      {/* Mobile container */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <header className="bg-white text-gray-800 p-5 pt-8 border-b border-gray-100 shadow-sm z-10 sticky top-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">TBM Code</h1>
            </div>
            {activeTab !== 'history' && (
              <button 
                onClick={() => setActiveTab('history')}
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <History size={24} />
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 px-5 pt-6 pb-40 overflow-y-auto no-scrollbar bg-gray-50/50">
          {activeTab === 'barcode' && renderBarcodePage()}
          {activeTab === 'qrcode' && renderQRCodePage()}
          {activeTab === 'history' && renderHistoryPage()}
        </main>

        {/* Generator Button (Floating) - Only visible on Generation Tabs */}
        {activeTab !== 'history' && (
          <div className="absolute bottom-24 left-0 right-0 px-6 z-20 pointer-events-none">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform pointer-events-auto active:scale-95
                ${loading ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-900 hover:bg-black'}
              `}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin w-5 h-5" />
                  <span>Elaborazione...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Genera {activeTab === 'qrcode' ? 'QR Code' : 'Barcode'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-5 pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
          <div className="flex justify-around items-center">
            <button
              onClick={() => setActiveTab('barcode')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${
                activeTab === 'barcode' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ScanBarcode size={24} strokeWidth={activeTab === 'barcode' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Barcode</span>
            </button>

            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${
                activeTab === 'qrcode' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <QrCode size={24} strokeWidth={activeTab === 'qrcode' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">QR Code</span>
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${
                activeTab === 'history' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <History size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">Storico</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;