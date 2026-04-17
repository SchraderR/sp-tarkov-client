interface ElectronAPI {
  send: (channel: string, ...args: unknown[]) => void;
  on: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
  once: (channel: string, listener: (event: unknown, ...args: unknown[]) => void) => void;
  removeAllListeners: (channel: string) => void;
  openExternal: (url: string) => Promise<void>;
  openPath: (path: string) => Promise<string>;
}

interface Window {
  electronAPI: ElectronAPI;
}
