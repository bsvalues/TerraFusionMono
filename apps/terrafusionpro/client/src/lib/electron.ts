// This file provides an interface for interacting with Electron APIs
// It safely handles the case when running in a web browser without Electron

// Define types for IPC communication
interface IpcRenderer {
  send: (channel: string, ...args: any[]) => void;
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
}

// Create a safe interface to Electron's APIs
let ipcRenderer: IpcRenderer | null = null;

// Check if we're running in Electron or web browser
const isElectron = () => {
  // Renderer process
  if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
    return true;
  }

  // Main process
  if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to false
  if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
    return true;
  }

  return false;
};

// Only initialize the electron APIs if we're running in electron
if (isElectron()) {
  try {
    // In Electron, we'd use window.require to import electron modules
    // Note: In a real Electron app, you'd use contextBridge to expose these APIs safely
    const electron = (window as any).require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (e) {
    console.warn('Failed to initialize Electron IPC renderer:', e);
  }
} else {
  console.log('Running in web browser mode without Electron integration');
}

// Function to check if a panel can be detached to a new window
// This is useful for multi-monitor support in the appraisal platform
export function canDetachPanel(): boolean {
  return !!ipcRenderer;
}

// Functions for handling multi-monitor operations
export function getDisplays(): Promise<any[]> {
  return new Promise((resolve) => {
    if (!ipcRenderer) {
      resolve([{ id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 } }]);
      return;
    }

    ipcRenderer.send('get-displays');
    const listener = (_: any, displays: any[]) => {
      resolve(displays);
      ipcRenderer?.removeListener('get-displays-reply', listener);
    };
    ipcRenderer.on('get-displays-reply', listener);
  });
}

// Handle saving window positions for persistence between sessions
export function saveWindowState(windowId: string, bounds: { x: number, y: number, width: number, height: number }): void {
  if (ipcRenderer) {
    ipcRenderer.send('save-window-state', { windowId, bounds });
  }
}

export function getWindowState(windowId: string): Promise<{ x: number, y: number, width: number, height: number } | null> {
  return new Promise((resolve) => {
    if (!ipcRenderer) {
      resolve(null);
      return;
    }

    ipcRenderer.send('get-window-state', windowId);
    const listener = (_: any, state: any) => {
      resolve(state);
      ipcRenderer?.removeListener('get-window-state-reply', listener);
    };
    ipcRenderer.on('get-window-state-reply', listener);
  });
}

// Export the ipcRenderer for use in the app
export { ipcRenderer };

// Provide mock implementations for electron-specific features when running in a browser
export const mockElectronFeatures = {
  // Mock function for detaching a panel to a new window
  detachPanel(panelId: string, title: string, content: any): void {
    console.log(`Mock: detaching panel ${panelId} with title "${title}" to new window`);
    // In browser mode, we could open a new browser tab or window, but that's not ideal
    alert('This feature requires the Electron desktop app.');
  },

  // Mock function for saving data to local file system
  saveFile(data: any, defaultPath?: string): Promise<string | null> {
    console.log('Mock: saveFile called', { dataSize: typeof data === 'string' ? data.length : 'non-string', defaultPath });
    
    // In browser mode, we can use the browser's download API
    if (typeof data === 'string') {
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultPath?.split('/').pop() || 'download.txt';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      return Promise.resolve('browser-download');
    }
    
    return Promise.resolve(null);
  },

  // Mock function for opening a local file
  openFile(filters?: { name: string, extensions: string[] }[]): Promise<{ filePath: string, data: string } | null> {
    console.log('Mock: openFile called', { filters });
    alert('This feature requires the Electron desktop app.');
    return Promise.resolve(null);
  }
};
