"use client";

import { getFlagEmoji } from "@/utils";
import Image from "next/image";
import { useMemo } from "react";

type Props = {
  nextWorkdayLabel: string;
};

const locale = typeof navigator !== "undefined" ? navigator.language : "es-CL";
const countryCode = locale.split("-")[1] || "CL";

const holidayMessages = [
  "Aprovecha de regar las plantas 🌱",
  "¡Hora de ver una peli pendiente 🎬!",
  "Ideal para ordenar ese cajón caótico 🧦",
  "¿Y si horneas algo rico? 🧁",
  "Buen día para dormir una siesta 😴",
  "Día perfecto para leer ese libro 📚",
  "Saca a pasear al perrito 🐶",
  "¡Dale un descanso a la cabeza! 🧘‍♀️",
  "Tiempo para no hacer nada... y está bien 😌",
];

export const Holiday = ({ nextWorkdayLabel }: Props) => {
  const randomMessage = useMemo(() => {
    const index = Math.floor(Math.random() * holidayMessages.length);
    return holidayMessages[index];
  }, []);

  return (
    <>
      <Image
        src="/images/logoDailyRoom.png"
        alt="Logo"
        width={150}
        height={85}
        style={{ marginBottom: 30, left: 15, position: "relative" }}
      />
      <h1 className="mb-6" style={{ fontSize: 50 }}>
        ¡Es feriado! {getFlagEmoji(countryCode)}
      </h1>
      <p className="mb-6 text-center text-lg text-neutral-300">{randomMessage}</p>
      <small style={{ fontSize: 20, color: "#fa7f1d" }} className="italic">
        Nos vemos el {nextWorkdayLabel}...
      </small>
    </>
  );
};
