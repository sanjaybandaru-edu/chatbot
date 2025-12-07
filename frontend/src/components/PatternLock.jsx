import { useState, useCallback } from 'react';
import { Sparkles, Lock, Unlock } from 'lucide-react';

// Pattern: 58624 (positions on numpad)
// 7 8 9
// 4 5 6
// 1 2 3
// Mapping: 5=center, 8=top, 6=right, 2=bottom, 4=left
const CORRECT_PATTERN = [5, 8, 6, 2, 4];

function PatternLock({ onUnlock }) {
    const [pattern, setPattern] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [activeLines, setActiveLines] = useState([]);

    // Grid positions (3x3 grid, numbered 1-9)
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
        return {
            x: dot.col * 80 + 40,
            y: dot.row * 80 + 40
        };
    };

    const handleDotEnter = useCallback((dotId) => {
        if (!isDrawing) return;
        if (pattern.includes(dotId)) return;

        const newPattern = [...pattern, dotId];
        setPattern(newPattern);

        // Update lines
        if (pattern.length > 0) {
            const lastDot = pattern[pattern.length - 1];
            setActiveLines(prev => [...prev, { from: lastDot, to: dotId }]);
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

        // Check pattern
        const isCorrect = pattern.length === CORRECT_PATTERN.length &&
            pattern.every((dot, i) => dot === CORRECT_PATTERN[i]);

        if (isCorrect) {
            setSuccess(true);
            setTimeout(() => {
                onUnlock();
            }, 800);
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
        return '#8b5cf6';
    };

    return (
        <div
            className="min-h-screen bg-dark-950 flex items-center justify-center p-4"
            onMouseUp={handleEnd}
            onTouchEnd={handleEnd}
        >
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 text-center">
                {/* Logo and Title */}
                <div className="mb-8">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-500 ${success ? 'scale-110 shadow-green-500/50' : error ? 'animate-shake shadow-red-500/50' : 'shadow-purple-500/30'}`}>
                        {success ? (
                            <Unlock size={36} className="text-white animate-bounce" />
                        ) : (
                            <Lock size={36} className="text-white" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">My ChatGPT</h1>
                    <p className="text-gray-400 text-sm">Draw pattern to unlock</p>
                </div>

                {/* Pattern Grid */}
                <div
                    className="relative w-60 h-60 mx-auto select-none touch-none"
                    style={{ userSelect: 'none' }}
                >
                    {/* SVG for lines */}
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{ zIndex: 1 }}
                    >
                        {activeLines.map((line, i) => {
                            const from = getDotPosition(line.from);
                            const to = getDotPosition(line.to);
                            return (
                                <line
                                    key={i}
                                    x1={from.x}
                                    y1={from.y}
                                    x2={to.x}
                                    y2={to.y}
                                    stroke={getStateColor()}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    className="transition-all duration-200"
                                    style={{
                                        filter: `drop-shadow(0 0 8px ${getStateColor()})`
                                    }}
                                />
                            );
                        })}
                    </svg>

                    {/* Dots */}
                    {dots.map((dot) => {
                        const isActive = pattern.includes(dot.id);
                        const isFirst = pattern[0] === dot.id;

                        return (
                            <div
                                key={dot.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                                style={{
                                    left: dot.col * 80 + 40,
                                    top: dot.row * 80 + 40,
                                    zIndex: 2
                                }}
                                onMouseDown={() => handleDotStart(dot.id)}
                                onMouseEnter={() => handleDotEnter(dot.id)}
                                onTouchStart={(e) => {
                                    e.preventDefault();
                                    handleDotStart(dot.id);
                                }}
                                onTouchMove={(e) => {
                                    e.preventDefault();
                                    const touch = e.touches[0];
                                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                                    const dotId = element?.getAttribute('data-dot-id');
                                    if (dotId) handleDotEnter(parseInt(dotId));
                                }}
                            >
                                {/* Outer ring */}
                                <div
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                            ? success
                                                ? 'bg-green-500/20 scale-110'
                                                : error
                                                    ? 'bg-red-500/20 scale-90'
                                                    : 'bg-purple-500/20 scale-110'
                                            : 'bg-dark-800/50 hover:bg-dark-700/50'
                                        }`}
                                    style={{
                                        boxShadow: isActive ? `0 0 20px ${getStateColor()}40` : 'none'
                                    }}
                                    data-dot-id={dot.id}
                                >
                                    {/* Inner dot */}
                                    <div
                                        className={`w-6 h-6 rounded-full transition-all duration-300 ${isActive
                                                ? success
                                                    ? 'bg-green-500 scale-125'
                                                    : error
                                                        ? 'bg-red-500'
                                                        : 'bg-purple-500 scale-125'
                                                : 'bg-dark-600'
                                            }`}
                                        style={{
                                            boxShadow: isActive ? `0 0 15px ${getStateColor()}` : 'none'
                                        }}
                                        data-dot-id={dot.id}
                                    >
                                        {/* Pulse animation for first dot */}
                                        {isFirst && !success && !error && (
                                            <div
                                                className="absolute inset-0 rounded-full animate-ping"
                                                style={{ backgroundColor: getStateColor(), opacity: 0.3 }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Status message */}
                <div className="mt-8 h-6">
                    {error && (
                        <p className="text-red-400 text-sm animate-fade-in">Wrong pattern. Try again.</p>
                    )}
                    {success && (
                        <p className="text-green-400 text-sm animate-fade-in flex items-center justify-center gap-2">
                            <Sparkles size={16} />
                            Welcome back, Sanjay!
                        </p>
                    )}
                </div>

                {/* Hint */}
                <p className="mt-4 text-gray-600 text-xs">
                    Connect the dots to draw your pattern
                </p>
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
        </div>
    );
}

export default PatternLock;
