import { CONDIMENTS } from "@/data/hotpot";
import { useIsPortrait } from "@/hooks/use-mobile";
import { serif, btnPrimary } from "./constants";
import { SelectBadge, ScreenHead, BottomBar } from "./shared";
import { CondimentVisual } from "./visuals";
export function SauceStep({
  conds,
  onToggle,
  onConfirm,
}: {
  conds: string[];
  onToggle: (id: string) => void;
  onConfirm: () => void;
}) {
  const isPortrait = useIsPortrait();
  const oilColors = conds
    .map((id) => CONDIMENTS.find((c) => c.id === id)?.color)
    .filter(Boolean)
    .slice(0, 4) as string[];
  const mixedBits = conds.flatMap((id, i) => {
    const s = CONDIMENTS.find((c) => c.id === id);
    if (!s) return [];
    const count = ["sesame", "cilantro", "scallion"].includes(id) ? 9 : 6;
    return Array.from({ length: count }, (_, j) => {
      const a = i * 1.55 + j * 1.08;
      const r = 20 + ((j * 13 + i * 7) % 58);
      const isLeaf = id === "cilantro" || id === "scallion";
      const isRing = id === "chili" || id === "chilioil";
      return {
        id,
        color: s.color,
        size: isLeaf ? 11 : isRing ? 12 : id === "sesame" ? 5 : 8,
        x: 115 + r * Math.cos(a),
        y: 115 + r * Math.sin(a),
        rot: (i * 47 + j * 31) % 180,
        leaf: isLeaf,
        ring: isRing,
      };
    });
  });

  if (isPortrait) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: "0 16px 120px",
        boxSizing: "border-box",
        position: "relative",
      }}>
        <div style={{ textAlign: "center", marginTop: 20, marginBottom: 15 }}>
          <div style={{ fontSize: 12, letterSpacing: ".3em", color: "#9a6b3a" }}>第三步</div>
          <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 24, color: "#2c2418", marginTop: 4 }}>
            调蘸料 · 定行为风格
          </div>
          <div style={{ fontSize: 11, color: "#8a6a44", marginTop: 4 }}>
            挑选你顺手的味道 · 已选 {conds.length} 味
          </div>
        </div>

        {/* Sauce Bowl (150px) */}
        <div style={{ textAlign: "center", margin: "10px auto 20px" }}>
          <div
            style={{
              position: "relative",
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: "radial-gradient(circle at 50% 36%,#f6efe0,#cdbb92 80%)",
              boxShadow: "0 10px 24px rgba(90,70,40,.2)",
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "52%",
                transform: "translate(-50%,-50%)",
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: oilColors.length
                  ? `radial-gradient(circle at 40% 34%,rgba(255,255,255,.16),transparent 24%), conic-gradient(from 20deg, ${oilColors.join(", ")}, ${oilColors[0]}), radial-gradient(circle,#7a3a20,#25140c)`
                  : "rgba(120,95,55,.12)",
                overflow: "hidden",
              }}
            >
              {oilColors.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    left: 20,
                    top: 15,
                    width: 36,
                    height: 12,
                    borderRadius: "50%",
                    background: "rgba(255,244,190,.28)",
                    filter: "blur(3px)",
                    transform: "rotate(-13deg)",
                  }}
                />
              )}
            </div>
            {mixedBits.map((d, i) => {
              const relativeX = d.x - 115;
              const relativeY = d.y - 115;
              const scaledX = 75 + relativeX * (75 / 115);
              const scaledY = 75 + relativeY * (75 / 115);
              return (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: scaledX,
                    top: scaledY,
                    width: d.size * 0.75,
                    height: d.leaf ? 3 : d.ring ? 5 : d.size * 0.75,
                    borderRadius: "50%",
                    background: d.color,
                    transform: `rotate(${d.rot}deg)`,
                    animation: "lhDrop .5s ease both",
                  }}
                />
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "#a98f63", marginTop: 8, minHeight: 16 }}>
            {conds.length
              ? CONDIMENTS.filter((c) => conds.includes(c.id))
                  .map((c) => c.style)
                  .join(" · ")
              : "不蘸也是一味"}
          </div>
        </div>

        {/* Condiments Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "14px 8px",
            width: "100%",
            maxWidth: 420,
          }}
        >
          {CONDIMENTS.map((s) => {
            const sel = conds.includes(s.id);
            return (
              <div
                key={s.id}
                className="lh-card"
                onClick={() => onToggle(s.id)}
                style={{ cursor: "pointer", textAlign: "center", outline: "none" }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 66,
                    height: 66,
                    margin: "0 auto",
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 50% 30%,#f4ecd9,#bd9f67 78%)",
                    boxShadow: "0 6px 12px rgba(90,70,40,.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 50% 50%,#3a2416,#191009)",
                      overflow: "hidden",
                    }}
                  >
                    <CondimentVisual id={s.id} />
                  </div>
                  {sel && <SelectBadge label="✓" />}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: serif,
                    fontWeight: 700,
                    fontSize: 13,
                    color: "#2c2418",
                  }}
                >
                  {s.name}
                </div>
                <div style={{ fontSize: 10, color: "#9a3a2c", transform: "scale(0.95)" }}>{s.style}</div>
              </div>
            );
          })}
        </div>

        <div style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 20px 24px",
          background: "linear-gradient(180deg, transparent, #f4eddd 25%)",
          textAlign: "center",
          zIndex: 10,
        }}>
          <button onClick={onConfirm} style={{ ...btnPrimary, width: "100%", maxWidth: 300 }}>
            选好了
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScreenHead
        step="第三步"
        title="调 蘸 料 · 定 行 为 风 格"
        sub={`挑出你顺手的味道 · 已选 ${conds.length} 味 · 多少不限，可不选`}
      />

      {/* 蘸料网格 */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 188,
          width: 700,
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: "22px 18px",
        }}
      >
        {CONDIMENTS.map((s) => {
          const sel = conds.includes(s.id);
          return (
            <div
              key={s.id}
              className="lh-card"
              role="button"
              tabIndex={0}
              aria-pressed={sel}
              onClick={() => onToggle(s.id)}
              onKeyDown={(e) => e.key === "Enter" && onToggle(s.id)}
              style={{ cursor: "pointer", textAlign: "center", outline: "none" }}
            >
              <div
                style={{
                  position: "relative",
                  width: 104,
                  height: 104,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 50% 30%,#f4ecd9,#bd9f67 78%)",
                  boxShadow:
                    "0 12px 22px rgba(90,70,40,.24), inset 0 5px 10px rgba(255,255,255,.52), inset 0 -8px 18px rgba(95,70,35,.26)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 50% 34%,rgba(255,255,255,.2),rgba(40,25,12,.12) 72%), radial-gradient(circle at 50% 50%,#3a2416,#191009)",
                    boxShadow:
                      "inset 0 4px 8px rgba(255,255,255,.08), inset 0 -8px 12px rgba(0,0,0,.34)",
                    overflow: "hidden",
                  }}
                >
                  <CondimentVisual id={s.id} />
                </div>
                {sel && <SelectBadge label="✓" />}
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontFamily: serif,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#2c2418",
                }}
              >
                {s.name}
              </div>
              <div style={{ fontSize: 11, color: "#9a3a2c" }}>{s.style}</div>
            </div>
          );
        })}
      </div>

      {/* 味碟 */}
      <div style={{ position: "absolute", right: 96, top: 210, textAlign: "center" }}>
        <div
          style={{
            fontFamily: serif,
            fontSize: 15,
            color: "#5a4630",
            letterSpacing: ".2em",
            marginBottom: 16,
          }}
        >
          你 的 味 碟
        </div>
        <div
          style={{
            position: "relative",
            width: 230,
            height: 230,
            borderRadius: "50%",
            background: "radial-gradient(circle at 50% 36%,#f6efe0,#cdbb92 80%)",
            boxShadow:
              "0 18px 36px rgba(90,70,40,.3), inset 0 4px 10px rgba(255,255,255,.5), inset 0 -10px 22px rgba(120,95,55,.3)",
            margin: "0 auto",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              transform: "translate(-50%,-50%)",
              width: 150,
              height: 150,
              borderRadius: "50%",
              background: oilColors.length
                ? `radial-gradient(circle at 40% 34%,rgba(255,255,255,.16),transparent 24%), conic-gradient(from 20deg, ${oilColors.join(", ")}, ${oilColors[0]}), radial-gradient(circle,#7a3a20,#25140c)`
                : "rgba(120,95,55,.12)",
              boxShadow: oilColors.length
                ? "inset 0 8px 16px rgba(255,255,255,.12), inset 0 -14px 24px rgba(0,0,0,.28)"
                : undefined,
              overflow: "hidden",
            }}
          >
            {oilColors.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  left: 34,
                  top: 26,
                  width: 56,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(255,244,190,.28)",
                  filter: "blur(4px)",
                  transform: "rotate(-13deg)",
                }}
              />
            )}
          </div>
          {mixedBits.map((d, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                left: d.x,
                top: d.y,
                width: d.size,
                height: d.leaf ? 5 : d.ring ? 8 : d.size,
                borderRadius: d.leaf ? 8 : d.ring ? "50%" : "50%",
                background: d.color,
                border: d.ring ? "1px solid rgba(255,210,140,.42)" : undefined,
                boxShadow: "0 1px 3px rgba(0,0,0,.28)",
                transform: `rotate(${d.rot}deg)`,
                animation: "lhDrop .5s ease both",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#a98f63", marginTop: 14, minHeight: 16 }}>
          {conds.length
            ? CONDIMENTS.filter((c) => conds.includes(c.id))
                .map((c) => c.style)
                .join(" · ")
            : "不蘸也是一味"}
        </div>
      </div>

      <BottomBar>
        <button onClick={onConfirm} style={btnPrimary}>
          选 好 了
        </button>
      </BottomBar>
    </>
  );
}

