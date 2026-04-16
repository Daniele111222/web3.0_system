/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
  };
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BLOCK_EXPLORER_URL?: string;
  readonly VITE_CHAIN_ID?: string;
  readonly VITE_CONTRACT_ADDRESS?: string;
  readonly VITE_IPNFT_CONTRACT_ADDRESS?: string;
  readonly VITE_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
