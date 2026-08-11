/*!
 * Copyright 2026, Staffbase SE and contributors.
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
import { PANEL_CLASS } from "./tabs-transform";

afterEach(() => {
  document.head.innerHTML = "";
});

describe("CONTENT_TABS_CSS", () => {
  it("outranks the host's own column rules on a panel", () => {
    // A panel is still one of the host's column elements and still carries its
    // column classes. Inside our container that geometry is wrong: the panels
    // stack and each must fill the width. A single class would only tie with
    // the host's, and the winner would come down to stylesheet order.
    expect(CONTENT_TABS_CSS).toContain(`.${PANEL_CLASS}.${PANEL_CLASS} {`);
  });

  it("takes back the width the host gave the column", () => {
    const rule = CONTENT_TABS_CSS.split(`.${PANEL_CLASS}.${PANEL_CLASS} {`)[1].split("}")[0];

    expect(rule).toContain("width: 100%");
    expect(rule).toContain("max-width: 100%");
    expect(rule).toContain("position: static");
    expect(rule).toContain("grid-column: auto");
  });

  it("hides an inactive panel by attribute, not only by inline style", () => {
    // The host re-renders these columns and writes their style attribute from
    // its own state; a rule keyed on `hidden` survives that.
    expect(CONTENT_TABS_CSS).toContain(`.${PANEL_CLASS}.${PANEL_CLASS}[hidden] {`);
  });
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
