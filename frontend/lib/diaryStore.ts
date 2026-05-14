import { useState, useEffect } from 'react';
import { DiaryEntry } from '../types';

let entries: DiaryEntry[] = [
  {
    id: 'd1',
    date: '2025년 11월 18일',
    time: '오전 9:30',
    plant: '몬스테라 델리시오사',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400',
    note: '새 잎이 펼쳐지고 있어요! 성장 상태가 좋아 보여요.',
    type: '성장 기록',
    source: 'manual',
  },
  {
    id: 'd2',
    date: '2025년 11월 10일',
    time: '오후 3:00',
    plant: '산세베리아',
    image: 'https://images.unsplash.com/photo-1593482892290-f54927ae1bb6?w=400',
    note: '물과 비료를 줬어요. 잎이 싱싱해 보여요.',
    type: '일상 관리',
    source: 'manual',
  },
  {
    id: 'd3',
    date: '2025년 11월 5일',
    time: '오후 2:00',
    plant: '몬스테라 델리시오사',
    image: 'https://images.unsplash.com/photo-1614594895304-fe7116ac3b58?w=400',
    note: '건강 상태 양호. 잎에 윤기가 흐르고 있어요.',
    type: 'AI 진단',
    source: 'ai',
    confidence: 94,
  },
];

const listeners: Array<() => void> = [];

function notify() {
  listeners.forEach((fn) => fn());
}

export function addDiaryEntry(entry: Omit<DiaryEntry, 'id'>) {
  entries = [{ ...entry, id: Date.now().toString() }, ...entries];
  notify();
}

export function useDiaryEntries(): DiaryEntry[] {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);
  return entries;
}
