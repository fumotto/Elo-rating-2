import { useEffect, useMemo } from 'react';
import './Celebration.css';

interface Props {
    onComplete?: () => void;
    pieces?: number;
}

const COLORS = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#0a84ff', '#5856d6', '#ff2d55'];

export function Celebration({ onComplete, pieces = 90 }: Props) {
    const confetti = useMemo(() => {
        return new Array(pieces).fill(null).map(() => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.6; // seconds
            const dur = 1.6 + Math.random() * 1.2; // seconds
            const rot = Math.random() * 720 - 360; // deg
            const scale = 0.6 + Math.random() * 0.9;
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const size = 6 + Math.random() * 12;
            return { left, delay, dur, rot, scale, color, size };
        });
    }, [pieces]);

    useEffect(() => {
        const t = setTimeout(() => onComplete && onComplete(), 3000);
        return () => clearTimeout(t);
    }, [onComplete]);

    return (
        <div className="celebration-root" aria-hidden>
            <div className="celebration-burst" />
            {confetti.map((c, i) => (
                <span
                    key={i}
                    className="celebration-piece"
                    style={{
                        left: `${c.left}%`,
                        background: c.color,
                        width: `${c.size}px`,
                        height: `${c.size * 0.6}px`,
                        transform: `rotate(${c.rot}deg) scale(${c.scale})`,
                        animationDelay: `${c.delay}s`,
                        animationDuration: `${c.dur}s`,
                    }}
                />
            ))}
            <div className="celebration-text">戦績登録完了！</div>
        </div>
    );
}
