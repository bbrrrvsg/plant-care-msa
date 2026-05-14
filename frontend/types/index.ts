export interface DiaryEntry {
  id: string;
  date: string;
  time: string;
  plant: string;
  image: string;
  note: string;
  type: string;
  source: 'manual' | 'ai';
  confidence?: number;
}
