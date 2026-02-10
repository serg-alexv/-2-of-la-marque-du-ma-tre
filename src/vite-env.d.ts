/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_INTENSE_CAPABLE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
