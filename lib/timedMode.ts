export type TimerPreset = "short" | "medium" | "long";

export type TimerConfig = {
  preset: TimerPreset;
  seconds: number;
  label: string;
};

const TIMER_PRESETS: Record<TimerPreset, TimerConfig> = {
  short: { preset: "short", seconds: 180, label: "3 min" },
  medium: { preset: "medium", seconds: 600, label: "10 min" },
  long: { preset: "long", seconds: 1200, label: "20 min" },
};

export function getTimerConfig(preset: TimerPreset): TimerConfig {
  return TIMER_PRESETS[preset];
}

export function getTimerPresetLabel(preset: TimerPreset): string {
  return TIMER_PRESETS[preset].label;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
