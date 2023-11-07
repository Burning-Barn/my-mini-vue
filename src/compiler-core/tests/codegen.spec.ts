import { generate } from "../src/codegen";
import { baseParse } from "../src/parse";
import { transform } from "../src/transform";
import { transformElement } from "../src/transforms/transformElement";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformText } from "../src/transforms/transformText";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");
    transform(ast);
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");
    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast: any = baseParse("<div>hi,{{message}}</div>");
    // const ast: any = baseParse("<div></div>");
    transform(ast, {
      // nodeTransforms: [transformExpression,transformElement, transformText],
      // nodeTransforms: [transformExpression, transformText, transformElement],

      // 处理<div>hi,{{message}}</div>   div：chilren:[{type: 文本}, {type: 插值}]
      // transformExpression Plugin要对以上结构进行处理，如果先执行transformText插件，会把div的chilren相邻的文本节点用“+”号组合成新的联合类型，替换div的chilren,此时在执行插值表达式，因为div的chilren被替换成联合类型！==插值类型，导致处理失败。
      // 顺序transformExpression -》transformElement ——》transformText 放入数组，然后调用transformText =》transformElement -》transformExpression 
      // 这样 root-->div-->hi--->message入栈，调用message处理expressionPlugin后，再处理elementPlugin
      // 先进后出
      // transformElement依赖transformText，而transformExpression要在transformText更改前
      nodeTransforms: [transformExpression, transformElement, transformText],
    });

    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});

