export function getDemoLogin() {
  const enabled = process.env.NEXT_PUBLIC_DEMO_LOGIN_ENABLED === "true";
  const email = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "";
  const password = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";
  return {
    enabled: enabled && Boolean(email && password),
    email: enabled ? email : "",
    password: enabled ? password : "",
  };
}
