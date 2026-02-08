import React from 'react';

interface CounterProps {
  label: string;
  count: number;
  setCount: (c: number) => void;
  min?: number;
  step?: number;
  bigButton?: boolean;
}

const Counter: React.FC<CounterProps> = ({ label, count, setCount, min = 0, step = 1, bigButton = false }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <label className="text-zinc-400 text-xs uppercase tracking-widest">{label}</label>
        <span className="font-mono text-xl text-red-600">{count}</span>
      </div>
      
      {bigButton ? (
        <button
          onClick={() => setCount(count + step)}
          className="w-full py-6 border-2 border-red-800 bg-zinc-900 text-red-600 font-serif text-xl uppercase tracking-widest active:scale-95 active:bg-red-950 transition-all shadow-[0_0_20px_rgba(220,38,38,0.1)]"
        >
          ИСПОЛНИТЬ (+{step})
        </button>
      ) : (
        <div className="flex gap-2">
          <input 
            type="number" 
            value={count} 
            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            className="bg-black border border-zinc-800 text-white p-2 w-20 font-mono text-center"
          />
          <button 
            onClick={() => setCount(count + step)}
            className="flex-1 bg-red-900/20 border border-red-900 text-red-500 hover:bg-red-900/40 uppercase text-xs tracking-wider"
          >
            +1 Унижение
          </button>
        </div>
      )}
      {min > 0 && count < min && (
        <p className="text-red-900 text-[10px] uppercase mt-1 text-right">Минимум: {min}</p>
      )}
    </div>
  );
};

export default Counter;