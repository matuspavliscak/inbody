const base = 'inline-flex items-center gap-1.5 text-sm font-medium rounded-lg transition-colors';

export const btn = {
  primary: `${base} px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white`,
  secondary: `${base} px-3 py-1.5 text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50`,
  danger: `${base} px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600`,
  ghost: `${base} px-3 py-1.5 text-gray-500 hover:text-gray-900`,
} as const;
