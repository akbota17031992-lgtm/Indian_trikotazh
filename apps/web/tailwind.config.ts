import type { Config } from 'tailwindcss';
import { indiaTrikotajPreset } from '@india-trikotaj/ui';

const config: Config = {
  presets: [indiaTrikotajPreset],
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
