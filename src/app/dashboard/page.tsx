'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  QrCode, History, LogOut, User, MapPin, Calendar, Clock,
  AlertCircle 
} from 'lucide-react';
import { config } from '@/lib/config';

interface UserData {
  id_kar: string;
  nama: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check session from localStorage
    const userData = localStorage.getItem('user_data');
    const sessionToken = localStorage.getItem('session_token');
    const deviceId = localStorage.getItem('device_id');
    const username = localStorage.getItem('username'); // ← ID_USER dari login
    
    if (!userData || !sessionToken || !deviceId || !username) {
      router.push('/login');
      return;
    }

    // Validate session dengan backend - PAKAI USERNAME (id_user)
    const validateSession = async () => {
      try {
        const response = await fetch(`${config.API_URL}/auth/validate-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: username, // ← PAKAI username (id_user), BUKAN id_kar
            device_id: deviceId 
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setUser(data.user);
        } else {
          console.log('Session validation failed:', data.message);
          // Fallback: use stored user data
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Session validation error:', error);
        // Fallback: use stored user data
        setUser(JSON.parse(userData));
      }
    };

    validateSession();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = async () => {
    if (!user) return;
    
    setIsLoggingOut(true);
    
    try {
      const deviceId = localStorage.getItem('device_id');
      const username = localStorage.getItem('username'); // ← ID_USER dari login
      
      const response = await fetch(`${config.API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username, // ← PAKAI username (id_user)
          device_id: deviceId 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Clear all storage
        localStorage.removeItem('user_data');
        localStorage.removeItem('session_token');
        localStorage.removeItem('device_id');
        localStorage.removeItem('login_time');
        localStorage.removeItem('username'); // ← HAPUS JUGA username
        
        router.push('/login');
      } else {
        alert(`Logout gagal: ${data.message}`);
      }
    } catch (error) {
      alert('Network error saat logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    {
      icon: QrCode,
      label: 'Scan Absensi',
      description: 'Scan QR code untuk absen',
      color: 'from-blue-500 to-cyan-500',
      href: '/scan'
    },
    {
      icon: History,
      label: 'Riwayat Absensi',
      description: 'Lihat history absensi',
      color: 'from-green-500 to-emerald-500',
      href: '/history'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all disabled:opacity-50"
          >
            {isLoggingOut ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{user.nama}</p>
              <p className="text-sm text-amber-100">ID: {user.id_kar}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Time */}
      <div className="px-6 -mt-6 mb-6">
        <div className="card p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{currentTime.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900">
            <Clock className="w-6 h-6" />
            <span>{currentTime.toLocaleTimeString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="px-6 space-y-4">
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className="w-full card p-6 text-left hover:shadow-xl transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  {item.label}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="px-6 mt-8">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Statistik Hari Ini</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">0</p>
              <p className="text-sm text-amber-700">Check In</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-sm text-green-700">Check Out</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}