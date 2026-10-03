export const publicNav = [
  { title: "Features", url: "/#features" },
  { title: "How it works", url: "/#how-it-works" },
  { title: "Premium", url: "/#premium" },
] as const;

export const footerColumns = [
  {
    title: "Product",
    links: [
      { title: "Features", url: "/#features" },
      { title: "How it works", url: "/#how-it-works" },
      { title: "Premium", url: "/#premium" },
    ],
  },
  {
    title: "Account",
    links: [
      { title: "Log in", url: "/login" },
      { title: "Sign up", url: "/register" },
    ],
  },
  {
    title: "Platforms",
    links: [
      { title: "LinkedIn", url: "/#features" },
      { title: "Facebook Page", url: "/#features" },
    ],
  },
] as const;
