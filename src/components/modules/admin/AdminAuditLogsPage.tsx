"use client";

import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/components/reusable-ui-blocks/hooks/useDebounce";
import { NoResultFoundWrapper } from "@/components/reusable-ui-blocks/placeholder/no-results-found-wrapper/NoResultFoundWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditLogs } from "@/hooks/admin-audit-log.hook";
import { toApiError } from "@/lib/api-error";
import { routes } from "@/routes";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditLog,
} from "@/types/admin.type";
import { AdminPager } from "./AdminPager";
import {
  AdminEmptyState,
  AdminErrorState,
  AdminListSkeleton,
  AdminPageHeader,
  AdminTableShell,
  formatAdminDateTime,
  tdClass,
  thClass,
} from "./AdminShared";

const PAGE_SIZE = 10;
const ALL = "__all";
const OTHER = "__other";

function parsePage(value: string | null) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

type FilterKey = "action" | "entityType" | "actorId";

function KnownValueFilter({
  label,
  known,
  value,
  onChange,
}: {
  label: string;
  known: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const isKnown = known.includes(value);
  const [otherMode, setOtherMode] = useState(!!value && !isKnown);
  const selectValue = otherMode ? OTHER : value || ALL;
  const [text, setText] = useState(isKnown ? "" : value);
  const debouncedText = useDebounce(text.trim(), 300);

  useEffect(() => {
    if (!otherMode || debouncedText === value) return;
    onChange(debouncedText);
    // biome-ignore lint/correctness/useExhaustiveDependencies: react to typed text only
  }, [debouncedText, otherMode]);

  // The URL cleared externally (Reset): leave other mode.
  useEffect(() => {
    if (!value) {
      setOtherMode(false);
      setText("");
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next === OTHER) {
            setOtherMode(true);
            return;
          }
          setOtherMode(false);
          setText("");
          onChange(next === ALL ? "" : next);
        }}
      >
        <SelectTrigger id={id} className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {known.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
          <SelectItem value={OTHER}>Other...</SelectItem>
        </SelectContent>
      </Select>
      {otherMode ? (
        <Input
          aria-label={`${label} (custom value)`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Exact value"
        />
      ) : null}
    </div>
  );
}

function ActorFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const debounced = useDebounce(text.trim(), 300);

  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // biome-ignore lint/correctness/useExhaustiveDependencies: react to typed text only
  }, [debounced]);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        Actor ID
      </label>
      <Input
        id={id}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="User UUID"
        className="font-mono text-xs sm:w-72"
      />
    </div>
  );
}

