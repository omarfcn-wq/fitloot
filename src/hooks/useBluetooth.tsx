import { useState, useCallback } from 'react';
import { BleClient, BleDevice, ScanResult } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export interface BleDeviceInfo {
  deviceId: string;
  name: string | null;
  rssi: number | null;
  services: string[];
}

// Common BLE service UUIDs for fitness devices
const HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
const CYCLING_POWER_SERVICE = '00001818-0000-1000-8000-00805f9b34fb';
const RUNNING_SPEED_SERVICE = '00001814-0000-1000-8000-00805f9b34fb';
const FITNESS_MACHINE_SERVICE = '00001826-0000-1000-8000-00805f9b34fb';

const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';

const FITNESS_SERVICES = [
  HEART_RATE_SERVICE,
  CYCLING_POWER_SERVICE,
  RUNNING_SPEED_SERVICE,
  FITNESS_MACHINE_SERVICE,
];

export const useBluetooth = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<BleDeviceInfo[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BleDeviceInfo | null>(null);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [isNative, setIsNative] = useState(Capacitor.isNativePlatform());

  const initialize = useCallback(async () => {
    if (!isNative) {
      toast.error('Bluetooth BLE solo está disponible en la app nativa');
      return false;
    }

    try {
      await BleClient.initialize({ androidNeverForLocation: true });
      setIsInitialized(true);
      return true;
    } catch (error: any) {
      console.error('BLE init error:', error);
      toast.error('Error al inicializar Bluetooth');
      return false;
    }
  }, [isNative]);

  const scanDevices = useCallback(async (duration = 10000) => {
    if (!isInitialized) {
      const ok = await initialize();
      if (!ok) return;
    }

    try {
      setIsScanning(true);
      setDiscoveredDevices([]);

      await BleClient.requestLEScan(
        { services: FITNESS_SERVICES, allowDuplicates: false },
        (result: ScanResult) => {
          const device: BleDeviceInfo = {
            deviceId: result.device.deviceId,
            name: result.device.name ?? result.localName ?? null,
            rssi: result.rssi ?? null,
            services: result.uuids ?? [],
          };

          setDiscoveredDevices((prev) => {
            if (prev.some((d) => d.deviceId === device.deviceId)) return prev;
            return [...prev, device];
          });
        }
      );

      // Stop scan after duration
      setTimeout(async () => {
        try {
          await BleClient.stopLEScan();
        } catch { /* ignore */ }
        setIsScanning(false);
      }, duration);
    } catch (error: any) {
      console.error('Scan error:', error);
      setIsScanning(false);
      toast.error('Error al buscar dispositivos');
    }
  }, [isInitialized, initialize]);

  const stopScan = useCallback(async () => {
    try {
      await BleClient.stopLEScan();
    } catch { /* ignore */ }
    setIsScanning(false);
  }, []);

  const connectDevice = useCallback(async (device: BleDeviceInfo) => {
    try {
      setIsConnecting(true);

      await BleClient.connect(device.deviceId, (deviceId) => {
        console.log('Device disconnected:', deviceId);
        setConnectedDevice(null);
        setHeartRate(null);
        toast.info(`${device.name ?? 'Dispositivo'} desconectado`);
      });

      setConnectedDevice(device);
      toast.success(`Conectado a ${device.name ?? 'dispositivo BLE'}`);
      return true;
    } catch (error: any) {
      console.error('Connect error:', error);
      toast.error('Error al conectar dispositivo');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectDevice = useCallback(async () => {
    if (!connectedDevice) return;

    try {
      await BleClient.disconnect(connectedDevice.deviceId);
      setConnectedDevice(null);
      setHeartRate(null);
    } catch (error: any) {
      console.error('Disconnect error:', error);
    }
  }, [connectedDevice]);

  const startHeartRateMonitor = useCallback(async () => {
    if (!connectedDevice) {
      toast.error('No hay dispositivo conectado');
      return;
    }

    try {
      await BleClient.startNotifications(
        connectedDevice.deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT,
        (value) => {
          // Heart Rate Measurement parsing (BLE spec)
          const flags = value.getUint8(0);
          const is16Bit = flags & 0x01;
          const hr = is16Bit ? value.getUint16(1, true) : value.getUint8(1);
          setHeartRate(hr);
        }
      );
    } catch (error: any) {
      console.error('HR monitor error:', error);
      toast.error('Error al leer frecuencia cardíaca');
    }
  }, [connectedDevice]);

  const stopHeartRateMonitor = useCallback(async () => {
    if (!connectedDevice) return;

    try {
      await BleClient.stopNotifications(
        connectedDevice.deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT
      );
      setHeartRate(null);
    } catch (error: any) {
      console.error('Stop HR error:', error);
    }
  }, [connectedDevice]);

  return {
    isNative,
    isInitialized,
    isScanning,
    isConnecting,
    discoveredDevices,
    connectedDevice,
    heartRate,
    initialize,
    scanDevices,
    stopScan,
    connectDevice,
    disconnectDevice,
    startHeartRateMonitor,
    stopHeartRateMonitor,
  };
};
