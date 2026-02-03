import React from 'react';
import { GeneratedBarcode } from '../types';
import { Trash2, Copy } from 'lucide-react';

interface HistoryListProps {
  items: GeneratedBarcode[];
  onSelect: (item: GeneratedBarcode) => void;
  onClear: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onSelect, onClear }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <p>Nessun codice nella cronologia.</p>
        <p className="text-xs mt-1">Generane uno nuovo per iniziare!</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 px-1">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Recenti</h3>
        <button 
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
        >
          <Trash2 size={12} /> Pulisci
        </button>
      </div>
      <div className="space-y-2 pb-20">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item)}
            className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center active:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex flex-col overflow-hidden">
              <span className="font-mono text-lg font-bold text-gray-800 leading-tight truncate">
                {item.code}
              </span>
              <span className="text-xs text-gray-500 truncate flex items-center gap-2">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide">
                  {item.format}
                </span>
                {item.description}
              </span>
            </div>
            <div className="text-gray-300">
               <Copy size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
