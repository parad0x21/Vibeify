/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiFeatures from "../aiFeatures.js";
import type * as aiKnowledge from "../aiKnowledge.js";
import type * as aiStack from "../aiStack.js";
import type * as apps from "../apps.js";
import type * as chatMessages from "../chatMessages.js";
import type * as columns from "../columns.js";
import type * as features from "../features.js";
import type * as firecrawl from "../firecrawl.js";
import type * as http from "../http.js";
import type * as knowledge from "../knowledge.js";
import type * as prds from "../prds.js";
import type * as releases from "../releases.js";
import type * as stacks from "../stacks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiFeatures: typeof aiFeatures;
  aiKnowledge: typeof aiKnowledge;
  aiStack: typeof aiStack;
  apps: typeof apps;
  chatMessages: typeof chatMessages;
  columns: typeof columns;
  features: typeof features;
  firecrawl: typeof firecrawl;
  http: typeof http;
  knowledge: typeof knowledge;
  prds: typeof prds;
  releases: typeof releases;
  stacks: typeof stacks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
