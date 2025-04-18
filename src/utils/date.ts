// utils/date.ts
import Holidays from "date-holidays";
import moment from "moment";

export const getNextWorkday = (locale: string): { isHoliday: boolean; nextWorkday: Date; formattedDay: string } => {
  const countryCode = locale.split("-")[1];
  const hd = new Holidays(countryCode);
  const today = new Date();
  const isHoliday = !!hd.isHoliday(today);

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  const getNextWorkdayDate = (fromDate: Date): Date => {
    const date = new Date(fromDate);
    while (isWeekend(date) || hd.isHoliday(date)) {
      date.setDate(date.getDate() + 1);
    }
    return date;
  };

  const nextWorkday = getNextWorkdayDate(today);
  const formattedDay = moment(nextWorkday).locale("es").format("dddd");

  return {
    isHoliday,
    nextWorkday,
    formattedDay: formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1),
  };
};
