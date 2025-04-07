"use client";

import { useParams, useRouter } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import html2canvas from "html2canvas";

export default function SummaryPage() {
  const resumenRef = useRef(null);

  const router = useRouter();

  const { dailyId } = useParams();
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (!dailyId) return;

    const q = query(
      collection(db, "dailies", String(dailyId), "participants"),
      where("hasSpoken", "==", true)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParticipants(list);
    });

    return () => unsub();
  }, [dailyId]);

  useEffect(() => {
    if (!dailyId) return;

    const unsub = onSnapshot(doc(db, "dailies", String(dailyId)), (snapshot) => {
      const data = snapshot.data();

      if (!data) return;

      // 🔄 Redirige a sala de espera si se reinició
      if (!data.started || data.finished === false) {
        router.push(`/waiting/${dailyId}`);
      }

      // ✅ Redirige al resumen si terminó
      if (data.finished === true) {
        router.push(`/summary/${dailyId}`);
      }
    });

    return () => unsub();
  }, [dailyId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const [now, setNow] = useState("");

  useEffect(() => {
    const fecha = new Date();
    const fechaStr = `${fecha.toLocaleDateString()} - ${fecha.toLocaleTimeString()}`;
    setNow(fechaStr);
  }, []);

  const handleResetDaily = async () => {
    // Reiniciar estado de la daily
    await updateDoc(doc(db, "dailies", String(dailyId)), {
      started: false,
      finished: false,
      currentSpeakerIndex: 0,
      participantsOrder: [],
      timer: {
        isRunning: false,
        currentTime: 0,
        lastUpdatedAt: null,
      },
    });

    // Reiniciar estado de cada participante
    const snapshot = await getDocs(collection(db, "dailies", String(dailyId), "participants"));

    const promises = snapshot.docs.map((docSnap) =>
      updateDoc(docSnap.ref, {
        hasSpoken: false,
        timeSpoken: 0,
        isOvertime: false,
      })
    );

    await Promise.all(promises);

    router.push(`/waiting/${dailyId}`);
  };

  const handleDownload = async () => {
    if (!resumenRef.current) return;

    const canvas = await html2canvas(resumenRef.current, {
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const dataUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "resumen-daily.png";
    link.click();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] text-white px-4 py-8">
  {/* Tarjeta de resumen */}
  <div
    ref={resumenRef}
    className="w-full max-w-md bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl shadow-lg p-6 text-white font-nunito mb-8"
  >
    <h2 className="text-3xl font-bold text-center text-orange-500 mb-2">
      Resumen de la Daily
    </h2>

    <p className="text-sm text-center text-gray-400 mb-8">{now}</p>

    <ul className="space-y-3 text-center">
      {participants.map((p) => (
        <li key={p.id} className="text-l">
          <strong className="text-orange-400">{p.name}</strong> – {formatTime(p.timeSpoken)}{" "}
          {p.isOvertime && <span className="text-red-500 font-semibold">🔥</span>}
        </li>
      ))}
    </ul>

    <hr className="my-4 border-gray-700" />

    <p className="text-center text-base font-bold text-white">
      Tiempo total:{" "}
      {formatTime(participants.reduce((sum, p) => sum + p.timeSpoken, 0))}
    </p>
  </div>

  {/* Botones */}
  <div className="flex flex-col gap-4 items-center">
    <button
      onClick={handleDownload}
      className="px-6 py-3 bg-[#FF8A00] hover:bg-[#FF9D33] text-black font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
    >
      Descargar Resumen
    </button>
    <button
      onClick={handleResetDaily}
      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
    >
      Reiniciar
    </button>
  </div>
</main>

  );
}
