import { useEffect, useCallback, useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from '@/hooks/useEmails';
import { useRealtimeEmailSync } from '@/hooks/useRealtimeEmailSync';
import { useAppContext, useCopilotEmailActions } from '@/hooks/useCopilotActions';
import { useBootstrapAuthAndInbox } from '@/hooks/useBootstrapAuthAndInbox';
import { useViewSync } from '@/hooks/useViewSync';
import { useFilterPaginationReset } from '@/hooks/useFilterPaginationReset';
import type { Email } from '@/types/email';
import { Sidebar } from '@/components/Sidebar';
import { EmailList } from '@/components/EmailList';
import { EmailDetail } from '@/components/EmailDetail';
import { Compose } from '@/components/Compose';
import { FilterBar } from '@/components/FilterBar';
import { Moon, Sun, RefreshCw, Sparkles } from 'lucide-react';
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
    compose,
    setCompose,
    resetCompose,
    getCurrentFilters,
    isAuthenticated,
    search,
  } = useAppStore();

  const {
    fetchInbox,
    fetchSent,
    sendEmail,
    markAsRead,
    isLoading,
    pagination,
    loadMore,
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

  // Bootstrap auth and initial inbox fetch (extracted hook)
  const { isInitializing, hasError, error: bootstrapError, retry: retryBootstrap } = useBootstrapAuthAndInbox();

  // Sync email data when view changes (extracted hook)
  useViewSync();

  // Reset pagination when filters change (extracted hook)
  useFilterPaginationReset();

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

  // Get the current view's filters
  const currentFilters = getCurrentFilters();

  // Get current email list based on view with filters applied
  const getCurrentEmails = useCallback(() => {
    // If in search mode, return cached search results
    if (search.isSearchMode) {
      return search.results;
    }

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

  // Show loading state during bootstrap (initial auth check)
  if (isInitializing && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if bootstrap failed
  if (hasError && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              Initialization Failed
            </h1>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {bootstrapError?.message || 'Failed to initialize the application. Please try again.'}
          </p>
          <button
            onClick={() => {
              retryBootstrap();
              window.location.reload();
            }}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
        initialData={useMemo(() => ({
          to: compose.to,
          subject: compose.subject,
          body: compose.body,
          cc: compose.cc,
          bcc: compose.bcc,
          isSending: compose.isSending,
          isAIComposed: compose.isAIComposed,
        }), [compose.to, compose.subject, compose.body, compose.cc, compose.bcc, compose.isSending, compose.isAIComposed])}
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
