import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeRendererProps {
  value: string;
  size?: number;
}

const QRCodeRenderer: React.FC<QRCodeRendererProps> = ({ value, size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Clear error state
      setError(null);
      
      // Standard usage of qrcode library with Vite
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }, (err) => {
        if (err) {
          console.error("QR Generation Error:", err);
          setError("Errore generazione QR");
        }
      });
    }
  }, [value, size]);

  if (error) {
    return (
      <div className="flex justify-center items-center bg-red-50 p-6 rounded-lg border border-red-200 text-red-500 text-xs w-full h-48">
        {error}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center overflow-hidden bg-white p-2 rounded-lg">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default QRCodeRenderer;