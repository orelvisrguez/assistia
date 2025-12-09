import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

// In production, these would be stored in a database
let systemSettings = {
  lateThreshold: 15,
  geolocationRadius: 100,
  qrRotationInterval: 30,
  requireGeolocation: true,
  allowManualAttendance: true,
  autoEndSessions: true,
  autoEndHours: 4,
};

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json({ settings: systemSettings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate and update settings
    systemSettings = {
      lateThreshold: Math.min(60, Math.max(1, body.lateThreshold || 15)),
      geolocationRadius: Math.min(500, Math.max(10, body.geolocationRadius || 100)),
      qrRotationInterval: Math.min(120, Math.max(10, body.qrRotationInterval || 30)),
      requireGeolocation: Boolean(body.requireGeolocation),
      allowManualAttendance: Boolean(body.allowManualAttendance),
      autoEndSessions: Boolean(body.autoEndSessions),
      autoEndHours: Math.min(12, Math.max(1, body.autoEndHours || 4)),
    };

    return NextResponse.json({ success: true, settings: systemSettings });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
