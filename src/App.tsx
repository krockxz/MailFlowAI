import { useEffect, useCallback, useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from '@/hooks/useEmails';
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
import { Moon, Sun, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { formatReplyDate, isWithinRange, cn } from '@/lib/utils';
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
  const [isSyncing, setIsSyncing] = useState(false);

  // Send confirmation dialog state
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<EmailConfirmData | null>(null);

  // Track view transition state for smooth animations
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Set up CopilotKit context and actions
  useAppContext();
  const { compose: aiCompose } = useCopilotEmailActions();

  // Memoize compose initial data (must be before any early returns)
  const composeInitialData = useMemo(() => ({
    to: compose.to,
    subject: compose.subject,
    body: compose.body,
    cc: compose.cc,
    bcc: compose.bcc,
    isSending: compose.isSending,
    isAIComposed: compose.isAIComposed,
  }), [compose.to, compose.subject, compose.body, compose.cc, compose.bcc, compose.isSending, compose.isAIComposed]);

  // Set up polling for email sync (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial sync
    fetchInbox();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      if (currentView === 'inbox') {
        fetchInbox();
      } else if (currentView === 'sent') {
        fetchSent();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentView, fetchInbox, fetchSent]);

  // Manual sync function with loading state
  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      if (currentView === 'inbox') {
        await fetchInbox();
      } else if (currentView === 'sent') {
        await fetchSent();
      }
    } finally {
      // Minimum 500ms sync animation for better UX feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSyncing(false);
    }
  }, [currentView, fetchInbox, fetchSent]);

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

  // Handle email select - auto-mark as read with view transition
  const handleSelectEmail = useCallback(async (email: Email) => {
    setIsTransitioning(true);
    setSelectedEmailId(email.id);
    // Auto-mark as read when opening an email
    if (email.isUnread) {
      await markAsRead(email.id, true);
    }
    // Allow transition animation to play
    setTimeout(() => setIsTransitioning(false), 150);
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

  // Handle back from email detail
  const handleBackToList = useCallback(() => {
    setIsTransitioning(true);
    setSelectedEmailId(null);
    setTimeout(() => setIsTransitioning(false), 150);
  }, [setSelectedEmailId]);

  // Get unread count
  const unreadCount = emails.inbox.filter((e: Email) => e.isUnread).length;


  // Show loading state during bootstrap (initial auth check)
  if (isInitializing && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <div className="text-center animate-fade-in-up">
          {/* Premium loading spinner */}
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-accent-500/10 blur-xl animate-pulse" />
            {/* Spinner */}
            <Loader2 className="relative w-12 h-12 text-accent-600 dark:text-accent-400 animate-spin" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 text-base font-medium">
            Loading MailFlowAI...
          </p>
          <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">
            Preparing your workspace
          </p>
        </div>
      </div>
    );
  }

  // Show error state if bootstrap failed
  if (hasError && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 px-4">
        <div className="max-w-md w-full animate-fade-in-scale">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-neutral-200/50 dark:shadow-black border border-neutral-200/60 dark:border-neutral-800/60 p-8">
            {/* Error icon with glow */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-error/20 rounded-full blur-xl" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-error/10 to-error/5 dark:from-error/20 dark:to-error/10 flex items-center justify-center border border-error/20">
                  <svg
                    className="w-8 h-8 text-error"
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
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Initialization Failed
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {bootstrapError?.message || 'Failed to initialize the application. Please try again.'}
              </p>
            </div>

            <button
              onClick={() => {
                retryBootstrap();
                window.location.reload();
              }}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2 px-4 py-3',
                'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900',
                'rounded-xl font-medium shadow-lg shadow-neutral-900/10 dark:shadow-white/10',
                'hover:bg-neutral-800 dark:hover:bg-neutral-100',
                'hover:shadow-xl hover:shadow-neutral-900/20 dark:hover:shadow-white/20',
                'hover:-translate-y-0.5 active:translate-y-0',
                'transition-all duration-200'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
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

      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onCompose={handleCompose}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onRefresh={sync}
          isAuthenticated={isAuthenticated}
        />

        {/* Main content */}
        <main
          id="main-content"
          className={cn(
            "flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out",
            // Dynamic margin when copilot is open
            isCopilotOpen && 'lg:mr-[340px]'
          )}
        >
          {/* Header with premium glass effect and enhanced visual hierarchy */}
          <header className={cn(
            "glass-header-enhanced border-b border-neutral-200/60 dark:border-neutral-800/60 relative z-20",
            "transition-all duration-300 ease-in-out"
          )}>
            <div className="flex items-center px-5 lg:px-6 py-3 gap-3 lg:gap-4">
              {/* View indicator badge */}
              <div className={cn(
                "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold",
                "bg-neutral-100/80 dark:bg-neutral-900/80",
                "border border-neutral-200/60 dark:border-neutral-700/60",
                "text-neutral-700 dark:text-neutral-300",
                "transition-all duration-200"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-300",
                  currentView === 'inbox' ? 'bg-accent-500 shadow-sm shadow-accent-500/40' : 'bg-neutral-400 dark:bg-neutral-600'
                )} />
                <span className="capitalize">{currentView}</span>
              </div>

              {/* Filters with proper spacing */}
              <div className="flex-1 min-w-0 transition-all duration-200 ease-in-out">
                <FilterBar
                  filters={currentFilters}
                  onFiltersChange={useAppStore.getState().setFilters}
                />
              </div>

              {/* Action buttons with premium styling */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Sync button with loading state */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={sync}
                  disabled={isSyncing}
                  aria-label="Sync emails"
                  className={cn(
                    "relative h-9 w-9 rounded-lg",
                    "transition-all duration-200",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                    isSyncing && "text-accent-600 dark:text-accent-400"
                  )}
                >
                  <RefreshCw className={cn(
                    "w-4 h-4 transition-transform duration-500",
                    isSyncing && "animate-spin"
                  )} />
                  {isSyncing && (
                    <div className="absolute inset-0 rounded-lg bg-accent-500/10 animate-pulse" />
                  )}
                </Button>

                {/* Divider */}
                <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-1" />

                {/* AI Assistant toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                  aria-label={isCopilotOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
                  className={cn(
                    "relative h-9 w-9 rounded-lg transition-all duration-200",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                    isCopilotOpen && "bg-accent-50 dark:bg-accent-950/50 text-accent-700 dark:text-accent-400"
                  )}
                >
                  <Sparkles className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isCopilotOpen && "fill-current"
                  )} />
                  {isCopilotOpen && (
                    <div className="absolute inset-0 rounded-lg bg-accent-500/5" />
                  )}
                </Button>

                {/* Theme toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="h-9 w-9 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all duration-200"
                >
                  <div className="relative transition-all duration-300">
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </div>
                </Button>
              </div>
            </div>
          </header>

          {/* Content area with smooth view transitions */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Email list/detail with error boundary and view transitions */}
            <InlineErrorBoundary componentName="EmailDetail">
              <div className={cn(
                "flex-1 w-full transition-all duration-300 ease-in-out",
                // Fade transition when switching views
                isTransitioning && "opacity-95"
              )}>
                {selectedEmail ? (
                  <div className="h-full animate-fade-in-right">
                    <EmailDetail
                      email={selectedEmail}
                      onBack={handleBackToList}
                      onReply={handleReply}
                      onForward={handleForward}
                    />
                  </div>
                ) : (
                  <div className="h-full animate-fade-in">
                    <EmailList
                      emails={getCurrentEmails()}
                      selectedId={selectedEmailId}
                      onSelectEmail={handleSelectEmail}
                      pagination={getCurrentPagination()}
                      onLoadMore={handleLoadMore}
                    />
                  </div>
                )}
              </div>
            </InlineErrorBoundary>
          </div>
        </main>

        {/* AI Assistant Sidebar with smooth transitions */}
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
          initialData={composeInitialData}
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
