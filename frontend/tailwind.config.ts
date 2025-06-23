import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
          colors: {
            primary: { '50': '#EFF6FF', '100': '#DBEAFE', '200': '#BFDBFE', '300': '#93C5FD', '400': '#60A5FA', '500': '#3B82F6', '600': '#2563EB', '700': '#1D4ED8', '800': '#1E40AF', '900': '#1E3A8A', DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
            popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
            secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
            muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
            accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
            destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif']
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)'
          },
          keyframes: {
            aurora: {
              from: { backgroundPosition: "50% 50%, 50% 50%" },
              to: { backgroundPosition: "350% 50%, 350% 50%" },
            },
          },
          animation: {
            aurora: "aurora 60s linear infinite",
          },
      }
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;