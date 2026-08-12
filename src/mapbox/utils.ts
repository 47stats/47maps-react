/**
 * yyyymmを年月に変換します
 * @param date
 * @returns 年月
 */
export const getMonthString = (date: number | undefined): string => {
  if (date) {
    const yyyy = Math.floor(date / 100);
    const mm = date % 100;
    if (mm > 0) {
      const m_m = ("00" + mm).slice(-2); //zero-padding
      return `${yyyy}年${m_m}月`;
    }
    return `${yyyy}年`;
  }
  return "";
};
