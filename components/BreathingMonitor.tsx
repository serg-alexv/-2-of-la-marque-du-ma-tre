
import React, { useEffect, useRef, useState } from 'react';
import { audioMonitor, BreathingMetrics, BreathingMode } from '../services/audio';

const BreathingMonitor: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
    const [metrics, setMetrics] = useState<BreathingMetrics>({
        volume: 0,
        isBreathing: false,
        bpm: 0,
        raw: []
    });
    const [mode, setMode] = useState<BreathingMode>('1');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // PACER STATE
    const [pacerState, setPacerState] = useState<'INHALE' | 'HOLD' | 'EXHALE'>('INHALE');
    const [pacerProgress, setPacerProgress] = useState(0); // 0 to 1

    useEffect(() => {
        // Subscribe to audio updates
        const unsubscribe = audioMonitor.subscribe((data) => {
            setMetrics(data);

            // Draw to widget canvas
            if (!isFullscreen && canvasRef.current) {
                drawOscilloscope(canvasRef.current, data.raw, false);
            }
            // Draw to fullscreen canvas
            if (isFullscreen && fullscreenCanvasRef.current) {
                drawOscilloscope(fullscreenCanvasRef.current, data.raw, true);
            }
        });
        return () => unsubscribe();
    }, [isFullscreen]);

    // PACER LOOP
    useEffect(() => {
        let startTime = Date.now();
        const cycleDuration = 10000; // 10 seconds total (4 in, 2 hold, 4 out)

        const loop = () => {
            if (!isFullscreen) return;
            const now = Date.now();
            const elapsed = (now - startTime) % cycleDuration;

            let state: 'INHALE' | 'HOLD' | 'EXHALE' = 'INHALE';
            let progress = 0;

            if (elapsed < 4000) {
                state = 'INHALE';
                progress = elapsed / 4000;
            } else if (elapsed < 6000) {
                state = 'HOLD';
                progress = 1;
            } else {
                state = 'EXHALE';
                progress = 1 - ((elapsed - 6000) / 4000);
            }

            setPacerState(state);
            setPacerProgress(progress);
            requestAnimationFrame(loop);
        };

        if (isFullscreen) {
            requestAnimationFrame(loop);
        }

        return () => { };
    }, [isFullscreen]);

    const toggleMode = () => {
        const newMode = mode === '1' ? '2' : '1';
        setMode(newMode);
        audioMonitor.setMode(newMode);
    };

    const drawOscilloscope = (canvas: HTMLCanvasElement, data: number[], big: boolean) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Styling
        ctx.lineWidth = big ? 4 : 2;
        ctx.strokeStyle = metrics.isBreathing ? '#dc2626' : (big ? '#10b981' : '#047857');

        ctx.beginPath();
        const sliceWidth = width * 1.0 / data.length;
        let x = 0;

        for (let i = 0; i < data.length; i++) {
            const v = data[i] / 128.0;
            const y = v * height / 2;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    };

    return (
        <>
            {/* WIDGET VIEW */}
            <div className="w-full bg-black/90 border border-zinc-800 p-4 mt-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-red-600 font-creep text-lg tracking-widest">
                        МОНИТОР ДЫХАНИЯ
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleMode}
                            className="text-[10px] font-mono border border-zinc-700 px-2 py-1 text-zinc-400 hover:text-white"
                        >
                            {mode} P
                        </button>
                        <button
                            onClick={() => setIsFullscreen(true)}
                            className="text-[10px] font-mono bg-red-900/20 border border-red-700 px-2 py-1 text-red-500 hover:bg-red-900 hover:text-white uppercase"
                        >
                            ПРАКТИКА
                        </button>
                    </div>
                </div>

                <div className="relative border border-zinc-900 h-32 mb-2">
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={128}
                        className="w-full h-full block"
                    />

                    <div className="absolute top-2 left-2 text-[10px] font-mono text-zinc-500 space-y-1">
                        <div className={metrics.isBreathing ? "text-red-500 font-bold" : "text-zinc-600"}>
                            {metrics.isBreathing ? "ВДОХ/ВЫДОХ" : "ТИШИНА"}
                        </div>
                        <div>VOL: {(metrics.volume * 100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            {/* FULLSCREEN OVERLAY (THE PEACEMAKER) */}
            {isFullscreen && (
                <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6">
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-6 right-6 text-zinc-500 hover:text-white border border-zinc-700 px-4 py-2 font-mono uppercase text-xs z-50"
                    >
                        ЗАКОНЧИТЬ ПРАКТИКУ
                    </button>

                    {/* PACER CIRCLE */}
                    <div className="relative flex items-center justify-center mb-12">
                        {/* Base Circle */}
                        <div
                            className="w-64 h-64 rounded-full border-4 border-zinc-800 absolute opacity-30"
                        ></div>

                        {/* Interactive Pacer */}
                        <div
                            className={`w-64 h-64 rounded-full border-4 transition-all duration-[50ms] ease-linear flex items-center justify-center
                                ${pacerState === 'HOLD' ? 'border-blue-500 bg-blue-900/20 shadow-[0_0_50px_rgba(59,130,246,0.5)]' :
                                    (pacerState === 'INHALE' ? 'border-green-600 bg-green-900/10' : 'border-red-600 bg-red-900/10')}`}
                            style={{
                                transform: `scale(${1 + (pacerProgress * 0.5)})`, // Scale from 1.0 to 1.5
                            }}
                        >
                            <div className="text-2xl font-black font-mono tracking-widest text-white drop-shadow-md">
                                {pacerState === 'INHALE' && 'ВДОХ'}
                                {pacerState === 'HOLD' && 'ДЕРЖИ'}
                                {pacerState === 'EXHALE' && 'ВЫДОХ'}
                            </div>
                        </div>
                    </div>

                    {/* REAL-TIME BREATH GRAPH OVERLAYS */}
                    <div className="w-full max-w-2xl h-48 border-t border-b border-zinc-800 relative bg-zinc-900/20 backdrop-blur-sm">
                        <canvas
                            ref={fullscreenCanvasRef}
                            width={600}
                            height={200}
                            className="w-full h-full block opacity-80"
                        />
                        <div className="absolute top-2 right-2 font-mono text-xs text-zinc-500">
                            ВАШ РИТМ
                        </div>
                    </div>

                    <p className="mt-8 text-zinc-500 font-mono text-sm uppercase tracking-widest text-center max-w-md">
                        СЛЕДУЙ ЗА КРУГОМ. СИНХРОНИЗИРУЙ ДЫХАНИЕ.
                        <br />
                        <span className="text-xs text-zinc-600 mt-2 block">
                            {mode === '2' ? 'СИНХРОНИЗИРУЙТЕСЬ ДРУГ С ДРУГОМ' : 'УСПОКОЙ СВОЙ РАЗУМ, РАБ'}
                        </span>
                    </p>
                </div>
            )}
        </>
    );
};

export default BreathingMonitor;
