/// <reference types="vite/client" />

declare module "mind-ar/dist/mindar-image-three.prod.js" {
  export const MindARThree: new (options: { container: HTMLElement; imageTargetSrc: string; maxTrack?: number }) => any
}

declare namespace React.JSX {
  interface IntrinsicElements {
    "model-viewer": any
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": any
    }
  }
}
