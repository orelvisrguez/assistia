'use client';

import { useAttendance } from '@/hooks/useAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, getInitials } from '@/lib/utils';

interface AttendanceListProps {
  sessionId: string;
}

export function AttendanceList({ sessionId }: AttendanceListProps) {
  const { records, isLoading, count } = useAttendance(sessionId);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Asistencia
          <Badge variant="success">{count} presentes</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : records.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Esperando estudiantes...
          </p>
        ) : (
          <ul className="space-y-2">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {getInitials(record.studentName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{record.studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(record.markedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
