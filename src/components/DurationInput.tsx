"use client";

import { formatTime } from "@/utils/time"; // Asegúrate de tener este helper
import React from "react";

type Props = {
  duration: number;
  increase: () => void;
  decrease: () => void;
  isTyping: boolean;
  setIsTyping: (val: boolean) => void;
};

export const DurationInput = ({ duration, increase, decrease, isTyping, setIsTyping }: Props) => {
  const handleClick = (cb: () => void) => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 700);
    cb();
  };

  return (
    <div className="mb-6 flex flex-col items-center gap-2">
      <label className="text-md mb-4 text-gray-300">Tiempo por participante</label>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => handleClick(decrease)}
          className="h-10 w-10 rounded-full bg-orange-500 pb-2 text-3xl font-bold text-black shadow-md transition-transform hover:scale-105 hover:bg-orange-400 disabled:opacity-50"
          disabled={duration <= 60}
        >
          –
        </button>
        <div className="min-w-[6rem] rounded-lg border-2 border-orange-500 bg-[#1e1e1e] px-4 py-3 text-center text-2xl font-bold text-white shadow-inner">
          {formatTime(duration)}
        </div>
        <button
          type="button"
          onClick={() => handleClick(increase)}
          className="h-10 w-10 rounded-full bg-orange-500 pb-2 text-3xl font-bold text-black shadow-md transition-transform hover:scale-105 hover:bg-orange-400 disabled:opacity-50"
          disabled={duration >= 600}
        >
          +
        </button>
      </div>
    </div>
  );
};
