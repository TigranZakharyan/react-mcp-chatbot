import { useMemo, useState } from "react";
import { MCPAgent } from "react-mcp-chatbot";
import { CodeBlock } from "../components/CodeBlock";
import { endpoints } from "./shared";

type Font = "default" | "serif" | "mono";
const FONTS: Record<Font, string | undefined> = {
  default: undefined,
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

const SWATCHES = ["#7c5cff", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

/** Every visual option of <MCPAgent />, live, with the matching code generated underneath. */
export function Customizer() {
  const [theme, setTheme] = useState<"dark" | "light" | "auto">("dark");
  const [color, setColor] = useState("#7c5cff");
  const [align, setAlign] = useState<"left" | "right">("right");
  const [title, setTitle] = useState("Orders Assistant");
  const [subtitle, setSubtitle] = useState("Demo mode · simulated, no AI");
  const [avatar, setAvatar] = useState("🤖");
  const [welcomeTitle, setWelcomeTitle] = useState("Hey there!");
  const [welcomeMessage, setWelcomeMessage] = useState("How can I help you today?");
  const [radius, setRadius] = useState(20);
  const [width, setWidth] = useState(410);
  const [height, setHeight] = useState(560);
  const [font, setFont] = useState<Font>("default");
  const [clearBtn, setClearBtn] = useState(true);
  const [suggest, setSuggest] = useState(true);
  const [label, setLabel] = useState("");
  const [customBg, setCustomBg] = useState(false);

  const colors = customBg ? { aiBubble: "#fef3c7", aiBubbleText: "#78350f", bg: "#fffbeb", surface: "#fef9e7" } : undefined;

  const code = useMemo(() => {
    const p: string[] = [];
    if (theme !== "dark") p.push(`theme="${theme}"`);
    if (color !== "#6366f1") p.push(`primaryColor="${color}"`);
    p.push(`title="${title}"`);
    if (subtitle !== "Online") p.push(subtitle ? `subtitle="${subtitle}"` : "subtitle={null}");
    if (avatar !== "🤖") p.push(`avatar="${avatar}"`);
    if (welcomeTitle !== "Hey there!") p.push(`welcomeTitle="${welcomeTitle}"`);
    if (welcomeMessage !== "How can I help you today?") p.push(`welcomeMessage="${welcomeMessage}"`);
    if (align !== "right") p.push(`align="${align}"`);
    if (width !== 600) p.push(`width={${width}}`);
    if (height !== 900) p.push(`height={${height}}`);
    if (radius !== 20) p.push(`borderRadius={${radius}}`);
    if (font !== "default") p.push(`fontFamily="${FONTS[font]}"`);
    if (label) p.push(`buttonLabel="${label}"`);
    if (!clearBtn) p.push("showClearButton={false}");
    if (suggest) p.push(`suggestions={["Which orders are still processing?", "Cancel order 1002"]}`);
    if (customBg) p.push(`colors={{ bg: "#fffbeb", surface: "#fef9e7", aiBubble: "#fef3c7", aiBubbleText: "#78350f" }}`);
    return `<MCPAgent\n  provider="openai" model="gpt-4o-mini" apiKey={key}\n  api={api}\n${p.map((x) => "  " + x).join("\n")}\n/>`;
  }, [theme, color, title, subtitle, avatar, welcomeTitle, welcomeMessage, align, width, height, radius, font, label, clearBtn, suggest, customBg]);

  const Seg = <T extends string>({ value, set, opts }: { value: T; set: (v: T) => void; opts: readonly T[] }) => (
    <div className="chips-row">
      {opts.map((o) => (
        <button key={o} className={`chip-btn ${value === o ? "on" : ""}`} onClick={() => set(o)}>
          {o}
        </button>
      ))}
    </div>
  );

  return (
    <div className="customizer">
      <div className="panel">
        <div className="ctl-grid">
          <div>
            <h4>Theme</h4>
            <Seg value={theme} set={setTheme} opts={["dark", "light", "auto"] as const} />
          </div>
          <div>
            <h4>Position</h4>
            <Seg value={align} set={setAlign} opts={["left", "right"] as const} />
          </div>
          <div className="wide">
            <h4>Accent colour (primaryColor)</h4>
            <div className="chips-row">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  className={`swatch ${color === c ? "on" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`accent ${c}`}
                />
              ))}
              <input type="color" className="swatch-input" value={color} onChange={(e) => setColor(e.target.value)} aria-label="custom colour" />
            </div>
          </div>
          <label>
            title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            subtitle (empty hides it)
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </label>
          <label>
            avatar (emoji or image URL)
            <input value={avatar} onChange={(e) => setAvatar(e.target.value)} />
          </label>
          <label>
            buttonLabel
            <input value={label} placeholder="e.g. Ask AI" onChange={(e) => setLabel(e.target.value)} />
          </label>
          <label>
            welcomeTitle
            <input value={welcomeTitle} onChange={(e) => setWelcomeTitle(e.target.value)} />
          </label>
          <label>
            welcomeMessage
            <input value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} />
          </label>
          <label>
            borderRadius · {radius}px
            <input type="range" min={0} max={32} value={radius} onChange={(e) => setRadius(+e.target.value)} />
          </label>
          <label>
            width · {width}px
            <input type="range" min={300} max={560} value={width} onChange={(e) => setWidth(+e.target.value)} />
          </label>
          <label>
            height · {height}px
            <input type="range" min={360} max={720} value={height} onChange={(e) => setHeight(+e.target.value)} />
          </label>
          <div>
            <h4>fontFamily</h4>
            <Seg value={font} set={setFont} opts={["default", "serif", "mono"] as const} />
          </div>
          <div className="wide checks">
            <label className="check">
              <input type="checkbox" checked={clearBtn} onChange={(e) => setClearBtn(e.target.checked)} /> showClearButton
            </label>
            <label className="check">
              <input type="checkbox" checked={suggest} onChange={(e) => setSuggest(e.target.checked)} /> suggestions
            </label>
            <label className="check">
              <input type="checkbox" checked={customBg} onChange={(e) => setCustomBg(e.target.checked)} /> colors override (warm palette)
            </label>
          </div>
        </div>
      </div>

      <CodeBlock code={code} lang="tsx" />

      <MCPAgent
        provider="openai-compatible"
        providerURL="/mock-llm"
        model="rule-based-demo"
        theme={theme}
        primaryColor={color}
        colors={colors}
        title={title}
        subtitle={subtitle || null}
        avatar={avatar}
        welcomeTitle={welcomeTitle}
        welcomeMessage={welcomeMessage}
        align={align}
        width={width}
        height={height}
        borderRadius={radius}
        fontFamily={FONTS[font]}
        buttonLabel={label || undefined}
        showClearButton={clearBtn}
        suggestions={suggest ? ["Which orders are still processing?", "Cancel order 1002"] : undefined}
        defaultOpen={typeof window !== "undefined" && window.innerWidth >= 1240}
        beforeToolCall={({ method, name, args }) =>
          method === "GET" || window.confirm(`Allow the assistant to run ${name}(${JSON.stringify(args)})?`)
        }
        api={{ baseURL: "/api", endpoints }}
      />
    </div>
  );
}
