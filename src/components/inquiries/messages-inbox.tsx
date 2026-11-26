"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import {
  openContactInquiryAction,
  replyContactInquiryAction,
  updateContactInquiryStatusAction,
  type ReplyInquiryState,
  type UpdateInquiryState,
} from "@/server/actions/contact";
import type { ContactInquiryStatus } from "@/server/db/schema";
import type { InquiryFolder } from "@/server/queries/contact-inquiries";

export type InboxListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: ContactInquiryStatus;
  createdAt: string;
};

export type InboxThreadMessage = {
  id: string;
  kind: "inbound" | "outbound";
  authorLabel: string;
  body: string;
  createdAt: string;
  emailSentAt: string | null;
};

type MessagesInboxProps = {
  basePath: "/admin/inquiries" | "/manager/inquiries";
  folder: InquiryFolder;
  items: InboxListItem[];
  selectedId: string | null;
  selected: InboxListItem | null;
  thread: InboxThreadMessage[];
};

const folderTabs: Array<{ value: InquiryFolder; label: string }> = [
  { value: "inbox", label: "Inbox" },
  { value: "unread", label: "Unread" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

const statusInitial: UpdateInquiryState = {};
const replyInitial: ReplyInquiryState = {};

function preview(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  return trimmed.length > 90 ? `${trimmed.slice(0, 87)}…` : trimmed;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function folderHref(
  basePath: string,
  folder: InquiryFolder,
  id?: string | null,
): string {
  const params = new URLSearchParams();
  if (folder !== "inbox") {
    params.set("folder", folder);
  }
  if (id) {
    params.set("id", id);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function StatusActions({
  inquiryId,
  status,
}: {
  inquiryId: string;
  status: ContactInquiryStatus;
}) {
  const [state, formAction, pending] = useActionState(
    updateContactInquiryStatusAction,
    statusInitial,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "NEW" ? (
        <form action={formAction}>
          <input type="hidden" name="inquiryId" value={inquiryId} />
          <input type="hidden" name="status" value="READ" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 disabled:opacity-60"
          >
            Mark read
          </button>
        </form>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="inquiryId" value={inquiryId} />
          <input type="hidden" name="status" value="NEW" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 disabled:opacity-60"
          >
            Mark unread
          </button>
        </form>
      )}
      {status === "ARCHIVED" ? (
        <form action={formAction}>
          <input type="hidden" name="inquiryId" value={inquiryId} />
          <input type="hidden" name="status" value="READ" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 disabled:opacity-60"
          >
            Move to inbox
          </button>
        </form>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="inquiryId" value={inquiryId} />
          <input type="hidden" name="status" value="ARCHIVED" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 disabled:opacity-60"
          >
            Archive
          </button>
        </form>
      )}
      {state.error ? (
        <span className="text-xs text-red-700">{state.error}</span>
      ) : null}
    </div>
  );
}

function ReplyComposer({ inquiryId }: { inquiryId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    replyContactInquiryAction,
    replyInitial,
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-2 border-t border-stone-200 bg-white p-4"
    >
      <input type="hidden" name="inquiryId" value={inquiryId} />
      <label className="block space-y-1.5">
        <span className="text-xs font-medium tracking-wide text-stone-500 uppercase">
          Reply
        </span>
        <textarea
          name="body"
          required
          rows={4}
          maxLength={8000}
          placeholder="Write a reply — this is emailed to the sender."
          className="w-full resize-y rounded-md border border-stone-300 bg-cream/40 px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-500"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-stone-500">
          Sends from your Resend from-address to their email.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send reply"}
        </button>
      </div>
      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-stone-600">{state.success}</p>
      ) : null}
    </form>
  );
}

export function MessagesInbox({
  basePath,
  folder,
  items,
  selectedId,
  selected,
  thread,
}: MessagesInboxProps) {
  return (
    <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-lg border border-stone-200 bg-white lg:h-[calc(100dvh-11rem)] lg:min-h-0 lg:flex-row">
      <aside className="flex w-full flex-col border-b border-stone-200 lg:w-[22rem] lg:shrink-0 lg:border-r lg:border-b-0 xl:w-[26rem]">
        <div className="flex flex-wrap gap-1 border-b border-stone-200 p-2">
          {folderTabs.map((tab) => {
            const active = folder === tab.value;
            return (
              <Link
                key={tab.value}
                href={folderHref(basePath, tab.value, selectedId)}
                className={
                  active
                    ? "rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white"
                    : "rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-stone-500">
              No messages in this folder.
            </p>
          ) : (
            <ul>
              {items.map((item) => {
                const active = item.id === selectedId;
                const unread = item.status === "NEW";
                return (
                  <li key={item.id} className="border-b border-stone-100">
                    <form action={openContactInquiryAction}>
                      <input type="hidden" name="inquiryId" value={item.id} />
                      <input type="hidden" name="basePath" value={basePath} />
                      <input type="hidden" name="folder" value={folder} />
                      <button
                        type="submit"
                        className={
                          active
                            ? "flex w-full flex-col gap-1 bg-forest/10 px-4 py-3 text-left"
                            : "flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-stone-50"
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={
                              unread
                                ? "truncate text-sm font-semibold text-stone-900"
                                : "truncate text-sm font-medium text-stone-800"
                            }
                          >
                            {item.name}
                          </span>
                          <span className="shrink-0 text-[11px] text-stone-500">
                            {formatWhen(item.createdAt)}
                          </span>
                        </div>
                        <span
                          className={
                            unread
                              ? "truncate text-sm font-medium text-stone-800"
                              : "truncate text-sm text-stone-600"
                          }
                        >
                          {item.subject?.trim() || "No subject"}
                        </span>
                        <span className="line-clamp-2 text-xs text-stone-500">
                          {preview(item.message)}
                        </span>
                        {unread ? (
                          <span className="mt-0.5 inline-flex w-fit rounded-full bg-brass/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-forest uppercase">
                            Unread
                          </span>
                        ) : null}
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-h-[28rem] min-w-0 flex-1 flex-col lg:min-h-0">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-base font-medium text-stone-800">
              Select a message
            </p>
            <p className="max-w-sm text-sm text-stone-500">
              Choose a conversation on the left to read it and reply by email.
            </p>
          </div>
        ) : (
          <>
            <header className="space-y-3 border-b border-stone-200 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="font-display text-2xl text-stone-900">
                    {selected.subject?.trim() || "No subject"}
                  </h2>
                  <p className="text-sm text-stone-600">
                    <span className="font-medium text-stone-800">
                      {selected.name}
                    </span>
                    <span className="text-stone-400"> · </span>
                    <span>{selected.email}</span>
                    {selected.phone ? (
                      <>
                        <span className="text-stone-400"> · </span>
                        <span>{selected.phone}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <StatusActions
                  inquiryId={selected.id}
                  status={selected.status}
                />
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-cream/30 px-4 py-4 sm:px-5">
              {thread.map((message) => {
                const outbound = message.kind === "outbound";
                return (
                  <article
                    key={message.id}
                    className={
                      outbound
                        ? "ml-4 rounded-lg border border-forest/15 bg-white px-4 py-3 sm:ml-12"
                        : "mr-4 rounded-lg border border-stone-200 bg-white px-4 py-3 sm:mr-12"
                    }
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-stone-900">
                        {message.authorLabel}
                        {outbound ? (
                          <span className="ml-2 text-xs font-normal text-stone-500">
                            You
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-stone-500">
                        {new Date(message.createdAt).toLocaleString()}
                        {message.emailSentAt ? " · emailed" : null}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-stone-800">
                      {message.body}
                    </p>
                  </article>
                );
              })}
            </div>

            <ReplyComposer inquiryId={selected.id} />
          </>
        )}
      </section>
    </div>
  );
}
