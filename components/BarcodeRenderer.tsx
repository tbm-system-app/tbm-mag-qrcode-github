import React from 'react';
import Barcode from 'react-barcode';
import { BarcodeFormat } from '../types';

interface BarcodeRendererProps {
  value: string;
  format: BarcodeFormat;
  width?: number;
  height?: number;
}

const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({ value, format, width = 2, height = 100 }) => {
  // Pre-validazione specifica per evitare crash della libreria react-barcode
  const isInvalidEAN = format === BarcodeFormat.EAN13 && (!/^\d{13}$/.test(value));
  
  if (isInvalidEAN) {
    return (
      <div className="flex justify-center items-center bg-red-50 p-4 rounded-lg border border-red-200 w-full min-h-[130px]">
        <div className="text-center">
           <p className="text-red-500 font-bold text-sm">Codice non valido</p>
           <p className="text-red-400 text-xs mt-1">L'EAN13 richiede 13 cifre numeriche.</p>
           <p className="text-gray-400 text-[10px] mt-2 font-mono">{value}</p>
        </div>
      </div>
    );
  }

  // Wrapper try-catch per sicurezza aggiuntiva durante il rendering
  try {
    return (
      <div className="flex justify-center items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100 overflow-hidden w-full min-h-[130px]">
        <Barcode 
          value={value}
          format={format}
          width={width}
          height={height}
          displayValue={true}
          font="monospace"
          textAlign="center"
          textPosition="bottom"
          background="#ffffff"
          lineColor="#000000"
          margin={0}
        />
      </div>
    );
  } catch (e) {
    return (
      <div className="text-red-500 text-sm p-4 text-center border border-red-200 bg-red-50 rounded">
        Errore di rendering per il formato {format}
      </div>
    );
  }
};

export default BarcodeRenderer;