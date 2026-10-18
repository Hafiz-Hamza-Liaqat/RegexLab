import React from 'react';
import { Bookmark, Info } from 'lucide-react';
import { PRESETS } from '../../data/presets.ts';
import type { Preset } from '../../types/regex.ts';

interface PresetSelectorProps {
  activePresetId?: string;
  onSelectPreset: (preset: Preset) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  activePresetId,
  onSelectPreset,
}) => {
  const currentPreset = PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Bookmark className="w-4 h-4 text-indigo-500" />
          <span>Curated Presets</span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Load standard regex patterns & test datasets
        </span>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => {
          const isSelected = preset.id === activePresetId;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Disclaimer / Note if active preset has one */}
      {currentPreset && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {currentPreset.name}:
              </span>{' '}
              {currentPreset.description}
            </div>
            {currentPreset.disclaimer && (
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                Note: {currentPreset.disclaimer}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
