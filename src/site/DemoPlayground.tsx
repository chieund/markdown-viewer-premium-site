import { useState } from 'react';
import MarkdownContent from '../ui/components/MarkdownContent';

export interface DemoPreset {
  id: string;
  label: string;
  content: string;
}

interface DemoPlaygroundProps {
  presets: DemoPreset[];
  title?: string;
  subtitle?: string;
  sectioned?: boolean;
  /** Taller panel for the dedicated per-type pages, which have nothing else
   * competing for space above the fold once the hero is compact — the home
   * page keeps the shorter default since it still has a full hero above it. */
  tall?: boolean;
}

/** The live editor + rendered-preview pane, shared by the home page's
 * multi-type tab switcher and every per-diagram-type example page (each of
 * which reuses it scoped to just that type's own examples). */
export function DemoPlayground({ presets, title = 'Try It Live', subtitle, sectioned = true, tall = false }: DemoPlaygroundProps) {
  const [content, setContent] = useState(presets[0].content);
  const [activeId, setActiveId] = useState(presets[0].id);

  const body = (
    <div className={`max-w-7xl mx-auto ${tall ? 'space-y-6' : 'space-y-12'}`}>
      <div className={tall ? 'text-center space-y-2' : 'text-center space-y-4'}>
        <h2 className={tall ? 'text-2xl md:text-3xl font-black' : 'text-4xl font-black'}>{title}</h2>
        {subtitle && <p className="text-slate-500 text-base md:text-lg">{subtitle}</p>}
      </div>

      {presets.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => { setContent(preset.content); setActiveId(preset.id); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeId === preset.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-2 ${tall ? 'h-[80vh] min-h-[600px] max-h-[850px]' : 'h-[650px]'} bg-[#0f172a] rounded-[2.5rem] overflow-hidden border border-white/10`}>
        <div className="flex flex-col border-r border-white/10 h-full">
          <div className="px-6 py-4 bg-black/20 flex items-center justify-between border-b border-white/5">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest font-bold">input.markdown</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[10px] text-cyan-500 font-mono font-bold">LIVE</span>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full bg-transparent p-8 outline-none resize-none font-mono text-sm leading-relaxed text-slate-300"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col bg-[#0f172a] h-full overflow-hidden">
          <div className="px-6 py-4 bg-black/20 flex items-center justify-between border-b border-white/5">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-widest font-bold">preview.html</span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/10 border border-red-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/10 border border-yellow-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/10 border border-green-500/20" />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <MarkdownContent content={content} />
          </div>
        </div>
      </div>
    </div>
  );

  if (!sectioned) return body;

  return (
    <section id="demo" className={`${tall ? 'py-8' : 'py-16'} px-6 bg-[#020617] border-y border-white/5`}>
      {body}
    </section>
  );
}
