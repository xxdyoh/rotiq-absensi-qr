export const generateHardwareDeviceId = (): string => {
  const components = [
    // Hardware (same across browsers)
    navigator.hardwareConcurrency?.toString() || 'unknown',
    navigator.deviceMemory?.toString() || 'unknown',
    `${screen.width}x${screen.height}`,
    (navigator.maxTouchPoints || 0).toString(),
    
    // Platform group
    navigator.platform.includes('iPhone') ? 'iphone' : 
    navigator.platform.includes('iPad') ? 'ipad' : 
    navigator.platform.includes('Android') ? 'android' : 'other',
    
    // WebGL Renderer (most unique per device)
    getWebGLRenderer()
  ];
  
  const str = components.join('|');
  return 'device_' + simpleHash(str);
};

const getWebGLRenderer = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    // Type casting untuk WebGL context
    const webgl = gl as WebGLRenderingContext;
    const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
    
    if (debugInfo) {
      const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}|${renderer}`;
    }
    return 'webgl-no-debug';
  } catch (error) {
    return 'webgl-error';
  }
};

const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const getStoredDeviceId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('device_id');
};

export const storeDeviceId = (deviceId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('device_id', deviceId);
};

export const clearDeviceId = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('device_id');
};