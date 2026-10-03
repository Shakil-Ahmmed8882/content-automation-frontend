export function CloseIcon({
  className,
  height = "72",
  width = "72",
}: {
  className?: string;
  height?: string;
  width?: string;
}) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 72 72"
      fill="none"
    >
      <circle cx="36" cy="36" r="30" stroke="#FF124B" strokeWidth="4" />
      <path
        d="M43.4999 28.5001L28.5 43.5M28.4999 28.5L43.4999 43.4999"
        stroke="#FF124B"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
