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
    <main className="flex min-h-screen flex-col items-center p-6">
      <div
        ref={resumenRef}
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          padding: "24px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          fontFamily: "sans-serif",
          maxWidth: "400px",
          width: "100%",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ fontSize: "20px", marginBottom: "8px", textAlign: "center" }}>
          Resumen de la Daily
        </h2>

        <p style={{ fontSize: "14px", textAlign: "center", marginBottom: "16px" }}>{now}</p>

        <ul style={{ listStyle: "none", padding: 0 }}>
          {participants.map((p) => (
            <li key={p.id} style={{ marginBottom: "8px" }}>
              👤 <strong>{p.name}</strong> - {formatTime(p.timeSpoken)}{" "}
              {p.isOvertime && <span style={{ color: "red" }}>(overtime)</span>}
            </li>
          ))}
        </ul>

        <hr style={{ margin: "16px 0" }} />

        <p style={{ fontWeight: "bold", textAlign: "center" }}>
          Tiempo total: {formatTime(participants.reduce((sum, p) => sum + p.timeSpoken, 0))}
        </p>
      </div>

      <button
        onClick={handleDownload}
        className="rounded bg-gray-700 px-6 py-2 text-white hover:bg-gray-800"
      >
        Descargar Resumen
      </button>
      <button
        onClick={handleResetDaily}
        className="mt-6 rounded bg-green-700 px-6 py-2 text-white hover:bg-green-800"
      >
        Cerrar
      </button>
    </main>
  );
}
