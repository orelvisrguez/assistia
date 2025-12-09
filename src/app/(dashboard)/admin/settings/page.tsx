'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    lateThreshold: 15,
    geolocationRadius: 100,
    qrRotationInterval: 30,
    requireGeolocation: true,
    allowManualAttendance: true,
    autoEndSessions: true,
    autoEndHours: 4,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        alert('Configuración guardada correctamente');
      } else {
        alert('Error al guardar la configuración');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
        <p className="text-muted-foreground">
          Ajusta los parámetros del sistema de asistencia
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Configuración de Asistencia
              </CardTitle>
              <CardDescription>
                Parámetros para el registro de asistencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="lateThreshold">Umbral de Tardanza (minutos)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="lateThreshold"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.lateThreshold}
                    onChange={(e) => setSettings({ ...settings, lateThreshold: parseInt(e.target.value) || 15 })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Estudiantes que registren después de {settings.lateThreshold} minutos serán marcados como tarde
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir Asistencia Manual</Label>
                  <p className="text-sm text-muted-foreground">
                    Los profesores pueden registrar asistencia manualmente
                  </p>
                </div>
                <Switch
                  checked={settings.allowManualAttendance}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowManualAttendance: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Geolocation Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración de Geolocalización
              </CardTitle>
              <CardDescription>
                Control de ubicación para registro de asistencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Requerir Geolocalización</Label>
                  <p className="text-sm text-muted-foreground">
                    Verificar ubicación del estudiante al registrar
                  </p>
                </div>
                <Switch
                  checked={settings.requireGeolocation}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireGeolocation: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="geoRadius">Radio de Verificación (metros)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="geoRadius"
                    type="number"
                    min="10"
                    max="500"
                    value={settings.geolocationRadius}
                    onChange={(e) => setSettings({ ...settings, geolocationRadius: parseInt(e.target.value) || 100 })}
                    className="w-24"
                    disabled={!settings.requireGeolocation}
                  />
                  <span className="text-sm text-muted-foreground">
                    Distancia máxima permitida desde el aula
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* QR Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Configuración del Código QR
              </CardTitle>
              <CardDescription>
                Parámetros de seguridad del código QR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="qrInterval">Intervalo de Rotación (segundos)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="qrInterval"
                    type="number"
                    min="10"
                    max="120"
                    value={settings.qrRotationInterval}
                    onChange={(e) => setSettings({ ...settings, qrRotationInterval: parseInt(e.target.value) || 30 })}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    El código QR cambia cada {settings.qrRotationInterval} segundos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Session Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Configuración de Sesiones
              </CardTitle>
              <CardDescription>
                Control automático de sesiones de clase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Terminar Sesiones Automáticamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Cerrar sesiones después de un tiempo límite
                  </p>
                </div>
                <Switch
                  checked={settings.autoEndSessions}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoEndSessions: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoEndHours">Tiempo Límite (horas)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="autoEndHours"
                    type="number"
                    min="1"
                    max="12"
                    value={settings.autoEndHours}
                    onChange={(e) => setSettings({ ...settings, autoEndHours: parseInt(e.target.value) || 4 })}
                    className="w-24"
                    disabled={!settings.autoEndSessions}
                  />
                  <span className="text-sm text-muted-foreground">
                    Sesiones se cerrarán después de {settings.autoEndHours} horas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex justify-end"
      >
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Guardar Configuración
            </>
          )}
        </Button>
      </motion.div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Nota Importante</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Los cambios en la configuración afectarán todas las nuevas sesiones. Las sesiones activas 
                mantendrán la configuración con la que fueron creadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
