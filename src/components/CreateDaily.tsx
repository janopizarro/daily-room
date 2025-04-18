"use client";

import { useState } from "react";
import { DurationInput } from "@/components/DurationInput";
import { useCreateDaily } from "@/hooks/useCreateDaily";

type Props = {
  isTyping: boolean;
  setIsTyping: (val: boolean) => void;
};

export const CreateDailyForm = ({ isTyping, setIsTyping }: Props) => {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const { createDaily, loading } = useCreateDaily({ name, duration });

  const increaseTime = () => setDuration((prev) => Math.min(prev + 30, 600));
  const decreaseTime = () => setDuration((prev) => Math.max(prev - 30, 60));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createDaily();
      }}
      className="flex w-full max-w-md flex-col gap-6"
    >
      {/* <input
        type="text"
        placeholder="Nombre de la Daily"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-2 rounded-md border border-orange-500 bg-[#1e1e1e] p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:outline-none"
        required
      /> */}

      <DurationInput
        duration={duration}
        increase={increaseTime}
        decrease={decreaseTime}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
      />

      <button
        type="submit"
        style={{ backgroundColor: "#fa7f1d" }}
        className="self-center rounded px-6 py-2 text-lg font-medium text-black hover:bg-orange-400 disabled:opacity-50"
        disabled={loading}
      >
        <strong style={{ fontSize: 22 }}>{loading ? "Creando..." : "Crear Sala"}</strong>
      </button>
    </form>
  );
};
