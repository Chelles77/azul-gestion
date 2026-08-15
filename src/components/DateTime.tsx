'use client';

import { useEffect, useState } from 'react';

export default function DateTime() {
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setDate(formatter.format(now));
      setTime(timeFormatter.format(now));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-gray-800">
      <span>📅 {date}</span>
      <span>⏰ {time}</span>
    </div>
  );
}
