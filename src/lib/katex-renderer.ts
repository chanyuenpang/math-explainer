import katex from 'katex';

export function renderMathText(text: string): string {
  // 对于不含 $ 的纯文本，直接返回
  if (!text.includes('$')) return text;

  // 先处理块级公式 $$...$$
  let result = text.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return match;
    }
  });

  // 再处理行内公式 $...$
  result = result.replace(/\$([^$]+)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return match;
    }
  });

  return result;
}
