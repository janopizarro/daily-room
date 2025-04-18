import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Props = {
  name: string;
  duration: number;
};

export const useCreateDaily = ({ name, duration }: Props) => {
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
        participantsOrder: [],
      });

      router.push(`/waiting/${docRef.id}`);
    } catch (error) {
      console.error("Error creando la sala:", error);
    } finally {
      setLoading(false);
    }
  };

  return { createDaily, loading };
};
