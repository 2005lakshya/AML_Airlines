"use client"

export default function AnimatedBg() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <svg className="h-full w-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.06" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#sky2)" className="text-muted-foreground" />
        <g className="text-muted-foreground/30">
          <g className="animate-[lane_24s_linear_infinite]">
            <path d="M-200 120 L1400 120" stroke="currentColor" strokeWidth="1" />
          </g>
          <g className="animate-[lane_32s_linear_infinite]">
            <path d="M-200 260 L1400 260" stroke="currentColor" strokeWidth="1" />
          </g>
          <g className="animate-[lane_28s_linear_infinite]">
            <path d="M-200 420 L1400 420" stroke="currentColor" strokeWidth="1" />
          </g>
          <g className="animate-[plane_20s_linear_infinite]">
            <path d="M0 260 l34 0 l8 -8 l-17 0 l0 -7 l17 0 l-8 -8 l-34 0 z" fill="currentColor" />
          </g>
        </g>
      </svg>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes plane { 0% { transform: translateX(-10%); } 100% { transform: translateX(110%); } }
            @keyframes lane { 0% { transform: translateX(0); } 100% { transform: translateX(-10%); } }
          `,
        }}
      />
    </div>
  )
}
