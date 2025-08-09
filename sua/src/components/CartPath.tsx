import { useEffect, useRef } from 'react';
// anime.js v4 API
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { animate, svg } from 'animejs';

export const CartPath = () => {
  const pathRef = useRef<SVGPathElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const leftWheelRef = useRef<SVGGElement>(null);
  const rightWheelRef = useRef<SVGGElement>(null);

  // Use provided racepath.svg path as the squiggly track (no loop)
  const racePathD =
    'M877 1.5L269.131 241.412C240.598 252.673 208.119 241.38 192.727 214.846V214.846C172.367 179.749 190.643 134.878 229.73 123.993L231.5 123.5L287.797 113.995C349.536 103.572 412.661 121.842 459.289 163.629V163.629C466.295 169.908 474.89 174.144 484.137 175.877L677 212L820.513 239.469C858.707 246.78 866.92 297.812 832.948 316.737V316.737C826.752 320.188 819.777 322 812.685 322H565.425C525.288 322 485.296 326.833 446.314 336.395L163.516 405.76C95.0145 422.562 38.67 471.095 11.9046 536.352V536.352C5.36444 552.297 2 569.366 2 586.601V592.401C2 640.315 23.2312 685.767 59.9767 716.517L67.3337 722.674C86.8937 739.043 109.669 751.127 134.19 758.145L184.214 772.465C215.685 781.473 246.418 793.141 277.952 801.926C324.422 814.872 406.163 831 525 831C723.5 831 914.103 778 933 663V663C945.896 584.517 883.936 482.71 812.739 447.258C705.479 393.849 519.407 410.279 356.53 465.161C272.849 493.358 152.307 488.195 104.184 562.234V562.234C68.0808 617.779 48.3557 675.2 36.8052 740.433L27.2461 794.419C12.1822 879.495 53.452 964.626 129.573 1005.5L161.63 1022.71C220.519 1054.33 288.279 1065.38 354.161 1054.1L585.5 1014.5L679.355 1001.19C754.929 990.468 845.224 997.151 887.4 1060.77C906.273 1089.24 902.281 1119.76 886.368 1181.59C880.833 1203.1 862.779 1219.1 840.811 1222.34V1222.34C762.576 1233.88 658.422 1152.13 579.356 1150.61C451.807 1148.17 235.094 1223.11 116.831 1262.89C80.552 1275.09 41.5395 1259.05 23.3207 1225.39V1225.39C10.0398 1200.85 10.3102 1171.04 23.8604 1146.65V1146.65C41.8817 1114.21 79.4641 1097.49 115.548 1106.15L117.326 1106.58C158.261 1116.4 196.495 1135.22 229.251 1161.66L358.5 1266L476.827 1338.29C495.483 1349.69 515.881 1357.95 537.209 1362.74L1023 1472';

  // (removed old trackD loop)

  useEffect(() => {
    if (!pathRef.current || !cartRef.current) return;

    // Map transforms to the SVG path coordinates
    const motion = svg.createMotionPath(pathRef.current);
    const { translateX, translateY, rotate } = motion;

    animate(cartRef.current, {
      ease: 'linear',
      duration: 14000,
      loop: true,
      translateX,
      translateY,
      rotate,
    });

    // Optional: animate the path drawing subtly (aesthetic only)
    // const [drawable] = svg.createDrawable(pathRef.current);
    // animate(drawable, { draw: ['0 0', '0 1', '1 1'], ease: 'linear', duration: 10000, loop: true });

    // Wheel rotation synced to path length (approximate realism)
    try {
      const totalLength = pathRef.current.getTotalLength();
      const wheelRadiusPx = 6;
      const circumference = 2 * Math.PI * wheelRadiusPx;
      const totalRotations = totalLength / circumference;

      if (leftWheelRef.current) {
        animate(leftWheelRef.current, {
          rotate: 360 * totalRotations,
          duration: 16000,
          easing: 'linear',
          loop: true,
        });
      }
      if (rightWheelRef.current) {
        animate(rightWheelRef.current, {
          rotate: 360 * totalRotations,
          duration: 16000,
          easing: 'linear',
          loop: true,
        });
      }
    } catch (_) {
      // Ignore if getTotalLength is unavailable
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      <svg
        className="w-full h-full"
        viewBox="0 0 1024 1474"
        preserveAspectRatio="none"
        style={{ opacity: 0.18 }}
      >
        {/* Single thin squiggly path (visible + motion mapping) */}
        <path
          ref={pathRef}
          fill="none"
          stroke="#5433EB"
          strokeOpacity="0.45"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
          d={racePathD}
        />
      </svg>
      
      <div 
        ref={cartRef}
        className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 z-40"
      >
        {/* Stylized cart with wheels */}
        <svg 
          width="44" 
          height="44" 
          viewBox="0 0 64 48"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))' }}
        >
          <defs>
            <linearGradient id="cartBody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6a55f0" />
              <stop offset="100%" stopColor="#5433EB" />
            </linearGradient>
          </defs>
          {/* Handle */}
          <path d="M6 8 C 20 2, 36 2, 52 8" stroke="#5433EB" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Basket */}
          <rect x="10" y="10" rx="8" ry="8" width="40" height="18" fill="url(#cartBody)" stroke="#4f31db" strokeWidth="2" />
          {/* Slats */}
          <path d="M16 14 H44 M16 19 H44 M16 24 H44" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          {/* Axle */}
          <rect x="16" y="32" width="32" height="3" rx="1.5" fill="#4f31db" />
          {/* Wheels */}
          <g ref={leftWheelRef} style={{ transformBox: 'fill-box' as any, transformOrigin: '50% 50%' }}>
            <circle cx="22" cy="40" r="6" fill="#5433EB" />
            <circle cx="22" cy="40" r="2" fill="#ffffff" opacity="0.95" />
          </g>
          <g ref={rightWheelRef} style={{ transformBox: 'fill-box' as any, transformOrigin: '50% 50%' }}>
            <circle cx="42" cy="40" r="6" fill="#5433EB" />
            <circle cx="42" cy="40" r="2" fill="#ffffff" opacity="0.95" />
          </g>
        </svg>
      </div>
    </div>
  );
};
