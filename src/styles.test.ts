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

import { STYLE_ELEMENT_ID, ensureStyles } from "./styles";

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
