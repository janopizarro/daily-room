"use client";

import Image from "next/image";

type Props = {
  nextWorkdayLabel: string;
};

export const Holiday = ({ nextWorkdayLabel }: Props) => (
  <>
    <Image
      src="/images/mimir.png"
      alt="Logo"
      width={200}
      height={200}
      style={{ marginBottom: 30, left: 15, position: "relative" }}
    />
    <p className="mb-6 text-4xl">¡Es feriado!</p>
    <small className="text-sm text-orange-500 italic">Nos vemos el {nextWorkdayLabel}...</small>
  </>
);
