"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { auth, provider, signInWithPopup, signOut } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { shuffle } from "lodash";
import { useRouter } from "next/navigation";

const MINIMUM_PARTICIPANTS = 2;

export default function WaitingRoomPage() {
  const router = useRouter();

  const { dailyId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [daily, setDaily] = useState<any>(null);

  useEffect(() => {
    if (!dailyId) return;

    const unsub = onSnapshot(doc(db, "dailies", String(dailyId)), (snapshot) => {
      const data = snapshot.data();
      setDaily(data);

      if (data?.started) {
        router.push(`/room/${dailyId}`);
      }
    });

    return () => unsub();
  }, [dailyId]);

  // Escucha login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userRef = doc(db, "dailies", String(dailyId), "participants", currentUser.uid);

        // Guardar o actualizar participante
        await setDoc(
          userRef,
          {
            name: currentUser.displayName,
            avatar: currentUser.photoURL,
            isConnected: true,
            joinedAt: serverTimestamp(),
            hasSpoken: false,
            timeSpoken: 0,
            isOvertime: false,
          },
          { merge: true }
        );

        // Detectar cierre de pestaña
        const handleDisconnect = async () => {
          await updateDoc(userRef, { isConnected: false });
        };

        window.addEventListener("beforeunload", handleDisconnect);
        // document.addEventListener("visibilitychange", () => {
        //   updateDoc(userRef, { isConnected: document.visibilityState === "visible" });
        // });
      } else {
        setUser(null);
      }
    });

    return () => unsub();
  }, [dailyId]);

  // Escuchar participantes conectados
  useEffect(() => {
    if (!dailyId) return;

    const q = query(
      collection(db, "dailies", String(dailyId), "participants"),
      where("isConnected", "==", true)
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

  const handleLogin = async () => {
    await signInWithPopup(auth, provider);
  };

  const handleLogout = async () => {
    const userRef = doc(db, "dailies", String(dailyId), "participants", user.uid);
    await updateDoc(userRef, { isConnected: false });
    await signOut(auth);
  };

  const handleStartDaily = async () => {
    if (!dailyId) return;

    const snapshot = await getDocs(collection(db, "dailies", String(dailyId), "participants"));

    const participants = snapshot.docs.map((doc) => doc.id);
    const shuffled = shuffle(participants);

    const dailyRef = doc(db, "dailies", String(dailyId));
    await updateDoc(dailyRef, {
      started: true,
      participantsOrder: shuffled,
      currentSpeakerIndex: 0,
      timer: {
        isRunning: true,
        currentTime: 0,
        lastUpdatedAt: serverTimestamp(),
      },
    });

    router.push(`/room/${dailyId}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-4 md:p-8">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1E1E1E]">
        <div className="border-b border-[#2A2A2A] p-6">
          <h1 className="text-center text-2xl font-bold text-white">Sala de Espera</h1>
        </div>

        <div className="space-y-6 px-6 pt-6 pb-6">
          {!user ? (
            <button
              onClick={handleLogin}
              className="w-full transform rounded-lg bg-[#FF8A00] px-4 py-3 font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#FF9D33] active:scale-[0.98]"
            >
              Iniciar sesión con Google
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg bg-[#2A2A2A] p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={user?.photoURL}
                    alt={user?.displayName}
                    className="h-10 w-10 rounded-full border-2 border-[#FF8A00]"
                  />
                  <p className="text-base font-medium text-white">¡Hola, {user?.displayName}!</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-[#FF8A00] bg-transparent px-3 py-1.5 text-sm font-medium text-[#FF8A00] transition-colors hover:bg-[#3A3A3A]"
                >
                  Cerrar sesión
                </button>
              </div>

              <div className="rounded-lg bg-[#2A2A2A] p-5 shadow-xl">
                <h2 className="mb-4 border-b border-[#3A3A3A] pb-2 text-lg font-semibold text-white">
                  Participantes conectados
                </h2>
                <ul className="space-y-4">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-[#3A3A3A]"
                    >
                      <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-[#FF8A00]">
                        <img
                          src={p.avatar || "/placeholder.svg"}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-gray-300">{p.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="text-sm text-gray-400">Comparte este enlace:</label>
                <div className="mt-2 flex gap-2">
                  <input
                    readOnly
                    value={typeof window !== "undefined" ? window.location.href : ""}
                    className="flex-1 rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#FF8A00] focus:outline-none"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="rounded-lg border border-[#3A3A3A] bg-[#2A2A2A] p-3 text-[#FF8A00] transition-colors hover:bg-[#3A3A3A]"
                  >
                    📋
                  </button>
                </div>
              </div>

              {user && !daily?.started && participants.length < MINIMUM_PARTICIPANTS && (
                <p className="mt-2 text-center text-sm text-yellow-400">
                  ⚠️ Se requieren al menos {MINIMUM_PARTICIPANTS} participantes conectados.
                </p>
              )}

              {user && participants.length >= MINIMUM_PARTICIPANTS && !daily?.started && (
                <button
                  onClick={handleStartDaily}
                  className="w-full transform rounded-lg bg-[#FF8A00] px-4 py-3 font-medium text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#FF9D33] active:scale-[0.98]"
                >
                  Randomizar e Iniciar Daily
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
