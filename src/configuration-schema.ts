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

import { UiSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";

/**
 * Schema for the widget's configuration dialog.
 *
 * The field is `tab-title`, not `title`: `title` is a global HTML attribute and
 * the browser would turn it into a tooltip on the element.
 *
 * The key is byte-identical to `TAB_TITLE_ATTRIBUTE`, and it has to be: the
 * host saves a value under its schema key verbatim, and reads it back off the
 * element under the declared attribute name. A key that differs from the
 * declared attribute — even only in case — is written where nothing looks.
 *
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    "tab-title": {
      type: "string",
      title: "Titel des Tabs",
    },
  },
};

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  "tab-title": {
    "ui:help": "Beschriftung des Tabs. Diese Spalte wird zu einem Tab dieses Namens.",
  },
};
