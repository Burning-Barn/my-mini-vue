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
      nodeTransforms: [transformExpression, transformText, transformElement],
    });

    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});

