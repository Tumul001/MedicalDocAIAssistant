import { motion } from 'framer-motion';

/** Animated waveform bars — used in VoiceAssistant during listening/speaking */
export default function WaveformVisualizer({ isActive = false, barCount = 20, color = 'cyan', height = 48 }) {
  const colorMap = {
    cyan:    'bg-cyan-400',
    emerald: 'bg-emerald-400',
    violet:  'bg-violet-400',
    blue:    'bg-blue-400',
  };
  const barColor = colorMap[color] || colorMap.cyan;

  return (
    <div
      className="flex items-center justify-center gap-[3px]"
      style={{ height }}
      role="img"
      aria-label={isActive ? 'Audio waveform active' : 'Audio waveform idle'}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const baseH = 4 + Math.sin(i * 0.7) * 4;
        const peakH = 8 + Math.random() * (height * 0.65);
        return (
          <motion.div
            key={i}
            className={`rounded-full w-[3px] ${barColor}`}
            animate={
              isActive
                ? {
                    height: [
                      `${baseH}px`,
                      `${peakH}px`,
                      `${baseH + 2}px`,
                      `${peakH * 0.6}px`,
                      `${baseH}px`,
                    ],
                    opacity: [0.5, 1, 0.8, 1, 0.5],
                  }
                : { height: `${baseH}px`, opacity: 0.25 }
            }
            transition={
              isActive
                ? {
                    duration: 0.7 + Math.random() * 0.6,
                    repeat: Infinity,
                    delay: i * 0.04,
                    ease: 'easeInOut',
                  }
                : { duration: 0.4 }
            }
          />
        );
      })}
    </div>
  );
}
