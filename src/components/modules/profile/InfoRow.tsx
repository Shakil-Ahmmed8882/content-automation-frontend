export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize">{value}</p>
    </div>
  );
}
