export type Plan = "starter" | "pro" | "enterprise";
export type Feature = "tasks" | "events" | "access" | "analytics";

export const PLAN_MODULES: Record<Plan, Feature[]> = {
  starter: ["tasks"],
  pro: ["tasks", "events", "access"],
  enterprise: ["tasks", "events", "access", "analytics"],
};
