// The hero picture: what you learned today reaches tomorrow-you and your teammates through one
// shared memory. Grown from the landing artifact's team graph. All motion is CSS (no JS): edges
// draw in, nodes pop in, a ring pulses off the hub, and pulses ride the edges. Reduced motion
// shows the finished picture.
const HUB = { x: 260, y: 170 };
const you = [
  { x: 74, y: 86, label: "you · today" },
  { x: 74, y: 254, label: "you · tomorrow" },
];
const team = [
  { x: 446, y: 66, label: "teammate" },
  { x: 470, y: 170, label: "teammate" },
  { x: 446, y: 274, label: "teammate" },
];
const line = (a: { x: number; y: number }, b: { x: number; y: number }) => `M${a.x} ${a.y} L${b.x} ${b.y}`;
const edges = [line(you[0], HUB), ...team.map((t) => line(HUB, t)), line(HUB, you[1])];
const nodes = [...you.map((n) => ({ ...n, stroke: "var(--navy)" })), ...team.map((n) => ({ ...n, stroke: "var(--k-auto)" }))];

const css = `
.tg-edge { fill: none; stroke: var(--k-auto); stroke-width: 1.5; opacity: .55; stroke-dasharray: 1; stroke-dashoffset: 1; animation: tg-draw .9s ease-in-out forwards; }
.tg-pop { transform-box: fill-box; transform-origin: center; animation: tg-pop .5s cubic-bezier(.34,1.56,.64,1) both; }
.tg-ring { fill: none; stroke: var(--accent); stroke-width: 1.5; opacity: 0; transform-box: fill-box; transform-origin: center; animation: tg-ring 2.6s ease-out 1.2s infinite; }
.tg-pulse { fill: var(--accent-2); opacity: 0; animation: tg-travel 5s ease-in-out infinite; }
.tg-label { font: 500 12px var(--mono); fill: var(--muted); }
@keyframes tg-draw { to { stroke-dashoffset: 0 } }
@keyframes tg-pop { from { transform: scale(.4); opacity: 0 } }
@keyframes tg-ring { from { transform: scale(1); opacity: .5 } to { transform: scale(1.45); opacity: 0 } }
@keyframes tg-travel { 0% { offset-distance: 0%; opacity: 0 } 15%, 85% { opacity: 1 } 100% { offset-distance: 100%; opacity: 0 } }
@media (prefers-reduced-motion: reduce) {
  .tg-edge, .tg-pop { animation: none; stroke-dashoffset: 0 }
  .tg-ring, .tg-pulse { display: none }
}`;

export function TeamGraph() {
  return (
    <svg className="hero-art" viewBox="0 0 540 340" role="img" aria-labelledby="graph-title">
      <title id="graph-title">One shared memory connecting you today, you tomorrow, and your teammates</title>
      <style>{css}</style>

      {edges.map((d, i) => (
        <path key={d} className="tg-edge" d={d} pathLength={1} style={{ animationDelay: `${250 + i * 120}ms` }} />
      ))}
      {edges.map((d, i) => (
        <circle key={d} className="tg-pulse" r="3.5" style={{ offsetPath: `path('${d}')`, animationDelay: `${1.6 + i}s` }} />
      ))}

      <circle className="tg-ring" cx={HUB.x} cy={HUB.y} r={46} />
      <g className="tg-pop">
        <circle cx={HUB.x} cy={HUB.y} r={42} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2.5} />
        <circle cx={HUB.x} cy={HUB.y} r={30} fill="var(--glow)" />
        <text x={HUB.x} y={HUB.y + 5} textAnchor="middle" style={{ font: "600 13px var(--mono)", fill: "var(--accent)" }}>
          memory
        </text>
        <text x={HUB.x} y={HUB.y + 66} textAnchor="middle" className="tg-label">
          ~/.ai-coach
        </text>
      </g>

      {nodes.map((n, i) => (
        <g key={`${n.x}-${n.y}`} className="tg-pop" style={{ animationDelay: `${500 + i * 120}ms` }}>
          <circle cx={n.x} cy={n.y} r={19} fill="var(--surface)" stroke={n.stroke} strokeWidth={2.5} />
          <circle cx={n.x} cy={n.y} r={5} fill={n.stroke} />
          <text x={n.x} y={n.y + (n.y > HUB.y ? 38 : -30)} textAnchor="middle" className="tg-label">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
