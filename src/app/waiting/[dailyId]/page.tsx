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

  // const handleManualJoin = async () => {
  //   const id = crypto.randomUUID(); // uid temporal
  //   const avatar = `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(manualName)}`;
  
  //   const userObj = {
  //     id,
  //     name: manualName,
  //     avatar,
  //   };
  
  //   setManualUser(userObj);
  //   localStorage.setItem("manualUser", JSON.stringify(userObj));
  
  //   const userRef = doc(db, "dailies", String(dailyId), "participants", id);
  
  //   await setDoc(
  //     userRef,
  //     {
  //       name: manualName,
  //       avatar,
  //       isConnected: true,
  //       joinedAt: serverTimestamp(),
  //       hasSpoken: false,
  //       timeSpoken: 0,
  //       isOvertime: false,
  //     },
  //     { merge: true }
  //   );
  
  //   window.addEventListener("beforeunload", async () => {
  //     await updateDoc(userRef, { isConnected: false });
  //   });
  // };
  

  return (
    <main className="flex flex-col items-center p-6">
      {!user ? (
  <div className="flex flex-col items-center gap-4 mt-12">
    <p className="text-lg font-semibold">¿Quién eres?</p>

    <button
      onClick={handleLogin}
      className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
    >
      Iniciar sesión con Google
    </button>

    {/* <div className="w-full max-w-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleManualJoin();
        }}
        className="flex flex-col gap-2 mt-2"
      >
        <input
          type="text"
          placeholder="Ingresá tu nombre"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          className="rounded border px-3 py-2"
          required
        />
        <button
          type="submit"
          className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800"
        >
          Continuar sin cuenta
        </button>
      </form>
    </div> */}
  </div>
)  : (
        <>
{user && (
  <div className="mb-6 flex items-center justify-between w-full max-w-sm gap-4">
    <div className="flex items-center gap-3">
      <img
        src={user?.photoURL}
        alt={user?.displayName}
        className="h-9 w-9 rounded-full border"
        title={user?.email}
      />
      <p className="text-sm font-medium text-gray-100">
        ¡Hola, {user?.displayName}!
      </p>
    </div>

    <button
      onClick={handleLogout}
      className="rounded bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
    >
      Cerrar sesión
    </button>
  </div>
)}



          <h2 className="mb-2 text-l font-semibold">Participantes conectados:</h2>
          <ul className="w-full mb-6 max-w-sm space-y-4 rounded bg-gray-300 p-4">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <img src={p.avatar} alt={p.name} className="h-6 w-6 rounded-full border" />
                <span className="text-sm text-gray-900">{p.name}</span>
              </li>
            ))}
          </ul>

          <div className="mb-4 text-center">
            <p className="text-sm text-gray-400">Comparte este enlace para invitar a tu equipo:</p>
            <div className="mt-2 flex items-center justify-center">
              <input
                readOnly
                value={typeof window !== "undefined" ? window.location.href : ""}
                className="w-full max-w-md rounded border bg-gray-100 px-2 py-1 text-sm text-gray-600"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="mb-6 mt-1 text-xs text-blue-500 hover:underline"
          >
            Copiar enlace
          </button>

          {user && !daily?.started && participants.length < MINIMUM_PARTICIPANTS && (
  <p className="mt-4 text-sm text-yellow-600 text-center">
    ⚠️ Para iniciar la daily se requieren al menos {MINIMUM_PARTICIPANTS} participantes conectados.
  </p>
)}


{user && participants.length >= MINIMUM_PARTICIPANTS && !daily?.started && (
  <button
    onClick={handleStartDaily}
    className="mt-6 rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700"
  >
    Randomizar e Iniciar Daily
  </button>
)}
        </>
      )}
    </main>
  );
}
