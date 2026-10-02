/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CONTENT_TABS_CSS, STYLE_ELEMENT_ID, ensureStyles } from "./styles";

/** The declarations of the rule whose selector is exactly `selector`. */
function ruleOf(selector: string): string {
  const rule = CONTENT_TABS_CSS.split("}")
    .map((block) => block.split("{"))
    .find(([head]) => head.trim() === selector);
  expect(rule).toBeDefined();
  return rule?.[1] ?? "";
}

const TAB = ".content-tabs-bar__list .content-tabs-tab";

afterEach(() => {
  document.head.innerHTML = "";
});

describe("ensureStyles", () => {
  it("puts the stylesheet into the head", () => {
    ensureStyles();

    const style = document.getElementById(STYLE_ELEMENT_ID);
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain(".content-tabs-group");
  });

  it("adds it only once, however often it is asked", () => {
    ensureStyles();
    ensureStyles();
    ensureStyles();

    expect(document.querySelectorAll(`#${STYLE_ELEMENT_ID}`)).toHaveLength(1);
  });
});

describe("the tab strip (Craft tabs)", () => {
  it("sets no tab in capitals and tracks nothing", () => {
    expect(CONTENT_TABS_CSS).not.toMatch(/uppercase|MANEurope/i);
    expect(CONTENT_TABS_CSS).not.toMatch(/letter-spacing:(?!\s*normal;)/);
    expect(ruleOf(TAB)).toMatch(/text-transform: none;/);
  });

  it("is 40px high, Condensed 700 16px, padded 0 16", () => {
    const tab = ruleOf(TAB);
    expect(tab).toContain("height: 40px;");
    expect(tab).toContain("font-family: var(--man-font-head,");
    expect(tab).toContain("font-weight: var(--man-weight-head, 700);");
    expect(tab).toContain("font-size: 16px;");
    expect(tab).toContain("padding: 0 var(--man-space-4, 16px);");
    expect(tab).toContain("border-radius: var(--man-radius-soft, 2px) var(--man-radius-soft, 2px) 0 0;");
  });

  it("rests on a 2px baseline in the subtle border colour", () => {
    expect(ruleOf(".content-tabs-bar__list")).toContain(
      "box-shadow: inset 0 calc(-1 * var(--man-border-width-strong, 2px)) 0 0 var(--content-tabs-strip-border);",
    );
    expect(CONTENT_TABS_CSS).toContain("--content-tabs-strip-border: var(--man-border-subtle, #eaedf3);");
  });

  it("fades in a dark red line on hover over 300ms", () => {
    expect(ruleOf(TAB)).toContain(
      "transition: border-bottom-color var(--man-duration-slow, 300ms) var(--man-ease-move,",
    );
    expect(ruleOf(`${TAB}:hover, ${TAB}:active`)).toContain(
      "border-bottom-color: var(--content-tabs-hover-accent);",
    );
    expect(CONTENT_TABS_CSS).toContain("--content-tabs-hover-accent: var(--man-red-hover, #ad0040);");
  });

  it("marks the selected tab with red text and a red line, not with weight", () => {
    const selected = ruleOf(`${TAB}[aria-selected=true]`);
    expect(selected).toContain("color: var(--content-tabs-tab-active-color);");
    expect(selected).toContain("border-bottom-color: var(--content-tabs-accent);");
    expect(selected).not.toContain("font-weight");
    expect(CONTENT_TABS_CSS).toContain("--content-tabs-tab-active-color: var(--man-red, #e40045);");
  });

  it("draws the Craft focus ring inside the tab", () => {
    const focus = ruleOf(`${TAB}:focus-visible`);
    expect(focus).toContain("outline: var(--man-focus-width, 2px) solid var(--man-focus-color, #3875b2)");
    expect(focus).toMatch(/outline-offset: calc\(-1 \* var\(--man-focus-width, 2px\)\) !important;\s*$/);
  });
});
