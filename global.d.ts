// Minimal global declarations to satisfy TypeScript when node types are missing
interface ImportMetaEnv {
  [key: string]: string | undefined;
}
interface ImportMeta {
  env: ImportMetaEnv;
}
declare var process: any;
declare var Buffer: any;
declare module 'vite/client';
