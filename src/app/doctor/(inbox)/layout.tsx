import { getMyConversations } from "@/lib/data";
import { ConversationList } from "@/components/doctor/ConversationList";

/**
 * The inbox shell: one conversation list beside whatever is open.
 * Rendered here (not in the pages) so the list keeps its scroll, search and filter
 * while the doctor moves between conversations. On a phone the list hides itself
 * once a conversation is open.
 */
export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const conversations = await getMyConversations();

  // First run: no list to show, so the welcome screen gets the whole width.
  if (conversations.length === 0) return <>{children}</>;

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      <ConversationList rows={conversations} />
      {children}
    </div>
  );
}
