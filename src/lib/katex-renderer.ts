import katex from 'katex';

export function renderMathText(text: string): string {
  if (!text) return '';
  
  console.log('[XSS防护] 原始输入:', text.substring(0, 100));

  // 1. 先转义 HTML 实体，防止 XSS 攻击
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  console.log('[XSS防护] 转义后:', escaped.substring(0, 100));

  // 对于不含 $ 的纯文本，直接返回转义后的内容
  if (!escaped.includes('$')) return escaped;

  // 先处理块级公式 $$...$$
  let result = escaped.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
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