function AuditRow({
  log,
  onFilterActor,
}: {
  log: AuditLog;
  onFilterActor: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const Icon = open ? ChevronDown : ChevronRight;

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied.");
    } catch {
      toast.error("Couldn't copy.");
    }
  }

  return (
    <Fragment>
      <tr>
        <td className={`${tdClass} whitespace-nowrap`}>
          <time dateTime={log.createdAt}>
            {formatAdminDateTime(log.createdAt)}
          </time>
        </td>
        <td className={`${tdClass} font-mono text-xs`}>{log.action}</td>
        <td className={tdClass}>
          <p>{log.entityType}</p>
          {log.entityId ? (
            <p className="font-mono text-xs break-all text-muted-foreground">
              {log.entityId}
            </p>
          ) : null}
        </td>
        <td className={tdClass}>
          {log.actorId ? (
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs break-all">{log.actorId}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Copy actor ID"
                onClick={() => void copy(log.actorId as string)}
              >
                <Copy aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </td>
        <td className={`${tdClass} text-right`}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((current) => !current)}
          >
            <Icon aria-hidden="true" />
            {open ? "Hide" : "Details"}
          </Button>
        </td>
      </tr>
      {open ? (
        <tr id={detailId}>
          <td colSpan={5} className="border-b border-border bg-muted/40 px-4 py-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="eyebrow">Entity ID</dt>
                <dd className="font-mono text-xs break-all">
                  {log.entityId ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="eyebrow">IP address</dt>
                <dd className="font-mono text-xs">{log.ipAddress ?? "-"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="eyebrow">User agent</dt>
                <dd className="text-xs break-all">{log.userAgent ?? "-"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="eyebrow">Metadata</dt>
                <dd>
                  {log.metadata == null ? (
                    <span className="text-xs text-muted-foreground">
                      No metadata
                    </span>
                  ) : (
                    <pre
                      tabIndex={0}
                      className="max-h-64 overflow-auto rounded-sm border border-border bg-background p-3 font-mono text-xs"
                    >
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </dd>
              </div>
            </dl>
            {log.actorId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => onFilterActor(log.actorId as string)}
              >
                Filter by this actor
              </Button>
            ) : null}
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}

export function AdminAuditLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const action = searchParams.get("action") ?? "";
  const entityType = searchParams.get("entityType") ?? "";
  const actorId = searchParams.get("actorId") ?? "";
  const hasFilters = !!(action || entityType || actorId);

  const query = useAuditLogs({
    page,
    limit: PAGE_SIZE,
    action: action || undefined,
    entityType: entityType || undefined,
    actorId: actorId || undefined,
  });

  const updateUrl = useCallback(
    (updates: Partial<Record<FilterKey | "page", string>>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && !(key === "page" && value === "1")) next.set(key, value);
        else next.delete(key);
      }
      const qs = next.toString();
      router.replace(
        qs ? `${routes.adminAuditLogs}?${qs}` : routes.adminAuditLogs,
      );
    },
    [router, searchParams],
  );

  const setFilter = (key: FilterKey) => (value: string) =>
    updateUrl({ [key]: value, page: "1" });

  const rows = query.data?.data ?? [];

  return (
    <section className="space-y-5">
      <AdminPageHeader
        eyebrow="Admin"
        title="Audit logs"
        description="A read-only trail of sensitive actions, newest first."
      />

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4 shadow-card">
        <KnownValueFilter
          label="Action"
          known={AUDIT_ACTIONS}
          value={action}
          onChange={setFilter("action")}
        />
        <KnownValueFilter
          label="Entity type"
          known={AUDIT_ENTITY_TYPES}
          value={entityType}
          onChange={setFilter("entityType")}
        />
        <ActorFilter value={actorId} onChange={setFilter("actorId")} />
        <Button
          type="button"
          variant="outline"
          disabled={!hasFilters}
          onClick={() =>
            updateUrl({ action: "", entityType: "", actorId: "", page: "1" })
          }
        >
          Reset
        </Button>
      </div>

      {query.isPending ? (
        <AdminListSkeleton label="Loading audit logs" />
      ) : query.isError ? (
        <AdminErrorState
          message={toApiError(query.error).userMessage}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : (
        <NoResultFoundWrapper
          data={rows}
          fallback={
            <AdminEmptyState
              title={
                hasFilters
                  ? "No entries match these filters."
                  : "No audit entries yet"
              }
              action={
                hasFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      updateUrl({
                        action: "",
                        entityType: "",
                        actorId: "",
                        page: "1",
                      })
                    }
                  >
                    Reset filters
                  </Button>
                ) : undefined
              }
            />
          }
        >
          <AdminTableShell label="Audit logs">
            <thead>
              <tr>
                <th className={thClass}>Time</th>
                <th className={thClass}>Action</th>
                <th className={thClass}>Entity</th>
                <th className={thClass}>Actor ID</th>
                <th className={thClass}>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => (
                <AuditRow
                  key={log.id}
                  log={log}
                  onFilterActor={(id) => updateUrl({ actorId: id, page: "1" })}
                />
              ))}
            </tbody>
          </AdminTableShell>
          <AdminPager
            page={page}
            meta={query.data?.meta}
            onPageChange={(next) => updateUrl({ page: String(next) })}
          />
        </NoResultFoundWrapper>
      )}
    </section>
  );
}
