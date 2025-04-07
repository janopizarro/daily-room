"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function HomePage() {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(180);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        participantsOrder: [], // se llenará al iniciar
      });

      router.push(`/waiting/${docRef.id}`);
    } catch (error) {
      console.error("Error creando la sala:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-6 text-3xl font-bold">Crear nueva Daily</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createDaily();
        }}
        className="flex w-full max-w-md flex-col gap-4"
      >
        <input
          type="text"
          placeholder="Nombre de la Daily"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border p-3"
          required
        />
        <input
          type="number"
          placeholder="Tiempo por participante (segundos)"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="rounded-md border p-3"
          required
        />
        <button
          type="submit"
          className="rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creando..." : "Crear Sala"}
        </button>
      </form>
    </main>
  );
}
