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

export default function HomePage() {
  const [isTyping, setIsTyping] = useState(false);

  const randomImage = useMemo(() => {
    const images = ["/images/hi.png", "/images/hi-2.png", "/images/hi-3.png", "/images/hi-4.png"];
    return images[Math.floor(Math.random() * images.length)];
  }, []);

  const locale = navigator.language;
  const { isHoliday, formattedDay } = getNextWorkday(locale);
  const nombreDia = moment().format("dddd");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#121212] p-8 text-white">
      {isHoliday ? (
        <Holiday nextWorkdayLabel={formattedDay} />
      ) : (
        <>
          <motion.div
            animate={
              isTyping ? { rotate: [0, -10, 10, -15, 15, -10, 10, -5, 5, -5] } : { rotate: 0 }
            }
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <Image
              src={randomImage}
              alt="Logo"
              width={200}
              height={200}
              style={{ marginBottom: 30 }}
            />
          </motion.div>

          <p className="text-md mb-6">Ya es {nombreDia}, crea tu sala para la daily de hoy</p>
          <CreateDailyForm isTyping={isTyping} setIsTyping={setIsTyping} />

        </>
      )}
    </main>
  );
}
