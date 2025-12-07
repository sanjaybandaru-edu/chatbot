import { useState, useCallback } from 'react';
import { Sparkles, Lock, Unlock } from 'lucide-react';

// Pattern: 58624 (positions on numpad)
const CORRECT_PATTERN = [5, 8, 6, 2, 4];

function PatternLock({ onUnlock }) {
    const [pattern, setPattern] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [activeLines, setActiveLines] = useState([]);

    const dots = [
        { id: 7, row: 0, col: 0 },
        { id: 8, row: 0, col: 1 },
        { id: 9, row: 0, col: 2 },
        { id: 4, row: 1, col: 0 },
        { id: 5, row: 1, col: 1 },
        { id: 6, row: 1, col: 2 },
        { id: 1, row: 2, col: 0 },
        { id: 2, row: 2, col: 1 },
        { id: 3, row: 2, col: 2 },
    ];

    const getDotPosition = (id) => {
        const dot = dots.find(d => d.id === id);
        if (!dot) return { x: 0, y: 0 };
        return { x: dot.col * 80 + 40, y: dot.row * 80 + 40 };
    };

    const handleDotEnter = useCallback((dotId) => {
        if (!isDrawing || pattern.includes(dotId)) return;
        const newPattern = [...pattern, dotId];
        setPattern(newPattern);
        if (pattern.length > 0) {
            setActiveLines(prev => [...prev, { from: pattern[pattern.length - 1], to: dotId }]);
        }
    }, [isDrawing, pattern]);

    const handleDotStart = useCallback((dotId) => {
        setIsDrawing(true);
        setPattern([dotId]);
        setActiveLines([]);
        setError(false);
    }, []);

    const handleEnd = useCallback(() => {
        if (!isDrawing) return;
        setIsDrawing(false);

        const isCorrect = pattern.length === CORRECT_PATTERN.length &&
            pattern.every((dot, i) => dot === CORRECT_PATTERN[i]);

        if (isCorrect) {
            setSuccess(true);
            setTimeout(() => onUnlock(), 800);
        } else {
            setError(true);
            setTimeout(() => {
                setPattern([]);
                setActiveLines([]);
                setError(false);
            }, 500);
        }
    }, [isDrawing, pattern, onUnlock]);

    const getStateColor = () => {
        if (success) return '#22c55e';
        if (error) return '#ef4444';
        return '#d4f542'; // PartyRock lime
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4"
            style={{ background: 'var(--pr-bg)' }}
            onMouseUp={handleEnd} onTouchEnd={handleEnd}>

            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl animate-pulse"
                    style={{ background: 'rgba(212, 245, 66, 0.1)' }} />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl animate-pulse"
                    style={{ background: 'rgba(168, 224, 99, 0.1)', animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 text-center">
                {/* Logo */}
                <div className="mb-8">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-500 ${success ? 'scale-110' : error ? 'animate-shake' : ''
                        }`}
                        style={{
                            background: success ? '#22c55e' : error ? '#ef4444' : 'var(--pr-lime)',
                            boxShadow: `0 0 30px ${getStateColor()}40`
                        }}>
                        {success ? (
                            <Unlock size={36} className="text-white animate-bounce" />
                        ) : (
                            <Lock size={36} className="text-gray-900" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">ChatBot</h1>
                    <p className="text-gray-500 text-sm">Draw pattern to unlock</p>
                </div>

                {/* Pattern Grid */}
                <div className="relative w-60 h-60 mx-auto select-none touch-none pr-card p-4" style={{ userSelect: 'none' }}>
                    <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] pointer-events-none" style={{ zIndex: 1 }}>
                        {activeLines.map((line, i) => {
                            const from = getDotPosition(line.from);
                            const to = getDotPosition(line.to);
                            return (
                                <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                    stroke={getStateColor()} strokeWidth="4" strokeLinecap="round"
                                    style={{ filter: `drop-shadow(0 0 8px ${getStateColor()})` }} />
                            );
                        })}
                    </svg>

                    {dots.map((dot) => {
                        const isActive = pattern.includes(dot.id);
                        return (
                            <div key={dot.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                                style={{ left: dot.col * 80 + 40, top: dot.row * 80 + 40, zIndex: 2 }}
                                onMouseDown={() => handleDotStart(dot.id)}
                                onMouseEnter={() => handleDotEnter(dot.id)}
                                onTouchStart={(e) => { e.preventDefault(); handleDotStart(dot.id); }}
                                onTouchMove={(e) => {
                                    e.preventDefault();
                                    const touch = e.touches[0];
                                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                    const dotId = element?.getAttribute('data-dot-id');
                                    if (dotId) handleDotEnter(parseInt(dotId));
                                }}
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'bg-gray-800/50 hover:bg-gray-700/50'
                                    }`}
                                    style={isActive ? { background: `${getStateColor()}20`, boxShadow: `0 0 20px ${getStateColor()}40` } : {}}
                                    data-dot-id={dot.id}>
                                    <div className={`w-6 h-6 rounded-full transition-all duration-300 ${isActive ? 'scale-125' : 'bg-gray-600'}`}
                                        style={isActive ? { background: getStateColor(), boxShadow: `0 0 15px ${getStateColor()}` } : {}}
                                        data-dot-id={dot.id} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Status */}
                <div className="mt-8 h-6">
                    {error && <p className="text-red-400 text-sm animate-fade-in">Wrong pattern. Try again.</p>}
                    {success && (
                        <p className="text-sm animate-fade-in flex items-center justify-center gap-2" style={{ color: 'var(--pr-lime)' }}>
                            <Sparkles size={16} /> Welcome back, Sanjay!
                        </p>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
        </div>
    );
}

export default PatternLock;
