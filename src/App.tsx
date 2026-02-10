import { useEffect, useCallback, useState } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from '@/hooks/useEmails';
import { useRealtimeEmailSync } from '@/hooks/useRealtimeEmailSync';
import { useAppContext, useCopilotEmailActions } from '@/hooks/useCopilotActions';
import type { Email } from '@/types/email';
import { Sidebar } from '@/components/Sidebar';
import { EmailList } from '@/components/EmailList';
import { EmailDetail } from '@/components/EmailDetail';
import { Compose } from '@/components/Compose';
import { FilterBar } from '@/components/FilterBar';
import { CopilotSidebar } from '@/components/CopilotSidebar';
import { Moon, Sun, RefreshCw, Sparkles } from 'lucide-react';
import { getStoredAccessToken, isAuthenticated } from '@/services/auth';
import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { formatReplyDate, isWithinRange } from '@/lib/utils';

/*
 * RESPONSIVE DESIGN STRATEGY
 * ==========================
 *
 * Breakpoint Strategy (Tailwind CSS v4):
 * - Mobile: < 640px (no breakpoint prefix) - Single column, stacked layout
 * - Tablet: 640px - 1023px (sm:, md:, lg:) - Condensed layout
 * - Desktop: >= 1024px (xl:) - Full 3-column layout
 *
 * Current Layout Structure:
 * 1. Sidebar (240px fixed) - Navigation and compose
 * 2. Main content (flex-1) - Email list/detail and filters
 * 3. CopilotSidebar (320px fixed, toggleable) - AI assistant panel
 *
 * Responsive Behaviors:
 * - All containers use h-screen + overflow-hidden for app-like feel
 * - Flex layout allows proper shrinking/expansion
 * - Components have responsive variants (e.g., FilterBar hides "Filter" text on mobile)
 *
 * Known Limitations:
 * - Sidebar is always visible (future: mobile drawer)
 * - CopilotSidebar is fixed 320px (future: collapsible on tablet)
 * - EmailDetail doesn't use full-screen on mobile (future: modal overlay)
 *
 * Touch Targets:
 * - All buttons meet 44x44px minimum (Button component h-10 + padding)
 * - Email list items: min-h-[72px]
 * - Icon buttons: h-10 w-10 (40px, meets guidelines with visual expansion)
 */
