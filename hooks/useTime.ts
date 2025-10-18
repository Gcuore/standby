import { useState, useEffect } from 'react';

export const useTime = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // Manually format the time to ensure the colon is always present
  const pad = (num: number) => num.toString().padStart(2, '0');
  const timeString = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const dayOfMonth = now.getDate();

  return { timeString, dayOfWeek, dayOfMonth };
};
