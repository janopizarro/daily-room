function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getRandomDailyMessage(day: string): string {
  const frasesGenerales = [
    `¡Vamos que es ${day}! ¿Creas tú la sala?`,
    `${capitalize(day)} ya llegó, ¿te animas a crear la sala?`,
    `Vamos, que es ${day} 🙌 ¿Te toca crear la sala hoy?`,
    `¡Es ${day}! ¿Armas tú la sala esta vez?`,
    `Vamos que es ${day}… ¿y la sala? ¿La haces tú? 😄`,
    `¡Ya es ${day}! Crea tu sala para la daily de hoy.`,
    `Comienza el ${day} con foco: crea tu sala para la daily.`,
    `¿Cuánto hablarás este ${day}? Crea tu sala y descúbrelo.`,
  ];

  const frasesSoloAntesDelViernes = [
    `¡Vamos que es ${day}! Cada día más cerca del viernes 😅`,
    `Es ${day}, ¡pero el viernes ya se asoma 👀`,
    `¡Vamos! Ya es ${day}, el viernes está en camino 🚶‍♂️`,
  ];

  const frasesFinales =
    day.toLowerCase() === "viernes"
      ? frasesGenerales
      : [...frasesGenerales, ...frasesSoloAntesDelViernes];

  const randomIndex = Math.floor(Math.random() * frasesFinales.length);
  return frasesFinales[randomIndex];
}

export const getFlagEmoji = (countryCode: string): string => {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
};