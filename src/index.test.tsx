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

import React from "react";
import { render, screen } from "@testing-library/react";

import { ContentTabsPlaceholder } from "./index";

describe("ContentTabsPlaceholder", () => {
  it("names the widget so editors can see the block is present", () => {
    render(<ContentTabsPlaceholder />);

    expect(screen.getByText("Content-Tabs")).toBeInTheDocument();
  });
});