function AppContent() {
  const {
    currentView,
    selectedEmailId,
    emails,
    filters,
    darkMode,
    toggleDarkMode,
    setCurrentView,
    setSelectedEmailId,
    setAccessToken,
    setUser,
  } = useAppStore();

  const {
    fetchInbox,
    fetchSent,
    sendEmail,
    isLoading,
    pagination,
    loadMore,
    resetAllPagination,
  } = useEmails();

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [composeInitialData, setComposeInitialData] = useState<{
    to?: string;
    subject?: string;
    body?: string;
    cc?: string;
  }>({});

  // Set up CopilotKit context and actions
  useAppContext();
  const { composeData } = useCopilotEmailActions();

  // Set up real-time sync (polling every 30 seconds)
  const { sync } = useRealtimeEmailSync({
    pollingInterval: 30000,
    enabled: isAuthenticated() || undefined,
  });

  // Sync compose data between UI and AI
  useEffect(() => {
    if (composeData.isOpen) {
      setComposeInitialData({
        to: composeData.to,
        subject: composeData.subject,
        body: composeData.body,
        isSending: composeData.isSending,
      });
      setIsComposeOpen(true);
    }
  }, [composeData.to, composeData.subject, composeData.body, composeData.isOpen, composeData.isSending]);

  // Check auth on mount and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const token = getStoredAccessToken();
        if (token) {
          setAccessToken(token);

          // Fetch user profile
          try {
            const { GmailService } = await import('@/services/gmail');
            const gmail = new GmailService(token);
            const profile = await gmail.getUserProfile();
            setUser({ emailAddress: profile.emailAddress });
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
          }

          // Only fetch inbox if it's empty (avoid duplicate fetches)
          if (emails.inbox.length === 0) {
            await fetchInbox();
          }
        }
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // Refresh emails when view changes
  useEffect(() => {
    const fetchForView = async () => {
      if (!isAuthenticated()) return;

      // Reset pagination when switching views
      resetAllPagination();

      if (currentView === 'inbox') {
        await fetchInbox();
      } else if (currentView === 'sent') {
        await fetchSent();
      }
    };
    fetchForView();
  }, [currentView, fetchInbox, fetchSent, resetAllPagination]);

  // Reset pagination when filters change
  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      resetAllPagination();
    }
  }, [filters, resetAllPagination]);

  // Get current email list based on view with filters applied
  const getCurrentEmails = useCallback(() => {
    const emailList = currentView === 'inbox' ? emails.inbox :
                      currentView === 'sent' ? emails.sent : [];

    // Apply filters if any are set
    if (!filters || Object.keys(filters).length === 0) {
      return emailList;
    }

    return emailList.filter((email: Email) => {
      // Filter by query (searches subject and body)
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const subjectMatch = email.subject.toLowerCase().includes(query);
        const bodyMatch = email.body.toLowerCase().includes(query);
        const fromMatch = email.from.email.toLowerCase().includes(query) ||
                         (email.from.name && email.from.name.toLowerCase().includes(query));
        if (!subjectMatch && !bodyMatch && !fromMatch) {
          return false;
        }
      }

      // Filter by sender
      if (filters.sender) {
        const sender = filters.sender.toLowerCase();
        const matchesEmail = email.from.email.toLowerCase().includes(sender);
        const matchesName = email.from.name && email.from.name.toLowerCase().includes(sender);
        if (!matchesEmail && !matchesName) {
          return false;
        }
      }

      // Filter by unread status
      if (filters.isUnread !== undefined && email.isUnread !== filters.isUnread) {
        return false;
      }

      // Filter by date range
      if (filters.dateFrom || filters.dateTo) {
        if (!isWithinRange(email.date, filters.dateFrom, filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [currentView, emails, filters]);

  // Get current pagination state based on view
  const getCurrentPagination = useCallback(() => {
    if (currentView === 'inbox') return pagination.inbox;
    if (currentView === 'sent') return pagination.sent;
    return undefined;
  }, [currentView, pagination]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (currentView === 'inbox') {
      loadMore('inbox');
    } else if (currentView === 'sent') {
      loadMore('sent');
    }
  }, [currentView, loadMore]);

  // Get selected email
  const selectedEmail = getCurrentEmails().find((e: Email) => e.id === selectedEmailId) || null;

  // Handle email select
  const handleSelectEmail = useCallback((email: Email) => {
    setSelectedEmailId(email.id);
  }, [setSelectedEmailId]);

  // Handle compose
  const handleCompose = useCallback(() => {
    setComposeInitialData({});
    setIsComposeOpen(true);
  }, []);

  // Handle reply
  const handleReply = useCallback((emailId: string) => {
    const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);
    if (email) {
      setComposeInitialData({
        to: email.from.email,
        subject: email.subject.startsWith('Re:')
          ? email.subject
          : `Re: ${email.subject}`,
        body: `\n\n----------\nOn ${formatReplyDate(email.date)}, ${email.from.name || email.from.email} wrote:\n${email.body.slice(0, 200)}...`,
      });
      setIsComposeOpen(true);
    }
  }, [emails]);

  // Handle send email
  const handleSendEmail = useCallback(async (data: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
  }) => {
    await sendEmail({
      to: [data.to],
      subject: data.subject,
      body: data.body,
      cc: data.cc ? [data.cc] : undefined,
    });
  }, [sendEmail]);

  // Handle forward
  const handleForward = useCallback((emailId: string) => {
    const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);
    if (email) {
      setComposeInitialData({
        subject: `Fwd: ${email.subject}`,
        body: `\n\n----------\nForwarded message:\nFrom: ${email.from.name || email.from.email}\nSubject: ${email.subject}\n\n${email.body}`,
      });
      setIsComposeOpen(true);
    }
  }, [emails]);

  // Get unread count
  const unreadCount = emails.inbox.filter((e: Email) => e.isUnread).length;

  return (
    <div className="flex h-screen overflow-hidden mesh-gradient">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onCompose={handleCompose}
        unreadCount={unreadCount}
        isLoading={isLoading}
        onRefresh={currentView === 'inbox' ? fetchInbox : fetchSent}
        isAuthenticated={isAuthenticated()}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm">
        {/* Header with filters and actions */}
        <header className="glass-elevated border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/70 dark:bg-neutral-900/70 transition-smooth">
          <div className="flex items-center px-5 py-3">
            {/* Filters */}
            <div className="flex-1">
              <FilterBar
                filters={filters}
                onFiltersChange={useAppStore.getState().setFilters}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={sync}
                title="Sync emails"
                className="h-9 w-9 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-300"
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className={`h-9 w-9 rounded-xl relative transition-all duration-300 ${
                  isCopilotOpen
                    ? 'bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/30'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                }`}
                title={isCopilotOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
              >
                <Sparkles className={`w-4.5 h-4.5 ${isCopilotOpen ? 'text-white' : ''}`} />
                {isCopilotOpen && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className={`h-9 w-9 rounded-xl ${darkMode ? 'text-amber-400 hover:bg-amber-950/30' : ''} hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-all duration-300`}
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email list */}
          {selectedEmail ? (
            <EmailDetail
              email={selectedEmail}
              onBack={() => setSelectedEmailId(null)}
              onReply={handleReply}
              onForward={handleForward}
            />
          ) : (
            <EmailList
              emails={getCurrentEmails()}
              selectedId={selectedEmailId}
              onSelectEmail={handleSelectEmail}
              pagination={getCurrentPagination()}
              onLoadMore={handleLoadMore}
            />
          )}
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <CopilotSidebar
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      {/* Compose modal */}
      <Compose
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSend={handleSendEmail}
        initialData={composeInitialData}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
