import { useRef } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src: string;
          'camera-controls'?: boolean | string;
          'auto-rotate'?: boolean | string;
          'auto-rotate-delay'?: number | string;
          'auto-rotate-speed'?: string;
          'ar'?: boolean | string;
          'ar-modes'?: string;
          'shadow-intensity'?: string | number;
          'environment-image'?: string;
          'exposure'?: string | number;
        },
        HTMLElement
      >;
    }
  }
}

type RotatingCartProps = {
  heightClassName?: string;
  className?: string;
  modelPath?: string;
  rotationSpeed?: string; // e.g., '10rad/s' or '30deg/s'
  scale?: number; // Scale factor (e.g., 0.5 for half size, 1 for original size)
};

export function RotatingCart({
  heightClassName = "h-48",
  className = "",
  modelPath = "/simple_shopping_cart.glb",
  rotationSpeed = "180deg/s",
  scale = 1
}: RotatingCartProps) {
  const modelViewerRef = useRef<any>(null);

  return (
    <div className={`w-full ${heightClassName} rounded-xl overflow-hidden bg-none relative ${className}`}>
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scale})`,
        transformOrigin: 'center'
      }}>
        <model-viewer
          ref={modelViewerRef}
          src={modelPath}
          style={{
            width: '100%',
            height: '100%',
            // @ts-ignore - CSS custom properties
            '--progress-bar-color': 'rgba(255, 255, 255, 0.5)',
            // @ts-ignore - CSS custom properties
            '--progress-mask': 'rgba(255, 255, 255, 0.5)'
          } as React.CSSProperties}
          camera-controls
          auto-rotate="true"
          auto-rotate-delay={0}
          auto-rotate-speed={rotationSpeed}
          shadow-intensity="1"
          exposure="1"
          environment-image="neutral"
          ar
          ar-modes="webxr scene-viewer quick-look"
        />
      </div>
    </div>
  );
}