export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  profile: "/profile",
  create: "/create",
  posts: "/posts",
  postDetail: (id: string) => `/posts/${id}`,
  connections: "/connections",
  connectionCallback: (platform: string) => `/connections/callback/${platform}`,
  executions: "/executions",
  executionDetail: (id: string) => `/executions/${id}`,
  payment: "/payment",
  paymentHistory: "/payment/history",
  paymentHistoryDetail: (id: string) => `/payment/history/${id}`,
  paymentSuccess: "/payment/success",
  paymentFailure: "/payment/failure",
  upcomingFeatures: "/upcoming-features",
  upcomingFeatureDetail: (slug: string) => `/upcoming-features/${slug}`,
  admin: "/admin",
  adminPlatforms: "/admin/platforms",
  adminUsers: "/admin/users",
  adminAuditLogs: "/admin/audit-logs",
  adminUpcomingFeatures: "/admin/upcoming-features",
} as const;

export function safeNext(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    [...value].some((character) => character.charCodeAt(0) <= 32)
  )
    return routes.dashboard;
  try {
    const parsed = new URL(value, "https://internal.invalid");
    if (
      parsed.origin !== "https://internal.invalid" ||
      [
        routes.login,
        routes.register,
        routes.forgotPassword,
        routes.resetPassword,
      ].some((path) => parsed.pathname === path)
    )
      return routes.dashboard;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return routes.dashboard;
  }
}

export function loginUrl(next: string, expired = false) {
  const params = new URLSearchParams({ next: safeNext(next) });
  if (expired) params.set("reason", "session-expired");
  return `${routes.login}?${params}`;
}
