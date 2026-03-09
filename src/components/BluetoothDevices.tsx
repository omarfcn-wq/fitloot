import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bluetooth, BluetoothSearching, BluetoothConnected, Heart, Signal, Unlink } from "lucide-react";
import { useBluetooth, BleDeviceInfo } from "@/hooks/useBluetooth";

export function BluetoothDevices() {
  const {
    isNative,
    isScanning,
    isConnecting,
    discoveredDevices,
    connectedDevice,
    heartRate,
    scanDevices,
    stopScan,
    connectDevice,
    disconnectDevice,
    startHeartRateMonitor,
    stopHeartRateMonitor,
  } = useBluetooth();

  if (!isNative) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bluetooth className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle>Bluetooth BLE</CardTitle>
              <CardDescription>
                Conecta directamente a bandas de frecuencia cardíaca y sensores fitness
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
            <Bluetooth className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              La conexión Bluetooth está disponible únicamente en la app nativa para móvil.
              Exporta el proyecto y compílalo con Capacitor para usar esta función.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connectedDevice ? (
              <BluetoothConnected className="h-6 w-6 text-primary" />
            ) : (
              <Bluetooth className="h-6 w-6 text-primary" />
            )}
            <div>
              <CardTitle>Bluetooth BLE</CardTitle>
              <CardDescription>
                Conecta bandas cardíacas y sensores fitness cercanos
              </CardDescription>
            </div>
          </div>
          {connectedDevice && (
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
              Conectado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Device */}
        {connectedDevice && (
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BluetoothConnected className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                  {connectedDevice.name ?? connectedDevice.deviceId.slice(0, 8)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnectDevice}
                className="text-destructive hover:text-destructive gap-1"
              >
                <Unlink className="h-3 w-3" />
                Desconectar
              </Button>
            </div>

            {/* Heart Rate */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className={`h-5 w-5 ${heartRate ? 'text-red-400 animate-pulse' : 'text-muted-foreground'}`} />
                {heartRate !== null ? (
                  <span className="text-2xl font-bold text-foreground">{heartRate} <span className="text-sm font-normal text-muted-foreground">bpm</span></span>
                ) : (
                  <span className="text-sm text-muted-foreground">Sin datos</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={heartRate !== null ? stopHeartRateMonitor : startHeartRateMonitor}
                className="gap-1"
              >
                <Heart className="h-3 w-3" />
                {heartRate !== null ? 'Detener' : 'Monitorear'}
              </Button>
            </div>
          </div>
        )}

        {/* Scan Controls */}
        <div className="flex gap-2">
          <Button
            onClick={isScanning ? stopScan : () => scanDevices()}
            variant={isScanning ? "secondary" : "default"}
            className="gap-2"
          >
            {isScanning ? (
              <>
                <BluetoothSearching className="h-4 w-4 animate-pulse" />
                Buscando...
              </>
            ) : (
              <>
                <Bluetooth className="h-4 w-4" />
                Buscar dispositivos
              </>
            )}
          </Button>
        </div>

        {/* Discovered Devices */}
        {discoveredDevices.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Dispositivos encontrados ({discoveredDevices.length})
            </p>
            {discoveredDevices.map((device) => (
              <DeviceRow
                key={device.deviceId}
                device={device}
                isConnecting={isConnecting}
                isConnected={connectedDevice?.deviceId === device.deviceId}
                onConnect={() => connectDevice(device)}
              />
            ))}
          </div>
        )}

        {isScanning && discoveredDevices.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Buscando dispositivos cercanos...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeviceRow({
  device,
  isConnecting,
  isConnected,
  onConnect,
}: {
  device: BleDeviceInfo;
  isConnecting: boolean;
  isConnected: boolean;
  onConnect: () => void;
}) {
  const signalStrength = device.rssi
    ? device.rssi > -60 ? 'Excelente' : device.rssi > -80 ? 'Buena' : 'Débil'
    : null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-3">
        <Bluetooth className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {device.name ?? `Dispositivo ${device.deviceId.slice(0, 8)}`}
          </p>
          {signalStrength && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Signal className="h-3 w-3" />
              Señal: {signalStrength}
            </div>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant={isConnected ? "secondary" : "outline"}
        onClick={onConnect}
        disabled={isConnecting || isConnected}
        className="gap-1"
      >
        {isConnecting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isConnected ? (
          'Conectado'
        ) : (
          'Conectar'
        )}
      </Button>
    </div>
  );
}
