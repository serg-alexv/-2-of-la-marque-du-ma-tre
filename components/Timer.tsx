import React, { useEffect, useState } from 'react';
import { formatTime } from '../utils';

interface TimerProps {
  label: string;
  seconds: number;
  setSeconds: (s: number) => void;
  targetSeconds: number;
}

const Timer: React.FC<TimerProps> = ({ label, seconds, setSeconds, targetSeconds }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, setSeconds]);

  const progress = Math.min((seconds / targetSeconds) * 100, 100);
  const isComplete = seconds >= targetSeconds;

  return (
    <div className="border border-red-900 bg-zinc-950 p-4 mb-4 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-red-600 font-bold uppercase tracking-widest text-sm">{label}</h3>
        <span className={`font-mono text-xl ${isComplete ? 'text-green-600' : 'text-white'}`}>
          {formatTime(seconds)}
        </span>
      </div>
      
      <div className="w-full bg-red-950 h-2 mb-4">
        <div 
          className="bg-red-600 h-2 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setIsActive(!isActive)}
          className={`flex-1 py-2 font-mono uppercase text-xs font-bold tracking-wider border ${isActive ? 'border-red-600 text-red-600 animate-pulse' : 'bg-red-900 text-white hover:bg-red-800'}`}
        >
          {isActive ? 'Стоп' : 'Старт'}
        </button>
        <button 
          onClick={() => {
            const manual = prompt("Введи время в минутах вручную, лживая тварь:", "0");
            if (manual && !isNaN(parseInt(manual))) {
              setSeconds(parseInt(manual) * 60);
            }
          }}
          className="px-3 border border-zinc-700 text-zinc-500 hover:text-zinc-300 text-xs uppercase"
        >
          Ввод
        </button>
      </div>
    </div>
  );
};

export default Timer;