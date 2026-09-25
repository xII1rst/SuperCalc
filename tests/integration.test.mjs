import test from 'node:test';
import assert from 'node:assert/strict';
import { integrate } from '../js/math/integration.mjs';

function res(expr, varName = 'x') {
  return integrate(expr, varName);
}

test('regla de la potencia', () => {
  assert.equal(res('x^2').result, '1/3*x^3');
  assert.equal(res('x^3').result, '1/4*x^4');
  assert.equal(res('1').result, 'x');
  assert.equal(res('2').result, '2*x');
  assert.equal(res('3x^2').result, 'x^3');
  assert.equal(res('x^3+x').result, '1/4*x^4 + 1/2*x^2');
  assert.equal(res('x/2').result, '1/4*x^2');
  assert.equal(res('sqrt(x)').result, '2/3*x^(3/2)');
  assert.equal(res('sqrt(2x+1)').result, '1/3*(2*x + 1)^(3/2)');
});

test('tabla de integrales básicas', () => {
  assert.equal(res('sin(x)').result, '-cos(x)');
  assert.equal(res('cos(x)').result, 'sin(x)');
  assert.equal(res('e^x').result, 'e^(x)');
  assert.equal(res('1/x').result, 'ln|x|');
  assert.equal(res('ln(x)').result, 'x*ln(x) - x');
  assert.equal(res('tan(x)').result, '-ln|cos(x)|');
  assert.equal(res('sec(x)').result, 'ln|sec(x) + tan(x)|');
  assert.equal(res('csc(x)').result, '-ln|csc(x) + cot(x)|');
  assert.equal(res('cot(x)').result, 'ln|sin(x)|');
  assert.equal(res('sec(x)^2').result, 'tan(x)');
  assert.equal(res('sec(x)*tan(x)').result, 'sec(x)');
  assert.equal(res('sinh(x)').result, 'cosh(x)');
  assert.equal(res('cosh(x)').result, 'sinh(x)');
  assert.equal(res('tanh(x)').result, 'ln|cosh(x)|');
  assert.equal(res('sin(2x)').result, '-cos(2*x)/2');
  assert.equal(res('cos(3x)').result, 'sin(3*x)/3');
  assert.equal(res('e^(3x)').result, 'e^(3*x)/3');
});

test('integración por partes', () => {
  assert.equal(res('x*e^x').result, 'x*e^(x) - e^(x)');
  assert.equal(res('x*cos(x)').result, 'x*sin(x) + cos(x)');
  assert.equal(res('x*sin(x)').result, '-x*cos(x) + sin(x)');
  assert.equal(res('x^2*sin(x)').result, '-x^2*cos(x) + 2*x*sin(x) + 2*cos(x)');
  assert.equal(res('x*ln(x)').result, '1/2*ln(x)*x^2 - 1/4*x^2');
  assert.equal(res('x*atan(x)').result, '1/2*atan(x)*x^2 - 1/2*x + 1/2*atan(x)');
  assert.equal(res('atan(x)').result, 'atan(x)*x - 1/2*ln|x^2 + 1|');
});

test('integrales trigonométricas', () => {
  assert.equal(res('sin(x)^2').result, 'x/2 - sin(2*x)/4');
  assert.equal(res('cos(x)^2').result, 'x/2 + sin(2*x)/4');
  assert.equal(res('sin(x)^3').result, '-cos(x) + (cos(x))^3/3');
  assert.equal(res('cos(x)^3').result, 'sin(x) - (sin(x))^3/3');
  assert.equal(res('sin(x)^2*cos(x)^2').result, 'x/8 - sin(4*x)/32');
});

test('sustitución u', () => {
  assert.equal(res('ln(x)/x').result, '1/2*(ln(x))^2');
  assert.equal(res('(ln(x))^2/x').result, '1/3*(ln(x))^3');
  assert.equal(res('sin(x)*cos(x)').result, '1/2*(sin(x))^2');
  assert.equal(res('x*sqrt(x^2+1)').result, '1/3*(x^2 + 1)^(3/2)');
  assert.equal(res('2x/(x^2+1)').result, 'ln|x^2 + 1|');
});

test('sustitución trigonométrica y formas cuadráticas', () => {
  assert.equal(res('1/(x^2+1)').result, 'atan(x)');
  assert.equal(res('1/(x^2+4)').result, '1/2*atan(x/2)');
  assert.equal(res('5/(x^2+4)').result, '5/2*atan(x/2)');
  assert.equal(res('1/sqrt(1-x^2)').result, 'asin(x)');
  assert.equal(res('1/sqrt(x^2+1)').result, 'ln|x + sqrt(x^2 + 1)|');
});

test('fracciones parciales', () => {
  assert.equal(res('1/(x^2-4)').result, '-(1/4*ln|x + 2|) + 1/4*ln|x - 2|');
  assert.equal(res('1/(x*(x+1))').result, '-ln|x + 1| + ln|x|');
  assert.equal(res('(x+1)/(x^2-1)').result, 'ln|x - 1|');
  assert.equal(res('x/(x^2+1)').result, '1/2*ln|x^2 + 1|');
  assert.equal(res('x^2/(x+1)').result, '-x + 1/2*x^2 + ln|x + 1|');
});

test('por partes cíclico con exponencial y trigonométrica', () => {
  assert.equal(res('e^x*sin(x)').result, 'e^(x)*(sin(x) - cos(x))/2');
  assert.equal(res('e^(2x)*sin(3x)').result, 'e^(2*x)*(2*sin(3*x) - 3*cos(3*x))/13');
});

test('expresiones sin antiderivada elemental', () => {
  assert.equal(res('e^x/x').result, null);
  assert.equal(res('sin(x)/x').result, null);
  assert.equal(res('e^(x^2)').result, null);
});

test('entrada vacía devuelve result nulo', () => {
  assert.equal(res('').result, null);
  assert.equal(res('   ').result, null);
});
