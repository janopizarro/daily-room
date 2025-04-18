"use client";

import { formatTime } from "@/utils/time";
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
      <label className="mb-8 text-xl" style={{ color: "#fa7f1d" }}>
        ¿Cuánto podré hablar?
      </label>

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => handleClick(decrease)}
          className="h-10 w-10 rounded-full pb-2 text-3xl font-bold text-black shadow-md transition-transform hover:scale-105 hover:bg-orange-400 disabled:opacity-50"
          disabled={duration <= 60}
          style={{ backgroundColor: "#fa7f1d" }}
        >
          <strong style={{ top: -2, position: "relative" }}>–</strong>
        </button>
        <div
          style={{ borderColor: "#fa7f1d" }}
          className="min-w-[6rem] border-2 bg-[#1e1e1e] px-6 py-2 text-center font-bold text-white shadow-inner"
        >
          <h1 style={{fontSize: 34}}>{formatTime(duration)}</h1>
        </div>
        <button
          type="button"
          onClick={() => handleClick(increase)}
          className="h-10 w-10 rounded-full pb-2 text-3xl font-bold text-black shadow-md transition-transform hover:scale-105 hover:bg-orange-400 disabled:opacity-50"
          disabled={duration >= 600}
          style={{ backgroundColor: "#fa7f1d" }}
        >
          <strong>+</strong>
        </button>
      </div>
    </div>
  );
};
