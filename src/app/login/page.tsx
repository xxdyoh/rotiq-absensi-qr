'use client';
import { useState, useEffect } from 'react';
import { Fingerprint, Smartphone, Shield, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateHardwareDeviceId, getStoredDeviceId, storeDeviceId } from '@/lib/deviceFingerprint';
import { config } from '@/lib/config';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'username' | 'otp'>('username');
  const [isLoading, setIsLoading] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [deviceStatus, setDeviceStatus] = useState<'available' | 'locked' | 'checking'>('checking');
  const [lockedUser, setLockedUser] = useState<{ id_kar: string; nama: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    checkDeviceStatus();
  }, []);

  const checkDeviceStatus = async () => {
    let currentDeviceId = getStoredDeviceId();
    if (!currentDeviceId) {
      currentDeviceId = generateHardwareDeviceId();
      storeDeviceId(currentDeviceId);
    }
    setDeviceId(currentDeviceId);

    try {
      const response = await fetch(`${config.API_URL}/auth/check-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: currentDeviceId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeviceStatus('available');
      } else {
        setDeviceStatus('locked');
        setLockedUser(data.locked_by || null);
      }
    } catch (error) {
      console.error('Device check error:', error);
      setDeviceStatus('available');
    }
  };

  const handleRequestOTP = async () => {
    if (!username.trim()) {
      setErrorMessage('Username harus diisi');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(`${config.API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }) 
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStep('otp');
      } else {
        setErrorMessage(data.message || 'Gagal meminta OTP');
      }
    } catch (error) {
      console.error('Request OTP error:', error);
      setErrorMessage(`Network error! Pastikan backend running di ${config.API_URL}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setErrorMessage('OTP harus 6 digit');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const response = await fetch(`${config.API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          otp: otp.trim(), 
          device_id: deviceId 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // SIMPAN SEMUA DATA YANG DIBUTUHKAN
        localStorage.setItem('session_token', data.session_token);
        localStorage.setItem('user_data', JSON.stringify(data.user)); 
        localStorage.setItem('device_id', deviceId);
        localStorage.setItem('login_time', new Date().toISOString());
        localStorage.setItem('username', username.trim()); // ← SIMPAN USERNAME UNTUK DASHBOARD
        
        router.push('/dashboard');
      } else {
        setErrorMessage(data.message || 'Verifikasi OTP gagal');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setErrorMessage('Network error! Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('username');
    setOtp('');
    setErrorMessage('');
  };

  // Loading state
  if (deviceStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Fingerprint className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa status perangkat...</p>
        </div>
      </div>
    );
  }

  if (deviceStatus === 'locked') {
    const phoneNumber = '+62895055654708';
    const whatsappUrl = `https://wa.me/${phoneNumber}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Device Sudah Digunakan
            </h3>
            <p className="text-gray-600 mb-4">
              Perangkat ini sudah terkunci oleh user lain dan tidak dapat digunakan untuk login.
            </p>
            
            {lockedUser && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-red-800">User yang login di device ini:</p>
                <p className="text-red-700 font-semibold">{lockedUser.nama}</p>
                <p className="text-red-600 text-sm">ID: {lockedUser.id_kar}</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600">
                Untuk menggunakan perangkat ini, user yang terkunci harus logout terlebih dahulu.
              </p>
              <p className="text-xs text-gray-500">
                Atau hubungi IT via WhatsApp untuk reset device lock.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893c0-3.18-1.24-6.169-3.495-8.424"/>
                </svg>
                Hubungi Admin via WhatsApp
              </a>

              <button
                onClick={checkDeviceStatus}
                className="w-full py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
              >
                <Loader2 className="w-4 h-4" />
                Cek Status Ulang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Fingerprint className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{config.APP_NAME}</h1>
        </div>

        <div className="card p-8 animate-slide-up">
          {step === 'username' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Username
                </label>
                <div className="relative">
                  <Smartphone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Masukkan username Anda"
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white/80 disabled:opacity-50"
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && username.trim()) {
                        handleRequestOTP();
                      }
                    }}
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                  <p className="text-sm text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMessage}
                  </p>
                </div>
              )}

              <button
                onClick={handleRequestOTP}
                disabled={!username.trim() || isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Minta OTP
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Verifikasi OTP</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Masukkan 6 digit OTP
                </p>
                <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded-lg">
                  Username: <span className="font-semibold">{username}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Kode OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    setErrorMessage('');
                  }}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white/80 disabled:opacity-50"
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && otp.length === 6) {
                      handleVerifyOTP();
                    }
                  }}
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                  <p className="text-sm text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  disabled={isLoading}
                  className="flex-1 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </button>
                <button
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6 || isLoading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    'Verifikasi'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}