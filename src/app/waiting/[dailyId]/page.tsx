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
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-[#121212]">
  <div className="w-full max-w-md bg-[#1E1E1E] rounded-xl overflow-hidden border border-[#2A2A2A]">
    <div className="p-6 border-b border-[#2A2A2A]">
      <h1 className="text-2xl font-bold text-center text-white">Sala de Espera</h1>
    </div>

    <div className="px-6 pb-6 space-y-6 pt-6">
      {!user ? (
        <button
          onClick={handleLogin}
          className="w-full py-3 px-4 bg-[#FF8A00] hover:bg-[#FF9D33] text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
          Iniciar sesión con Google
        </button>
      ) : (
        <>
          <div className="flex items-center justify-between bg-[#2A2A2A] p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <img
                src={user?.photoURL}
                alt={user?.displayName}
                className="h-10 w-10 rounded-full border-2 border-[#FF8A00]"
              />
              <p className="text-white font-medium text-base">
                ¡Hola, {user?.displayName}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-transparent hover:bg-[#3A3A3A] text-[#FF8A00] border border-[#FF8A00] rounded-md text-sm font-medium transition-colors"
            >
              Cerrar sesión
            </button>
          </div>

          <div className="bg-[#2A2A2A] rounded-lg p-5 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-white border-b border-[#3A3A3A] pb-2">
              Participantes conectados
            </h2>
            <ul className="space-y-4">
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-2 hover:bg-[#3A3A3A] rounded-lg transition-colors"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#FF8A00]">
                    <img
                      src={p.avatar || "/placeholder.svg"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-gray-300 font-medium">{p.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="text-sm text-gray-400">Comparte este enlace:</label>
            <div className="flex gap-2 mt-2">
              <input
                readOnly
                value={typeof window !== "undefined" ? window.location.href : ""}
                className="flex-1 px-4 py-3 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8A00] text-white placeholder-gray-500"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="p-3 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#FF8A00] rounded-lg border border-[#3A3A3A] transition-colors"
              >
                📋
              </button>
            </div>
          </div>

          {user && !daily?.started && participants.length < MINIMUM_PARTICIPANTS && (
            <p className="mt-2 text-sm text-yellow-400 text-center">
              ⚠️ Se requieren al menos {MINIMUM_PARTICIPANTS} participantes conectados.
            </p>
          )}

          {user && participants.length >= MINIMUM_PARTICIPANTS && !daily?.started && (
            <button
              onClick={handleStartDaily}
              className="w-full py-3 px-4 bg-[#FF8A00] hover:bg-[#FF9D33] text-white font-medium rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
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
