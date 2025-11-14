'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, MapPin, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { config } from '@/lib/config';

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [cabangData, setCabangData] = useState<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const router = useRouter();

  useEffect(() => {
    getCurrentLocation();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner.", error);
        });
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung browser ini');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        setLocationError('Gagal mendapatkan lokasi: ' + error.message);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 60000 
      }
    );
  };

  const startScanner = () => {
    if (scannerRef.current) return;

    // Config untuk camera only
    const scannerConfig = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      supportedScanTypes: [], // No file upload
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
    };

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      scannerConfig,
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        handleScanResult(decodedText);
      },
      (error) => {
        // Ignore errors
      }
    );
    
    setIsScanning(true);

    // Remove file upload elements after render
    setTimeout(() => {
      const qrReader = document.getElementById('qr-reader');
      if (qrReader) {
        // Hide file upload sections
        const sections = qrReader.querySelectorAll('div');
        sections.forEach(section => {
          if (section.innerHTML.includes('file') || section.innerHTML.includes('image')) {
            section.style.display = 'none';
          }
        });
      }
    }, 100);
  };

  const handleScanResult = (decodedText: string) => {
    try {
      const qrData = JSON.parse(decodedText);
      setCabangData(qrData.data[0]);
      setScanResult(decodedText);
      
      if (scannerRef.current) {
        scannerRef.current.clear();
        setIsScanning(false);
      }
    } catch (error) {
      alert('QR Code tidak valid! Pastikan scan QR code yang benar.');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAbsen = async (type: 'checkin' | 'checkout') => {
    if (!cabangData || !location) return;

    const distance = calculateDistance(
      location.lat, location.lng,
      cabangData.lat, cabangData.long
    );

    if (distance > cabangData.toleransi) {
      alert(`Anda terlalu jauh dari lokasi absen! Jarak: ${distance.toFixed(0)}m, Maks: ${cabangData.toleransi}m`);
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      
      const response = await fetch(`${config.API_URL}/karyawan/absen`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          id_kar: userData.id_kar,
          id_cabang: cabangData.id_cabang.toString()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Absen ${type} berhasil!`);
        router.push('/dashboard');
      } else {
        alert('Absen gagal: ' + result.message);
      }
    } catch (error) {
      alert('Network error!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Scan QR Absensi</h1>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Location Status */}
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Lokasi Saat Ini</p>
              {location ? (
                <p className="text-sm text-gray-600">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-sm text-amber-600">
                  {locationError || 'Mendeteksi lokasi...'}
                </p>
              )}
            </div>
            <button 
              onClick={getCurrentLocation}
              className="p-2 bg-amber-100 rounded-lg hover:bg-amber-200 transition-all"
            >
              <MapPin className="w-4 h-4 text-amber-600" />
            </button>
          </div>
        </div>

        {/* QR Scanner */}
        {!scanResult && (
          <div className="card p-6 text-center">
            <div id="qr-reader" className="mb-4"></div>
            
            {!isScanning ? (
              <button
                onClick={startScanner}
                disabled={!location}
                className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Mulai Scan QR Code
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-600">Scanning QR Code...</p>
                <p className="text-sm text-gray-500">Arahkan kamera ke QR Code cabang</p>
              </div>
            )}
          </div>
        )}

        {/* Scan Result */}
        {scanResult && cabangData && (
          <div className="card p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <h3 className="font-semibold text-gray-900">QR Code Terbaca</h3>
                <p className="text-sm text-gray-600">Cabang: {cabangData.nama}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">ID Cabang:</span>
                <span className="font-medium">{cabangData.id_cabang}</span>
              </div>
              {/* <div className="flex justify-between">
                <span className="text-gray-600">Koordinat:</span>
                <span className="font-medium">{cabangData.lat}, {cabangData.long}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Toleransi:</span>
                <span className="font-medium">{cabangData.toleransi}m</span>
              </div> */}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAbsen('checkin')}
                className="py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all"
              >
                Check In
              </button>
              <button
                onClick={() => handleAbsen('checkout')}
                className="py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all"
              >
                Check Out
              </button>
            </div>

            <button
              onClick={() => {
                setScanResult(null);
                setCabangData(null);
                startScanner();
              }}
              className="w-full mt-3 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Scan Ulang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}