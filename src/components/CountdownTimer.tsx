import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  endDate: string;
}

export default function CountdownTimer({ endDate }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, expired } = useCountdown(endDate);

  if (expired) {
    return (
      <div className="flex items-center justify-center gap-1 text-sm text-red-400 font-medium">
        <span>Конкурс завершён</span>
      </div>
    );
  }

  const blocks = [
    { value: days, label: 'дн' },
    { value: hours, label: 'ч' },
    { value: minutes, label: 'мин' },
    { value: seconds, label: 'сек' },
  ];

  return (
    <div className="flex items-center justify-center gap-2">
      {blocks.map((b, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="bg-purple-900/60 border border-purple-500/30 rounded-lg px-2.5 py-1.5 min-w-[44px] text-center backdrop-blur-sm">
            <span className="text-lg font-bold text-purple-100 tabular-nums">
              {String(b.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-purple-400 ml-0.5">{b.label}</span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-purple-500 text-lg font-light animate-pulse">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
