"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

import Lottie from "lottie-react";
import emojiGlassAnimation from "../res/emoji-glass.json";
import helloAnimation from "../res/hello.json";

export default function HomePage() {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60); // en segundos
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const increaseTime = () => {
    setDuration((prev) => Math.min(prev + 30, 600));
  };

  const decreaseTime = () => {
    setDuration((prev) => Math.max(prev - 30, 60));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const createDaily = async () => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "dailies"), {
        name,
        createdAt: serverTimestamp(),
        durationPerUser: duration,
        started: false,
        finished: false,
        currentSpeakerIndex: 0,
        timer: {
          isRunning: false,
          currentTime: 0,
          lastUpdatedAt: serverTimestamp(),
        },
        participantsOrder: [],
      });

      router.push(`/waiting/${docRef.id}`);
    } catch (error) {
      console.error("Error creando la sala:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-8 text-white">
      <Lottie animationData={helloAnimation} loop autoplay className="h-36 w-136" />

      {/* <h1 className="mb-6 text-3xl font-bold text-orange-500">Crear nueva Sala</h1> */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createDaily();
        }}
        className="flex w-full max-w-md flex-col gap-6"
      >
        <input
          type="text"
          placeholder="Nombre de la Daily"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-2 rounded-md border border-orange-500 bg-[#1e1e1e] p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:outline-none"
          required
        />

<div className="mb-6 flex flex-col items-center gap-2">
  <label className="text-sm text-gray-300">Tiempo por participante</label>
  <div className="flex items-center gap-6">
    <button
      type="button"
      onClick={decreaseTime}
      className="h-10 w-10 rounded-full bg-orange-500 text-3xl font-bold text-black shadow-md transition-transform hover:scale-105 hover:bg-orange-400 disabled:opacity-50"
      disabled={duration <= 60}
    >
      –
    </button>
    <div className="min-w-[6rem] rounded-lg border-2 border-orange-500 bg-[#1e1e1e] px-4 py-3 text-center text-2xl font-bold text-white shadow-inner">
      {formatTime(duration)}
    </div>
    <button
      type="button"
      onClick={increaseTime}
      className="h-10 w-10 rounded-full bg-orange-500 text-3xl font-bold text-black shadow-md transition-transform hover:scale-105 hover:bg-orange-400 disabled:opacity-50"
      disabled={duration >= 600}
    >
      +
    </button>
  </div>
</div>


        <button
          type="submit"
          className="self-center rounded bg-orange-500 px-6 py-2 text-lg font-medium text-black hover:bg-orange-400 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Sala"}
        </button>
      </form>
    </main>
  );
}
