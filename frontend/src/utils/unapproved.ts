import type { UserStub } from "../components/ApprovalWaitingOn";

// Display helpers for the upcoming/past unapproved lists.
export const capitalise = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

export const staffName = (user: UserStub | null) => user ? `${user.fn} ${user.ln}` : '—';
