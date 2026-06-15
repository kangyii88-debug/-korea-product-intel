export type AppRole = "owner" | "admin" | "analyst" | "viewer";

const permissions: Record<AppRole, string[]> = {
  owner: ["*"],
  admin: ["products:write", "reports:write", "settings:write", "users:manage"],
  analyst: ["products:write", "reports:write", "opportunities:write"],
  viewer: ["products:read", "reports:read", "opportunities:read"],
};

export function can(role: AppRole, permission: string) {
  return permissions[role].includes("*") || permissions[role].includes(permission);
}
