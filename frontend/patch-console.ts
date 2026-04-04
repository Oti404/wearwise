// === SUPPRESSING HARMLESS WEB WARNINGS ===
const SUPPRESSED_WARNINGS = [
  'shadow*',
  'pointerEvents is deprecated',
  'useNativeDriver',
  'aria-hidden'
];

const shouldSuppress = (args: any[]) => {
  const msg = args.map(String).join(' ');
  return SUPPRESSED_WARNINGS.some(w => msg.includes(w));
};

const originalWarn = console.warn;
console.warn = (...args) => {
  if (shouldSuppress(args)) return;
  originalWarn(...args);
};

const originalError = console.error;
console.error = (...args) => {
  if (shouldSuppress(args)) return;
  originalError(...args);
};
// =========================================
