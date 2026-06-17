import { useMemo } from "react";
import { itemById } from "@/data/hotpot";

interface Props {
  baseId?: string;
  dropped: string[]; // ingredient/condiment ids in pot
  boiling?: boolean;
}

export function HotpotStage({ baseId, dropped, boiling = false }: Props) {
  const base = baseId ? itemById(baseId) : undefined;
  const broth = (base as { color?: string } | undefined)?.color ?? "#5a3a26";

  const bubbles = useMemo(
    () => Array.from({ length: boiling ? 14 : 6 }, (_, i) => ({
      i,
      left: 18 + Math.random() * 64,
      delay: Math.random() * 2,
      dur: 1.6 + Math.random() * 1.6,
      size: 6 + Math.random() * 10,
    })),
    [boiling, baseId],
  );

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* steam */}
      {(base || dropped.length > 0) && (
        <div className="pointer-events-none absolute inset-x-0 -top-24 flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="block h-24 w-3 rounded-full bg-white/15 blur-md"
              style={{
                animation: `hp-steam ${2.2 + i * 0.3}s ease-out ${i * 0.4}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* pot */}
      <div className="absolute inset-x-0 bottom-0 top-[14%]">
        {/* rim */}
        <div
          className="absolute inset-x-[6%] top-0 h-[18%] rounded-[50%] border-4 border-amber-200/60"
          style={{ background: "linear-gradient(180deg,#3a2418,#1c0f0a)" }}
        />
        {/* body */}
        <div
          className="absolute inset-x-[2%] top-[10%] bottom-0 overflow-hidden rounded-b-[42%] rounded-t-[20%] border-4 border-amber-200/40 shadow-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.7)), radial-gradient(circle at 50% 30%, #6b3a22, #2a1810)",
          }}
        >
          {/* broth surface */}
          {base && (
            <div
              className="absolute inset-x-[6%] top-[18%] h-[58%] rounded-[50%]"
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${broth}, color-mix(in oklab, ${broth}, black 35%))`,
                boxShadow: `inset 0 -20px 40px rgba(0,0,0,0.5), 0 0 60px ${broth}55`,
              }}
            />
          )}
          {/* dropped items floating */}
          {base && dropped.length > 0 && (
            <div className="absolute inset-x-[10%] top-[28%] flex flex-wrap justify-center gap-1">
              {dropped.map((id, i) => {
                const it = itemById(id);
                if (!it) return null;
                return (
                  <span
                    key={id + i}
                    className="text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                    style={{
                      animation: `hp-drop 0.6s ease-out ${i * 0.05}s both`,
                    }}
                    title={it.name}
                  >
                    {it.emoji}
                  </span>
                );
              })}
            </div>
          )}
          {/* bubbles */}
          {base && bubbles.map((b) => (
            <span
              key={b.i}
              className="absolute bottom-[20%] rounded-full bg-white/70"
              style={{
                left: `${b.left}%`,
                width: b.size,
                height: b.size,
                animation: `hp-bubble ${b.dur}s ease-out ${b.delay}s infinite`,
              }}
            />
          ))}
        </div>
        {/* handles */}
        <div className="absolute -left-3 top-[28%] h-3 w-10 rounded-full bg-amber-200/40" />
        <div className="absolute -right-3 top-[28%] h-3 w-10 rounded-full bg-amber-200/40" />
      </div>

      {!base && (
        <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-amber-100/60">
          <span>先给这口锅，挑一个底</span>
        </div>
      )}
    </div>
  );
}