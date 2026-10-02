import { flattenFactors, neg } from './ast-tools.mjs';

// ── Impresión con coeficientes fraccionarios ──
export function prettyCoeff(c) {
  if (Math.abs(c) < 1e-12) return '0';
  if (Number.isInteger(c)) return String(c);
  const negative = c < 0;
  const a = Math.abs(c);
  for (let d = 2; d <= 32; d++) {
    const n = Math.round(a * d);
    if (Math.abs(n / d - a) < 1e-9) return (negative ? '-' : '') + n + '/' + d;
  }
  return String(Number(c.toPrecision(12)));
}

export function pretty(node, v) {
  if (!node) return '0';
  const P = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3, neg: 4 };
  function s(node, pp) {
    switch (node.type) {
      case 'num': {
        const x = node.val;
        if (Math.abs(x - Math.PI) < 1e-9) return 'π';
        if (Math.abs(x - Math.E) < 1e-9) return 'e';
        return prettyCoeff(x);
      }
      case 'var': return node.val;
      case 'neg': {
        const inner = s(node.arg, P.neg);
        const needsParens = ['+', '-', '*', '/', 'neg'].includes(node.arg.type);
        return needsParens ? `-(${inner})` : `-${inner}`;
      }
      case 'fn': {
        const inner = s(node.arg, 0);
        if (node.fn === 'exp') return `e^(${inner})`;
        if (node.fn === 'ln') return node.arg.type === 'fn' && node.arg.fn === 'abs'
          ? `ln|${s(node.arg.arg, 0)}|` : `ln(${inner})`;
        if (node.fn === 'abs') return `|${inner}|`;
        return `${node.fn}(${inner})`;
      }
      case '+': {
        const l = s(node.left, 1), r = s(node.right, 1);
        return r.startsWith('-') ? `${l} ${r}` : `${l} + ${r}`;
      }
      case '-': {
        const l = s(node.left, 1), r = s(node.right, 1);
        if (r.startsWith('-')) return `${l} + ${r.slice(1)}`;
        const rStr = (node.right.type === '+' || node.right.type === '-') ? `(${r})` : r;
        return `${l} - ${rStr}`;
      }
      case '*': {
        const fs = flattenFactors(node);
        let coef = 1;
        const rest = [];
        for (const f of fs) {
          if (f.type === 'num') coef *= f.val;
          else if (f.type === 'neg' && f.arg.type === 'num') coef *= -f.arg.val;
          else if (f.type === 'neg') { coef *= -1; rest.push(f.arg); }
          else rest.push(f);
        }
        if (rest.length === 0) return prettyCoeff(coef);
        const body = rest.map(f => {
          const inner = s(f, 2);
          return (f.type === '+' || f.type === '-') ? `(${inner})` : inner;
        }).join('*');
        const sign = coef < 0 ? -1 : 1;
        const mag = Math.abs(coef);
        if (mag === 1) return (sign < 0 ? '-' : '') + body;
        return (sign < 0 ? '-' : '') + prettyCoeff(mag) + '*' + body;
      }
      case '/': {
        const l = s(node.left, 2), r = s(node.right, 2);
        const lStr = (node.left.type === '+' || node.left.type === '-') ? `(${l})` : l;
        const needsParens = ['+', '-', '*', '/'].includes(node.right.type) || /[+\-/]/.test(r);
        const rStr = needsParens ? `(${r})` : r;
        return `${lStr}/${rStr}`;
      }
      case '^': {
        const l = s(node.left, 3), r = s(node.right, 3);
        const lStr = (node.left.type !== 'num' && node.left.type !== 'var') ? `(${l})` : l;
        const rStr = /[+\-/]/.test(r) ? `(${r})` : r;
        return `${lStr}^${rStr}`;
      }
      default: return '?';
    }
  }
  return s(node, 0);
}
