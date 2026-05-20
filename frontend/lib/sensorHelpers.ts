export const getMoistureStatus = (v?: number) => {
  if (v == null) return '-';
  if (v < 20) return '부족';
  if (v > 80) return '과다';
  return '적정';
};

export const getTempStatus = (v?: number) => {
  if (v == null) return '-';
  if (v < 15 || v > 30) return '주의';
  return '좋음';
};

export const getHumidityStatus = (v?: number) => {
  if (v == null) return '-';
  if (v < 30) return '건조';
  if (v > 70) return '습함';
  return '쾌적';
};

export const getIlluminanceStatus = (v?: number) => {
  if (v == null) return '-';
  if (v < 100) return '어두움';
  if (v > 10000) return '강함';
  return '충분';
};
