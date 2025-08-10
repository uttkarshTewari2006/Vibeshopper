import '@google/model-viewer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        src: string;
        'camera-controls'?: boolean | string;
        'auto-rotate'?: boolean | string;
        'shadow-intensity'?: string | number;
        'ar'?: boolean | string;
        'ar-modes'?: string;
        'exposure'?: string | number;
        'environment-image'?: string;
        'poster'?: string;
        style?: React.CSSProperties;
        class?: string;
        children?: React.ReactNode;
        ref?: React.Ref<any>;
        'shadow-intensity'?: string | number;
      };
    }
  }
}
