// Minimal local shim for font helpers used in layout.tsx
// The real project used `next/font/google` which may not be available
// or may have a different export shape in this environment. Provide
// lightweight functions that return the expected shape (variable and className).

type FontOptions = { variable?: string; subsets?: string[] };

function makeFont(name: string) {
  return function (opts: FontOptions = {}) {
    const varName = opts.variable || `--font-${name.toLowerCase()}`;
    // Provide a safe className string and variable property used in layout
    return {
      variable: varName,
      className: `${name}-font`,
    };
  };
}

export const Geist = makeFont('Geist');
export const Geist_Mono = makeFont('Geist_Mono');

export default {};
