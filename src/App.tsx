import { useEffect, useCallback, useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from '@/hooks/useEmails';
import { useBootstrapAuthAndInbox } from '@/hooks/useBootstrapAuthAndInbox';
import { useViewSync } from '@/hooks/useViewSync';
import { useFilterPaginationReset } from '@/hooks/useFilterPaginationReset';
import { useEmailHandlers } from '@/hooks/useEmailHandlers';
import type { Email } from '@/types/email';
import { Sidebar } from '@/components/Sidebar';
import { EmailList } from '@/components/EmailList';
import { EmailDetail } from '@/components/EmailDetail';
import { Compose } from '@/components/Compose';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { AppHeader } from '@/components/AppHeader';
import { ThemeProvider } from '@/components/theme-provider';
import { SendConfirmDialog, type EmailConfirmData } from '@/components/SendConfirmDialog';
import { CopilotSidebar } from '@/components/CopilotSidebar';
import { InlineErrorBoundary } from '@/components/ErrorBoundary';
import { isWithinRange, cn } from '@/lib/utils';

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
    getCurrentFilters,
    isAuthenticated,
    search,
  } = useAppStore();

  const {
    fetchInbox,
    fetchSent,
    sendEmail,
    isLoading,
    pagination,
    loadMore,
  } = useEmails();

  const {
    handleSelectEmail,
    handleCompose,
    handleReply,
    handleForward,
    handleSendEmail,
    handleCloseCompose,
  } = useEmailHandlers();

  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<EmailConfirmData | null>(null);

  const [isTransitioning, setIsTransitioning] = useState(false);

  const composeInitialData = useMemo(() => ({
    to: compose.to,
    subject: compose.subject,
    body: compose.body,
    cc: compose.cc,
    bcc: compose.bcc,
    isSending: compose.isSending,
    isAIComposed: compose.isAIComposed,
  }), [compose.to, compose.subject, compose.body, compose.cc, compose.bcc, compose.isSending, compose.isAIComposed]);

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchInbox();

    const interval = setInterval(() => {
      if (currentView === 'inbox') {
        fetchInbox();
      } else if (currentView === 'sent') {
        fetchSent();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, currentView, fetchInbox, fetchSent]);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      if (currentView === 'inbox') {
        await fetchInbox();
      } else if (currentView === 'sent') {
        await fetchSent();
      }
    } finally {
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsSyncing(false);
    }
  }, [currentView, fetchInbox, fetchSent]);

  const { isInitializing, hasError, error: bootstrapError, retry: retryBootstrap } = useBootstrapAuthAndInbox();

  useViewSync();

  useFilterPaginationReset();

  useEffect(() => {
    if (compose.isSending && compose.to && !showSendConfirm) {
      setPendingEmail({
        to: compose.to,
        subject: compose.subject,
        body: compose.body,
        cc: compose.cc,
        bcc: compose.bcc,
      });
      setShowSendConfirm(true);

      setCompose({ ...compose, isSending: false });
    }
  }, [compose.isSending, compose.to, compose.subject, compose.body, compose.cc, compose.bcc, showSendConfirm, setCompose]);

  const currentFilters = getCurrentFilters();

  const currentEmailList = useMemo(() => {
    if (search.isSearchMode) {
      return search.results;
    }

    const emailList = currentView === 'inbox' ? emails.inbox :
      currentView === 'sent' ? emails.sent : [];

    if (!currentFilters || Object.keys(currentFilters).length === 0) {
      return emailList;
    }

    return emailList.filter((email: Email) => {
      if (currentFilters.query) {
        const query = currentFilters.query.toLowerCase();
        const subjectMatch = email.subject?.toLowerCase().includes(query) ?? false;
        const bodyMatch = email.body?.toLowerCase().includes(query) ?? false;
        const fromMatch = email.from.email?.toLowerCase().includes(query) ?? false;
        const fromNameMatch = email.from.name?.toLowerCase().includes(query) ?? false;
        if (!subjectMatch && !bodyMatch && !fromMatch && !fromNameMatch) {
          return false;
        }
      }

      if (currentFilters.sender) {
        const sender = currentFilters.sender.toLowerCase();
        const matchesEmail = email.from.email?.toLowerCase().includes(sender) ?? false;
        const matchesName = email.from.name?.toLowerCase().includes(sender) ?? false;
        if (!matchesEmail && !matchesName) {
          return false;
        }
      }

      if (currentFilters.isUnread !== undefined && email.isUnread !== currentFilters.isUnread) {
        return false;
      }

      if (currentFilters.dateFrom || currentFilters.dateTo) {
        if (!isWithinRange(email.date, currentFilters.dateFrom, currentFilters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [currentView, emails, currentFilters, search.isSearchMode, search.results]);

  const getCurrentPagination = useCallback(() => {
    if (currentView === 'inbox') return pagination.inbox;
    if (currentView === 'sent') return pagination.sent;
    return undefined;
  }, [currentView, pagination]);

  const handleLoadMore = useCallback(() => {
    if (currentView === 'inbox') {
      loadMore('inbox');
    } else if (currentView === 'sent') {
      loadMore('sent');
    }
  }, [currentView, loadMore]);

  const selectedEmail = currentEmailList.find((e: Email) => e.id === selectedEmailId) || null;

  const handleConfirmSend = useCallback(async () => {
    if (!pendingEmail) return;

    try {
      setCompose({ ...compose, isSending: true });

      await sendEmail({
        to: [pendingEmail.to],
        subject: pendingEmail.subject,
        body: pendingEmail.body,
        cc: pendingEmail.cc ? [pendingEmail.cc] : undefined,
        bcc: pendingEmail.bcc ? [pendingEmail.bcc] : undefined,
      });

      const { showSendSuccess } = await import('@/lib/toast');
      showSendSuccess(pendingEmail.to);

      setShowSendConfirm(false);
      useAppStore.getState().resetCompose();
      setPendingEmail(null);
    } catch (error) {
      setCompose({ ...compose, isSending: false });
    }
  }, [pendingEmail, compose, sendEmail, setCompose]);

  const handleCancelSend = useCallback(() => {
    setShowSendConfirm(false);
    setPendingEmail(null);
    setCompose({ ...compose, isSending: false });
  }, [showSendConfirm, pendingEmail, compose, setCompose]);

  const handleBackToList = useCallback(() => {
    setIsTransitioning(true);
    setSelectedEmailId(null);
    setTimeout(() => setIsTransitioning(false), 150);
  }, [setSelectedEmailId]);

  const unreadCount = emails.inbox.filter((e: Email) => e.isUnread).length;

  if (isInitializing && !isAuthenticated) {
    return <LoadingScreen />;
  }

  if (hasError && !isAuthenticated) {
    return (
      <ErrorScreen
        error={bootstrapError?.message}
        onRetry={retryBootstrap}
      />
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-to-main">
        Skip to main content
      </a>

      <div className="flex h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onCompose={handleCompose}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onRefresh={sync}
          isAuthenticated={isAuthenticated}
        />

        <main
          id="main-content"
          className={cn(
            "flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out",
            isCopilotOpen && 'lg:mr-[340px]'
          )}
        >
          <AppHeader
            currentView={currentView}
            isCopilotOpen={isCopilotOpen}
            isSyncing={isSyncing}
            darkMode={darkMode}
            onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
            onToggleDarkMode={toggleDarkMode}
            onSync={sync}
            filters={currentFilters}
            onFiltersChange={useAppStore.getState().setFilters}
          />

          <div className="flex-1 flex overflow-hidden relative">
            <InlineErrorBoundary componentName="EmailDetail">
              <div className={cn(
                "flex-1 w-full transition-all duration-300 ease-in-out",
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
                      emails={currentEmailList}
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

        <InlineErrorBoundary componentName="CopilotSidebar">
          <CopilotSidebar
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
          />
        </InlineErrorBoundary>

        <Compose
          isOpen={compose.isOpen}
          onClose={handleCloseCompose}
          onSend={handleSendEmail}
          initialData={composeInitialData}
        />

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
