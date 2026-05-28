import { useRef, useEffect, useCallback } from 'react';

interface DrumPickerProps {
  label: string;
  values: string[];
  selected: string;
  onChange: (val: string) => void;
  color?: string;
}

const ITEM_H = 44;
const VISIBLE = 5;

export default function DrumPicker({ label, values, selected, onChange, color = '#3b82f6' }: DrumPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const selectedIdx = values.indexOf(selected);

  const scrollToIdx = useCallback((idx: number, smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    scrollToIdx(Math.max(0, selectedIdx), false);
  }, []);

  useEffect(() => {
    if (!isScrolling.current) {
      scrollToIdx(Math.max(0, selectedIdx), true);
    }
  }, [selected, selectedIdx, scrollToIdx]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isScrolling.current = true;

    clearTimeout((handleScroll as any)._t);
    (handleScroll as any)._t = setTimeout(() => {
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, values.length - 1));
      el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
      onChange(values[clamped]);
      isScrolling.current = false;
    }, 80);
  }, [values, onChange]);

  const containerH = ITEM_H * VISIBLE;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 72 }}>
      <div style={{
        fontSize: 10, color: '#3d4a5c', fontFamily: 'var(--mono)',
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
      }}>
        {label}
      </div>

      <div style={{
        position: 'relative', height: containerH, overflow: 'hidden',
        borderRadius: 12, border: '1px solid #1a1f2e',
        background: '#0a0c12', width: '100%',
      }}>
        {/* Gradiente superior */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: ITEM_H * 2,
          background: 'linear-gradient(to bottom, #0a0c12, transparent)',
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* Selector highlight */}
        <div style={{
          position: 'absolute',
          top: ITEM_H * 2,
          left: 0, right: 0,
          height: ITEM_H,
          background: `${color}18`,
          borderTop: `1px solid ${color}40`,
          borderBottom: `1px solid ${color}40`,
          pointerEvents: 'none', zIndex: 1,
        }} />

        {/* Gradiente inferior */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: ITEM_H * 2,
          background: 'linear-gradient(to top, #0a0c12, transparent)',
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* Scroll list */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          style={{
            height: '100%',
            overflowY: 'scroll',
            scrollbarWidth: 'none',
            paddingTop: ITEM_H * 2,
            paddingBottom: ITEM_H * 2,
          }}
        >
          {values.map((v, i) => {
            const isSelected = i === selectedIdx;
            return (
              <div
                key={v}
                onClick={() => { onChange(v); scrollToIdx(i); }}
                style={{
                  height: ITEM_H,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isSelected ? 15 : 13,
                  fontWeight: isSelected ? 700 : 400,
                  color: isSelected ? color : '#3d4a5c',
                  fontFamily: 'var(--mono)',
                  cursor: 'pointer',
                  transition: 'color 0.15s, font-size 0.1s',
                  userSelect: 'none',
                }}
              >
                {v}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
