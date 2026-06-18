import { BASES } from "@/data/hotpot";
import { useIsPortrait } from "@/hooks/use-mobile";
import { serif, btnPrimary } from "./constants";
import { SelectBadge, ScreenHead, BottomBar } from "./shared";
import { CenterPot } from "./visuals";
/* ============ 锅底(选一个口味) ============ */
export function BaseStep({
  bases,
  baseImage,
  baseColor,
  onPick,
  onNext,
}: {
  bases: string[];
  baseImage?: string;
  baseColor?: string;
  onPick: (id: string) => void;
  onNext: () => void;
}) {
  const isPortrait = useIsPortrait();

  if (isPortrait) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        padding: "0 16px 120px",
        boxSizing: "border-box",
      }}>
        <div style={{ textAlign: "center", marginTop: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, letterSpacing: ".3em", color: "#9a6b3a" }}>第一步</div>
          <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 24, color: "#2c2418", marginTop: 4 }}>
            择锅底 · 定基调
          </div>
          <div style={{ fontSize: 11, color: "#8a6a44", marginTop: 6 }}>
            已选 {bases.length} / 1 个 · 选一种口味，可不选
          </div>
        </div>

        <div style={{ height: 240, position: "relative", width: "100%" }}>
          <CenterPot size={220} baseImage={baseImage} baseColor={baseColor} yOffset={120} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            maxWidth: 400,
            marginTop: 20,
          }}
        >
          {BASES.map((b) => {
            const sel = bases.includes(b.id);
            return (
              <div
                key={b.id}
                className="lh-card"
                onClick={() => onPick(b.id)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: sel
                    ? "linear-gradient(180deg,rgba(247,240,223,.92),rgba(236,225,201,.88))"
                    : "rgba(247,240,223,.56)",
                  border: sel ? "1.5px solid rgba(180,56,43,.72)" : "1px solid rgba(154,123,74,.28)",
                  boxShadow: sel
                    ? "0 10px 22px rgba(120,70,40,.12)"
                    : "0 6px 14px rgba(90,70,40,.06)",
                }}
              >
                <div style={{
                  flex: "none",
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  border: sel ? `2px solid ${b.color}` : "1.5px solid rgba(90,68,42,.4)",
                  overflow: "hidden",
                  position: "relative",
                }}>
                  <img src={b.image} alt={b.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {sel && <SelectBadge label="✓" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 18, color: "#2c2418" }}>
                    {b.name}
                  </div>
                </div>
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
          <button onClick={onNext} style={{ ...btnPrimary, width: "100%", maxWidth: 300 }}>
            下一步 · 配食材
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScreenHead
        step="第一步"
        title="择 锅 底 · 定 基 调"
        sub={`已选 ${bases.length} / 1 个 · 选一种口味，可不选`}
      />
      <CenterPot size={340} baseImage={baseImage} baseColor={baseColor} />
      {BASES.map((b, i) => {
        const idx = bases.indexOf(b.id);
        const sel = idx >= 0;
        const leftSide = i < 3;
        return (
          <div
            key={b.id}
            className="lh-card"
            role="button"
            tabIndex={0}
            aria-pressed={sel}
            onClick={() => onPick(b.id)}
            onKeyDown={(e) => e.key === "Enter" && onPick(b.id)}
            style={{
              position: "absolute",
              left: leftSide ? 78 : "auto",
              right: leftSide ? "auto" : 78,
              top: 198 + (i % 3) * 122,
              width: 292,
              minHeight: 94,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 14px",
              borderRadius: 8,
              background: sel
                ? "linear-gradient(180deg,rgba(247,240,223,.92),rgba(236,225,201,.88))"
                : "rgba(247,240,223,.56)",
              border: sel ? "1.5px solid rgba(180,56,43,.72)" : "1px solid rgba(154,123,74,.28)",
              boxShadow: sel
                ? "0 14px 30px rgba(120,70,40,.18), inset 0 0 0 1px rgba(255,255,255,.35)"
                : "0 10px 22px rgba(90,70,40,.1), inset 0 1px 0 rgba(255,255,255,.38)",
              transition: "transform .22s ease, box-shadow .22s ease, border-color .22s ease",
            }}
          >
            <div
              style={{
                flex: "none",
                width: 66,
                height: 66,
                borderRadius: "50%",
                border: sel ? `2px solid ${b.color}` : "1.5px solid rgba(90,68,42,.4)",
                boxShadow: sel
                  ? `0 8px 18px rgba(90,70,40,.25), 0 0 0 3px ${b.color}33`
                  : "0 8px 18px rgba(90,70,40,.2)",
                overflow: "hidden",
                position: "relative",
                transition: "border-color .22s ease, box-shadow .22s ease",
              }}
            >
              <img
                src={b.image}
                alt={b.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
              {sel && <SelectBadge label="✓" />}
            </div>
            <div style={{ minWidth: 0, flex: 1, textAlign: leftSide ? "left" : "right" }}>
              {/* 只露锅底名字，藏起含义(tone/tagline),让选择更凭直觉 */}
              <div
                style={{
                  fontFamily: serif,
                  fontWeight: 800,
                  fontSize: 22,
                  lineHeight: 1.15,
                  color: "#2c2418",
                  letterSpacing: ".08em",
                }}
              >
                {b.name}
              </div>
            </div>
          </div>
        );
      })}
      <BottomBar>
        <button onClick={onNext} style={btnPrimary}>
          下 一 步 · 配 食 材
        </button>
      </BottomBar>
    </>
  );
}


