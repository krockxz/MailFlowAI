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
import { Moon, Sun, RefreshCw, Sparkles } from 'lucide-react';
import { getStoredAccessToken, isAuthenticated as checkIsAuthenticated, setTokenTimestamp } from '@/services/auth';
import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { formatReplyDate, isWithinRange } from '@/lib/utils';
import { SendConfirmDialog, type EmailConfirmData } from '@/components/SendConfirmDialog';
import { CopilotSidebar } from '@/components/CopilotSidebar';
import { InlineErrorBoundary } from '@/components/ErrorBoundary';

function AppContent() {
  const {
    currentView,
    selectedEmailId,
    emails,
    darkMode,
    toggleDarkMode,
    setCurrentView,
    setSelectedEmailId,
    setAccessToken,
    setUser,
    compose,
    setCompose,
    resetCompose,
    getCurrentFilters,
    isAuthenticated,
  } = useAppStore();

  const {
    fetchInbox,
    fetchSent,
    sendEmail,
    markAsRead,
    isLoading,
    pagination,
    loadMore,
    resetAllPagination,
  } = useEmails();

  const [isCopilotOpen, setIsCopilotOpen] = useState(true);

  // Send confirmation dialog state
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<EmailConfirmData | null>(null);

  // Set up CopilotKit context and actions
  useAppContext();
  const { compose: aiCompose } = useCopilotEmailActions();

  // Set up real-time sync (polling every 30 seconds)
  const { sync } = useRealtimeEmailSync({
    pollingInterval: 30000,
    enabled: isAuthenticated || undefined,
  });

  // Sync compose state: use store directly (single source of truth)
  // When AI triggers send, show confirmation dialog
  useEffect(() => {
    // AI wants to send - show confirmation
    if (aiCompose.isSending && aiCompose.to && !showSendConfirm) {
      setPendingEmail({
        to: aiCompose.to,
        subject: aiCompose.subject,
        body: aiCompose.body,
        cc: aiCompose.cc,
        bcc: aiCompose.bcc,
      });
      setShowSendConfirm(true);

      // Reset isSending flag in store so dialog handles it
      setCompose({ ...aiCompose, isSending: false });
    }
  }, [compose.isOpen, aiCompose.isSending, aiCompose.to, aiCompose.subject, aiCompose.body, aiCompose.cc, aiCompose.bcc, showSendConfirm, setCompose]);

  // Check auth on mount and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredAccessToken();
      const hasValidToken = checkIsAuthenticated();

      // If persisted state says authenticated but no token exists, clear the state
      const store = useAppStore.getState();
      if (store.isAuthenticated && !hasValidToken) {
        store.setIsAuthenticated(false);
        store.setUser(null);
        store.setAccessToken(null);
        return;
      }

      // If token exists, verify and fetch user data
      if (hasValidToken && token) {
        setAccessToken(token);

        // Mark token as fresh (prevents immediate expiration)
        setTokenTimestamp();

        // Fetch user profile if not already loaded
        if (!store.user) {
          try {
            const { GmailService } = await import('@/services/gmail');
            const gmail = new GmailService(token);
            const profile = await gmail.getUserProfile();
            setUser({ emailAddress: profile.emailAddress });
            store.setIsAuthenticated(true);
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // Token might be expired, clear auth state
            store.setIsAuthenticated(false);
            store.setAccessToken(null);
            return;
          }
        } else {
          // User already persisted, just ensure auth state is correct
          store.setIsAuthenticated(true);
        }

        // Only fetch inbox if it's empty (avoid duplicate fetches)
        if (emails.inbox.length === 0) {
          await fetchInbox();
        }
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

  // Refresh emails when view changes
  useEffect(() => {
    const fetchForView = async () => {
      if (!checkIsAuthenticated()) return;

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

  // Get the current view's filters
  const currentFilters = getCurrentFilters();

  // Reset pagination when filters change
  useEffect(() => {
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      resetAllPagination();
    }
  }, [currentFilters, resetAllPagination]);

  // Get current email list based on view with filters applied
  const getCurrentEmails = useCallback(() => {
    const emailList = currentView === 'inbox' ? emails.inbox :
                      currentView === 'sent' ? emails.sent : [];

    // Apply filters if any are set
    if (!currentFilters || Object.keys(currentFilters).length === 0) {
      return emailList;
    }

    return emailList.filter((email: Email) => {
      // Filter by query (searches subject and body)
      if (currentFilters.query) {
        const query = currentFilters.query.toLowerCase();
        const subjectMatch = email.subject.toLowerCase().includes(query);
        const bodyMatch = email.body.toLowerCase().includes(query);
        const fromMatch = email.from.email.toLowerCase().includes(query) ||
                         (email.from.name && email.from.name.toLowerCase().includes(query));
        if (!subjectMatch && !bodyMatch && !fromMatch) {
          return false;
        }
      }

      // Filter by sender
      if (currentFilters.sender) {
        const sender = currentFilters.sender.toLowerCase();
        const matchesEmail = email.from.email.toLowerCase().includes(sender);
        const matchesName = email.from.name && email.from.name.toLowerCase().includes(sender);
        if (!matchesEmail && !matchesName) {
          return false;
        }
      }

      // Filter by unread status
      if (currentFilters.isUnread !== undefined && email.isUnread !== currentFilters.isUnread) {
        return false;
      }

      // Filter by date range
      if (currentFilters.dateFrom || currentFilters.dateTo) {
        if (!isWithinRange(email.date, currentFilters.dateFrom, currentFilters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [currentView, emails, currentFilters]);

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

  // Handle email select - auto-mark as read
  const handleSelectEmail = useCallback(async (email: Email) => {
    setSelectedEmailId(email.id);
    // Auto-mark as read when opening an email
    if (email.isUnread) {
      await markAsRead(email.id, true);
    }
  }, [setSelectedEmailId, markAsRead]);

  // Handle compose (manual - from sidebar button)
  const handleCompose = useCallback(() => {
    // Reset compose for manual compose (not AI composed)
    setCompose({
      isOpen: true,
      to: '',
      subject: '',
      body: '',
      cc: '',
      isSending: false,
      isAIComposed: false,
    });
  }, [setCompose]);

  // Handle reply (from EmailDetail)
  const handleReply = useCallback((emailId: string) => {
    const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);
    if (email) {
      setCompose({
        isOpen: true,
        to: email.from.email,
        subject: email.subject.startsWith('Re:')
          ? email.subject
          : `Re: ${email.subject}`,
        body: `\n\n----------\nOn ${formatReplyDate(email.date)}, ${email.from.name || email.from.email} wrote:\n${email.body.slice(0, 200)}...`,
        cc: '',
        isSending: false,
        isAIComposed: false,
      });
    }
  }, [emails, setCompose]);

  // Handle send email (from Compose or confirmation dialog)
  const handleSendEmail = useCallback(async (data: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }) => {
    await sendEmail({
      to: [data.to],
      subject: data.subject,
      body: data.body,
      cc: data.cc ? [data.cc] : undefined,
    });
  }, [sendEmail]);

  // Handle confirm send from dialog
  const handleConfirmSend = useCallback(async () => {
    if (!pendingEmail) return;

    try {
      // Show sending state
      setCompose({ ...compose, isSending: true });

      await sendEmail({
        to: [pendingEmail.to],
        subject: pendingEmail.subject,
        body: pendingEmail.body,
        cc: pendingEmail.cc ? [pendingEmail.cc] : undefined,
        bcc: pendingEmail.bcc ? [pendingEmail.bcc] : undefined,
      });

      // Show success toast
      const { showSendSuccess } = await import('@/lib/toast');
      showSendSuccess(pendingEmail.to);

      // Success: close dialog and reset compose
      setShowSendConfirm(false);
      resetCompose();
      setPendingEmail(null);
    } catch (error) {
      // Error: keep dialog open for retry, reset sending flag
      setCompose({ ...compose, isSending: false });
    }
  }, [pendingEmail, compose, sendEmail, resetCompose, setCompose]);

  // Handle cancel send
  const handleCancelSend = useCallback(() => {
    setShowSendConfirm(false);
    setPendingEmail(null);
    setCompose({ ...compose, isSending: false });
  }, [showSendConfirm, pendingEmail, compose, setCompose]);

  // Handle forward
  const handleForward = useCallback((emailId: string) => {
    const email = [...emails.inbox, ...emails.sent].find((e: Email) => e.id === emailId);
    if (email) {
      setCompose({
        isOpen: true,
        subject: `Fwd: ${email.subject}`,
        body: `\n\n----------\nForwarded message:\nFrom: ${email.from.name || email.from.email}\nSubject: ${email.subject}\n\n${email.body}`,
        to: '',
        cc: '',
        isSending: false,
        isAIComposed: false,
      });
    }
  }, [emails, setCompose]);

  // Handle close compose
  const handleCloseCompose = useCallback(() => {
    setCompose({ ...compose, isOpen: false });
  }, [compose, setCompose]);

  // Get unread count
  const unreadCount = emails.inbox.filter((e: Email) => e.isUnread).length;

  return (
    <>
      {/* Skip to main content (accessibility) */}
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onCompose={handleCompose}
        unreadCount={unreadCount}
        isLoading={isLoading}
        onRefresh={currentView === 'inbox' ? fetchInbox : fetchSent}
        isAuthenticated={isAuthenticated}
      />

      {/* Main content */}
      <div id="main-content" className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header with filters and actions */}
        <header className="glass-header border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center px-5 py-3">
            {/* Filters */}
            <div className="flex-1">
              <FilterBar
                filters={currentFilters}
                onFiltersChange={useAppStore.getState().setFilters}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 pr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={sync}
                aria-label="Sync emails"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                aria-label={isCopilotOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
                className={isCopilotOpen ? 'bg-neutral-200 dark:bg-neutral-800' : ''}
              >
                <Sparkles className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email list/detail with error boundary */}
          <InlineErrorBoundary componentName="EmailDetail">
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
          </InlineErrorBoundary>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <InlineErrorBoundary componentName="CopilotSidebar">
        <CopilotSidebar
          isOpen={isCopilotOpen}
          onClose={() => setIsCopilotOpen(false)}
        />
      </InlineErrorBoundary>

      {/* Compose modal - uses store state */}
      <Compose
        isOpen={compose.isOpen}
        onClose={handleCloseCompose}
        onSend={handleSendEmail}
        initialData={{
          to: compose.to,
          subject: compose.subject,
          body: compose.body,
          cc: compose.cc,
          bcc: compose.bcc,
          isSending: compose.isSending,
          isAIComposed: compose.isAIComposed,
        }}
      />

      {/* Send Confirmation Dialog */}
      <SendConfirmDialog
        isOpen={showSendConfirm}
        emailData={pendingEmail || { to: '', subject: '', body: '' }}
        onConfirm={handleConfirmSend}
        onCancel={handleCancelSend}
        isSending={compose.isSending}
      />
    </div>
    </>
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
