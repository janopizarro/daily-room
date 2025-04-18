"use client";

import { useMemo, useState } from "react";

import { getNextWorkday } from "@/utils/date";

import moment from "moment";
import "moment/locale/es";

moment.locale("es");

import { motion } from "framer-motion";

import Image from "next/image";
import { Holiday } from "@/components/Holiday";
import { CreateDailyForm } from "@/components/CreateDaily";
import { getRandomDailyMessage } from "@/utils";

export default function HomePage() {
  const [isTyping, setIsTyping] = useState(false);

  const locale = navigator.language;
  const {
    isHoliday,
    formattedDay,
  } = getNextWorkday(locale);
  const nombreDia = moment().format("dddd");

  // only debug
  // const isHoliday = true;

  const [dailyMessage] = useState(() => getRandomDailyMessage(nombreDia));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] bg-[linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px),linear-gradient(180deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:20px_20px] p-0 text-white">
      {isHoliday ? (
        <Holiday nextWorkdayLabel={formattedDay} />
      ) : (
        <>
          <motion.div
            animate={isTyping ? { scale: [1, 1.2, 0.95, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <Image
              src="/images/logoDailyRoom.png"
              alt="Logo"
              width={200}
              height={20}
              style={{ marginBottom: 45 }}
            />
          </motion.div>

          <h1 className="text-md mb-2">{dailyMessage}</h1>

          <div className="mt-10 flex w-full justify-center bg-neutral-800/60 p-7 pb-10">
            <CreateDailyForm isTyping={isTyping} setIsTyping={setIsTyping} />
          </div>

          <small style={{ marginTop: 40 }}>Diseñado con GPT y debuggeado con cafeína ☕</small>
        </>
      )}
    </main>
  );
}
