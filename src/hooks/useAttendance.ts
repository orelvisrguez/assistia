'use client';

import { useState, useEffect } from 'react';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  markedAt: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export function useAttendance(sessionId: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`/api/attendance/list?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecords();
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return { records, isLoading, count: records.length };
}
