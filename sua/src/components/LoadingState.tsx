import { useEffect, useRef } from 'react';
// anime.js v4 API
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { animate, svg } from 'animejs';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  // racepath.svg path data
  const racePathD = 'M2 93H41.1107C61.1364 93 80.2677 84.7057 93.9563 70.089L103.709 59.6748C117.895 44.5269 114.23 20.1075 96.2218 9.79208V9.79208C86.1931 4.0475 73.8431 4.13257 63.889 10.0055V10.0055C46.3719 20.3406 42.6755 44.1337 56.2548 59.2752L65.1027 69.141C78.7199 84.3249 98.1528 93 118.548 93H161.5';

  useEffect(() => {
    if (!pathRef.current || !cartRef.current) return;

    // Map transforms to the SVG path coordinates using anime.js
    const motion = svg.createMotionPath(pathRef.current);
    const { translateX, translateY, rotate } = motion;

    animate(cartRef.current, {
      ease: 'linear',
      duration: 3000,
      loop: true,
      translateX,
      translateY,
      rotate,
    });
  }, []);

  return (
    <div className="text-center py-8">
      <div className="relative w-48 h-24 mx-auto mb-4">
        {/* racepath.svg */}
        <svg 
          width="164" 
          height="95" 
          viewBox="0 0 164 95" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path 
            ref={pathRef}
            d={racePathD}
            stroke="#A898F5" 
            strokeWidth="4"
          />
          <circle cx="161.5" cy="93" r="2" fill="#A898F5"/>
          <circle cx="2" cy="93" r="2" fill="#A898F5"/>
        </svg>
        
        {/* cart.svg animated along the path */}
        <div 
          ref={cartRef}
          className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2"
        >
          <img src="/shop.svg" alt="Cart" className="w-10 h-10" />
        </div>
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
