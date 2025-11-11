"use client"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      {/* Animated clouds in background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="cloud cloud-1"></div>
        <div className="cloud cloud-2"></div>
        <div className="cloud cloud-3"></div>
      </div>

      {/* Flying airplane */}
      <div className="relative z-10">
        <svg
          className="airplane-flying"
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
            fill="white"
            className="airplane-path"
          />
        </svg>
        
        {/* Dotted flight path trail */}
        <div className="flight-path"></div>
      </div>

      {/* Loading text */}
      <div className="mt-8 text-center z-10">
        <h2 className="text-2xl font-bold text-white mb-2">Taking Off...</h2>
        <p className="text-white/70 text-sm">Preparing your flight experience</p>
        
        {/* Animated dots */}
        <div className="flex items-center justify-center gap-1 mt-4">
          <span className="loading-dot"></span>
          <span className="loading-dot" style={{ animationDelay: '0.2s' }}></span>
          <span className="loading-dot" style={{ animationDelay: '0.4s' }}></span>
        </div>
      </div>

      <style jsx>{`
        .airplane-flying {
          animation: fly 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(255, 255, 255, 0.3));
        }

        @keyframes fly {
          0%, 100% {
            transform: translate(0, 0) rotate(-5deg);
          }
          25% {
            transform: translate(30px, -20px) rotate(0deg);
          }
          50% {
            transform: translate(0, -10px) rotate(5deg);
          }
          75% {
            transform: translate(-30px, -20px) rotate(0deg);
          }
        }

        .flight-path {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 2px;
          background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
          border-top: 2px dashed rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%) rotate(-10deg);
          animation: pathFade 2s ease-in-out infinite;
        }

        @keyframes pathFade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        .cloud {
          position: absolute;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          filter: blur(20px);
        }

        .cloud-1 {
          width: 200px;
          height: 100px;
          top: 20%;
          left: -100px;
          animation: cloud-drift-1 20s linear infinite;
        }

        .cloud-2 {
          width: 300px;
          height: 150px;
          top: 60%;
          right: -150px;
          animation: cloud-drift-2 25s linear infinite;
        }

        .cloud-3 {
          width: 250px;
          height: 120px;
          top: 40%;
          left: 50%;
          animation: cloud-drift-3 30s linear infinite;
        }

        @keyframes cloud-drift-1 {
          from { transform: translateX(0); }
          to { transform: translateX(calc(100vw + 200px)); }
        }

        @keyframes cloud-drift-2 {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100vw - 300px)); }
        }

        @keyframes cloud-drift-3 {
          from { transform: translate(-50%, 0); }
          to { transform: translate(calc(-50% + 100vw), 0); }
        }

        .loading-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: dot-bounce 1.4s ease-in-out infinite;
        }

        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
