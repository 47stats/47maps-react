import type { LegendType } from "../legend";

export const getInterpolateExpression = (legend: LegendType[]) => {
  const expression: (number | string)[] = [];
  legend.forEach((it) => {
    expression.push(it.max /*||Number.MAX_VALUE*/);
    expression.push(it.color);
  });
  return expression;
};

export const getCaseExpression = (item: string, legend: LegendType[]) => {
  const expression: (string | (number | string | string[])[])[] = [];
  legend.forEach((it) => {
    const a: string[] = [];
    a.push("get");
    a.push(item);
    const b: (number | string | string[])[] = [];
    b.push(">=");
    b.push(a);
    b.push(it.min /*||Number.MIN_VALUE*/);
    expression.push(b);
    expression.push(it.color || "rgba(255,255,255,0)");
  });
  return expression;
};
