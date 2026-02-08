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
import { formatReplyDate } from '@/lib/utils';

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
      });
      setIsComposeOpen(true);
    }
  }, [composeData.to, composeData.subject, composeData.body, composeData.isOpen]);

  // Check auth on mount
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

          await fetchInbox();
        }
      }
    };
    checkAuth();
  }, [fetchInbox, setAccessToken, setUser]);

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

  // Get current email list based on view
  const getCurrentEmails = useCallback(() => {
    if (currentView === 'inbox') return emails.inbox;
    if (currentView === 'sent') return emails.sent;
    return [];
  }, [currentView, emails]);

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
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
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
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-zinc-900">
        {/* Header with filters and actions */}
        <header className="glass-elevated border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 transition-smooth">
          <div className="flex items-center">
            {/* Logo/Brand */}
            <div className="px-6 py-4 border-r border-zinc-200 dark:border-zinc-800">
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
                <span className="text-blue-500">AI</span> Mail
              </h1>
            </div>

            {/* Filters */}
            <div className="flex-1">
              <FilterBar
                filters={filters}
                onFiltersChange={useAppStore.getState().setFilters}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 pr-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={sync}
                className="relative group"
                title="Sync emails"
              >
                <RefreshCw className="w-4.5 h-4.5" />
                <span className="absolute inset-0 rounded-xl ring-2 ring-blue-500/0 group-hover:ring-blue-500/20 transition-smooth" />
              </Button>

              <Button
                variant={isCopilotOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                className="relative"
                title="Toggle AI Assistant"
              >
                <Sparkles className="w-4.5 h-4.5" />
                {isCopilotOpen && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className={darkMode ? "text-amber-400 hover:text-amber-300" : ""}
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
