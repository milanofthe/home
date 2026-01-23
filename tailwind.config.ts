import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Phase Space theme
				charcoal: {
					DEFAULT: '#0f0f0f',
					warm: '#121210',
					light: '#1a1a18'
				},
				teal: {
					DEFAULT: '#00d9c0',
					dark: '#00b3a0',
					light: '#33e3cf',
					glow: 'rgba(0, 217, 192, 0.15)'
				},
				amber: {
					DEFAULT: '#f5a623',
					dark: '#d4900f',
					light: '#f7b84d'
				},
				cream: {
					DEFAULT: '#f0efe9',
					dark: '#d4d3cd',
					light: '#f7f6f2'
				},
				// PathSim brand
				pathsim: {
					DEFAULT: '#0070c0',
					dark: '#005a9e',
					light: '#3399d6',
					glow: 'rgba(0, 112, 192, 0.15)'
				},
				// PySimHub brand
				pysimhub: {
					DEFAULT: '#6366f1',
					dark: '#4f46e5',
					light: '#818cf8',
					glow: 'rgba(99, 102, 241, 0.15)'
				}
			},
			fontFamily: {
				display: ['Space Grotesk', 'system-ui', 'sans-serif'],
				body: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'monospace']
			},
			animation: {
				'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'trace': 'trace 3s ease-in-out infinite',
				'fade-in': 'fadeIn 0.6s ease-out forwards',
				'slide-up': 'slideUp 0.6s ease-out forwards'
			},
			keyframes: {
				trace: {
					'0%, 100%': { strokeDashoffset: '1000' },
					'50%': { strokeDashoffset: '0' }
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				}
			},
			backgroundImage: {
				'grid-pattern':
					'linear-gradient(rgba(0, 217, 192, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 192, 0.03) 1px, transparent 1px)',
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
			},
			backgroundSize: {
				'grid': '50px 50px'
			}
		}
	},
	plugins: []
} satisfies Config;
