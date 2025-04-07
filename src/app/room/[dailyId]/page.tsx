"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import confetti from "canvas-confetti";

export default function RoomPage() {
  const { dailyId } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [daily, setDaily] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);

  const [isFinishing, setIsFinishing] = useState(false);

  const [hasPlayedConfetti, setHasPlayedConfetti] = useState(false);

  useEffect(() => {
    if (!daily?.finished) return;

    // ⏳ Mostrar overlay y lanzar confetti
    setIsFinishing(true);

    if (!hasPlayedConfetti) {
      setHasPlayedConfetti(true);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
      });
    }

    // 🚀 Redirigir luego de 3 segundos a todos
    const timeout = setTimeout(() => {
      router.push(`/summary/${dailyId}`);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [daily?.finished]);

  const [speakerReallyDisconnected, setSpeakerReallyDisconnected] = useState(false);

  const currentSpeakerUid = daily?.participantsOrder[daily?.currentSpeakerIndex];
  const currentSpeaker = participants.find((p) => p.id === currentSpeakerUid);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    if (currentSpeaker && currentSpeaker.id !== user?.uid) {
      if (!currentSpeaker.isConnected) {
        timeout = setTimeout(() => {
          setSpeakerReallyDisconnected(true);
        }, 3000);
      } else {
        setSpeakerReallyDisconnected(false);
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentSpeaker?.isConnected, currentSpeaker?.id, user?.uid]);

  let nextSpeakerUid: string | null = null;
  let nextSpeaker = null;

  if (
    daily &&
    daily.participantsOrder &&
    typeof daily.currentSpeakerIndex === "number" &&
    daily.currentSpeakerIndex < daily.participantsOrder.length - 1
  ) {
    nextSpeakerUid = daily.participantsOrder[daily.currentSpeakerIndex + 1];
    nextSpeaker = participants.find((p) => p.id === nextSpeakerUid);
  }

  const totalSpokenTime = participants
    .filter((p) => p.hasSpoken)
    .reduce((sum, p) => sum + (p.timeSpoken || 0), 0);

  const formatTime = (s: number) => new Date(s * 1000).toISOString().substr(11, 8);

  const [timer, setTimer] = useState<number>(0);
  const [localIsRunning, setLocalIsRunning] = useState(false);

  useEffect(() => {
    if (!daily?.timer || isFinishing) return; // 👈 evita actualizar si ya se está finalizando

    let interval: NodeJS.Timeout;

    const updateTimer = () => {
      const { isRunning, currentTime, lastUpdatedAt } = daily.timer;

      if (isRunning && lastUpdatedAt?.seconds) {
        const now = Date.now() / 1000;
        const elapsed = Math.floor(now - lastUpdatedAt.seconds);
        setTimer(currentTime + elapsed);
        setLocalIsRunning(true);
      } else {
        setTimer(currentTime || 0);
        setLocalIsRunning(false);
      }
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [daily?.timer, isFinishing]);

  const handlePause = async () => {
    const now = Date.now() / 1000;
    const elapsed = now - daily.timer.lastUpdatedAt.seconds;
    const newTime = daily.timer.currentTime + Math.floor(elapsed);

    await updateDoc(doc(db, "dailies", String(dailyId)), {
      "timer.currentTime": newTime,
      "timer.isRunning": false,
    });
  };

  const handleContinue = async () => {
    await updateDoc(doc(db, "dailies", String(dailyId)), {
      "timer.isRunning": true,
      "timer.lastUpdatedAt": new Date(),
    });
  };

  // Detectar usuario autenticado
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // 🚀 Soporte para manualUser desde localStorage
        const stored = localStorage.getItem("manualUser");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.id && parsed?.name) {
              setUser(parsed); // 👈 ahora el usuario anónimo funciona también
            }
          } catch (err) {
            console.error("Error leyendo manualUser:", err);
          }
        }
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!dailyId) return;

    const unsub = onSnapshot(doc(db, "dailies", String(dailyId)), async (snap) => {
      const data = snap.data();

      // ✅ Redirigir si la daily ya terminó
      if (data?.finished) {
        setDaily(data); // Asegura que el estado esté actualizado

        // Solo redirigimos después de unos segundos
        setTimeout(() => {
          router.push(`/summary/${dailyId}`);
        }, 3000); // ⏳ Espera 3 segundos
        return;
      }

      setDaily(data);

      // ✅ Cargar participantes según el orden
      if (data?.participantsOrder?.length) {
        const fullData = await Promise.all(
          data.participantsOrder.map(async (uid: string) => {
            const userDoc = await getDoc(doc(db, "dailies", String(dailyId), "participants", uid));
            return { id: uid, ...userDoc.data() };
          })
        );
        setParticipants(fullData);
      }
    });

    return () => unsub();
  }, [dailyId]);

  if (!daily || !user) return <p className="p-6">Cargando...</p>;

  const isLastSpeaker = daily.currentSpeakerIndex === daily.participantsOrder.length - 1;

  const isCurrentUser = user?.uid === daily.participantsOrder[daily.currentSpeakerIndex];
  const isFinalUser = isLastSpeaker && isCurrentUser; // último y actual orador

  const isFinishedGlobally = daily?.finished;

  const handleNext = async () => {
    const now = Date.now() / 1000;
    const { lastUpdatedAt, currentTime, isRunning } = daily.timer;

    // 1. Calcular tiempo hablado
    const secondsElapsed = isRunning
      ? Math.floor(now - lastUpdatedAt.seconds + currentTime)
      : currentTime;

    const currentUid = daily.participantsOrder[daily.currentSpeakerIndex];

    // 2. Guardar tiempo hablado e isOvertime
    await updateDoc(doc(db, "dailies", String(dailyId), "participants", currentUid), {
      timeSpoken: secondsElapsed,
      hasSpoken: true,
      isOvertime: secondsElapsed > daily.durationPerUser,
    });

    // 3. Siguiente orador o terminar
    const isLast = daily.currentSpeakerIndex === daily.participantsOrder.length - 1;

    if (isLast) {
      setIsFinishing(true); // ✅ Activar overlay para el orador también
      await updateDoc(doc(db, "dailies", String(dailyId)), {
        finished: true,
      });
    } else {
      await updateDoc(doc(db, "dailies", String(dailyId)), {
        currentSpeakerIndex: daily.currentSpeakerIndex + 1,
        timer: {
          isRunning: true,
          currentTime: 0,
          lastUpdatedAt: serverTimestamp(),
        },
      });
    }
  };

  const isSpectator = user && !daily.participantsOrder.includes(user.uid);

  const skipCurrentSpeaker = async () => {
    const nextIndex = daily.currentSpeakerIndex + 1;

    const updatedOrder = [...daily.participantsOrder];
    const skipped = updatedOrder.splice(daily.currentSpeakerIndex, 1);
    updatedOrder.push(skipped[0]); // mover al final

    await updateDoc(doc(db, "dailies", String(dailyId)), {
      participantsOrder: updatedOrder,
      currentSpeakerIndex: daily.currentSpeakerIndex, // mismo índice, nuevo user
      timer: {
        isRunning: true,
        currentTime: 0,
        lastUpdatedAt: serverTimestamp(),
      },
    });
  };

  const isOvertime = currentSpeaker?.isOvertime;

  return (
    <main className="min-h-screen bg-[#121212] text-white flex flex-col items-center px-4 py-8">
    <div className="w-full max-w-md space-y-6">
  
      {/* Título */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-orange-500">Sala Activa</h1>
      </div>
  
      {/* Overlay finalizando */}
      {isFinishedGlobally && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex animate-bounce items-center gap-2 text-2xl font-semibold text-white">
            🎉 Finalizando daily...
          </div>
        </div>
      )}
  
      {/* Participante actual */}
      <div className="p-4 rounded-xl shadow flex flex-col items-center text-center">
        {currentSpeaker ? (
          currentSpeaker.id === user?.uid ? (
            <>
              <img
                src={currentSpeaker.avatar}
                alt={currentSpeaker.name}
                className="h-10 w-10 rounded-full border-2 border-orange-500 mb-3"
              />
              <p className="text-lg font-semibold text-orange-400">
              ¡Es tu turno!
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <img
                  src={currentSpeaker.avatar}
                  alt={currentSpeaker.name}
                  className="h-10 w-10 rounded-full border"
                />
                <p className="text-base font-medium text-white">
                  <strong>{currentSpeaker.name}</strong> está hablando
                </p>
              </div>
            </>
          )
        ) : (
          <p className="text-white">Esperando participante...</p>
        )}
      </div>
  
      {/* Timer */}
      <div
  className={`text-center text-[6rem] md:text-[6rem] leading-none font-extrabold tracking-wider drop-shadow-2xl transition-colors duration-300 ${
    isOvertime
      ? "animate-pulse text-orange-500"
      : "text-orange-400"
  } font-nunito`}
>
  <strong>{new Date(timer * 1000).toISOString().substr(11, 8)}</strong>
</div>

  
      {/* Total hablado */}
      {totalSpokenTime !== 0 && (
        <p className="text-sm text-gray-400 text-center">
          Tiempo total hablado:{" "}
          <span className="font-mono">{formatTime(totalSpokenTime)}</span>
        </p>
      )}
  
      {/* Alertas */}
      {/* {speakerReallyDisconnected && (
        <p className="text-sm text-red-400 text-center">
          ⚠️ {currentSpeaker.name} se desconectó. Puedes pausar el tiempo o pasar al siguiente orador.
        </p>
      )} */}
  
      {isSpectator && (
        <p className="text-sm text-yellow-400 text-center">
          ⚠️ Esta daily ya comenzó. Estás como espectador.
        </p>
      )}
  
      {nextSpeakerUid === user?.uid && (
        <p className="text-sm font-semibold text-green-400 text-center">
          👋 ¡Prepárate! Tú eres el siguiente.
        </p>
      )}
  
      {/* Controles */}
<div className="flex flex-col items-center gap-4">
  <button
    onClick={localIsRunning ? handlePause : handleContinue}
    className={`py-3 px-6 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
      localIsRunning
        ? "bg-yellow-500 hover:bg-yellow-600"
        : "bg-blue-600 hover:bg-blue-700"
    }`}
  >
    {localIsRunning ? "⏸️ Pausar" : "▶️ Continuar"}
  </button>

  {isCurrentUser && !isLastSpeaker && nextSpeaker && (
    <button
      onClick={handleNext}
      className="py-3 px-6 bg-[#FF8A00] hover:bg-[#FF9D33] text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
    >
      ⚽ Le paso la pelota a {nextSpeaker.name}
    </button>
  )}

  {isFinalUser && (
    <button
      onClick={handleNext}
      className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
    >
      🎉 ¡Eres el último! Finalizar Daily
    </button>
  )}
</div>


    </div>
  </main>
  
  );
}
