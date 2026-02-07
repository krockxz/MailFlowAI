import { useEffect, useCallback, useState } from 'react';
import { useAppStore } from '@/store';
import { useEmails } from '@/hooks/useEmails';
import { useAppContext, useCopilotEmailActions } from '@/hooks/useCopilotActions';
import { Sidebar } from '@/components/Sidebar';
import { EmailList } from '@/components/EmailList';
import { EmailDetail } from '@/components/EmailDetail';
import { Compose } from '@/components/Compose';
import { FilterBar } from '@/components/FilterBar';
import { CopilotSidebar } from '@/components/CopilotSidebar';
import { MessageSquare } from 'lucide-react';
import { getStoredAccessToken, isAuthenticated } from '@/services/auth';

function App() {
  const {
    currentView,
    selectedEmailId,
    emails,
    filters,
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
          // Set a dummy user for now (will be fetched properly)
          setUser({ emailAddress: 'user@example.com' });
          // Fetch emails
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

      if (currentView === 'inbox') {
        await fetchInbox();
      } else if (currentView === 'sent') {
        await fetchSent();
      }
    };
    fetchForView();
  }, [currentView, fetchInbox, fetchSent]);

  // Get current email list based on view
  const getCurrentEmails = useCallback(() => {
    if (currentView === 'inbox') return emails.inbox;
    if (currentView === 'sent') return emails.sent;
    return [];
  }, [currentView, emails]);

  // Get selected email
  const selectedEmail = getCurrentEmails().find(e => e.id === selectedEmailId) || null;

  // Handle email select
  const handleSelectEmail = useCallback((email: any) => {
    setSelectedEmailId(email.id);
  }, [setSelectedEmailId]);

  // Handle compose
  const handleCompose = useCallback(() => {
    setComposeInitialData({});
    setIsComposeOpen(true);
  }, []);

  // Handle reply
  const handleReply = useCallback((emailId: string) => {
    const email = [...emails.inbox, ...emails.sent].find(e => e.id === emailId);
    if (email) {
      setComposeInitialData({
        to: email.from.email,
        subject: email.subject.startsWith('Re:')
          ? email.subject
          : `Re: ${email.subject}`,
        body: `\n\n----------\nOn ${email.date.toLocaleString()}, ${email.from.name || email.from.email} wrote:\n${email.body.slice(0, 200)}...`,
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
    const email = [...emails.inbox, ...emails.sent].find(e => e.id === emailId);
    if (email) {
      setComposeInitialData({
        subject: `Fwd: ${email.subject}`,
        body: `\n\n----------\nForwarded message:\nFrom: ${email.from.name || email.from.email}\nSubject: ${email.subject}\n\n${email.body}`,
      });
      setIsComposeOpen(true);
    }
  }, [emails]);

  // Get unread count
  const unreadCount = emails.inbox.filter(e => e.isUnread).length;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onCompose={handleCompose}
        unreadCount={unreadCount}
        isLoading={isLoading}
        onRefresh={currentView === 'inbox' ? fetchInbox : fetchSent}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {/* Header with filters and AI toggle */}
        <div className="flex items-center border-b border-gray-200">
          <div className="flex-1">
            <FilterBar
              filters={filters}
              onFiltersChange={useAppStore.getState().setFilters}
            />
          </div>
          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            className={cn(
              'm-2 p-2 rounded-lg transition-colors flex items-center gap-2',
              isCopilotOpen
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        </div>

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

// Import cn utility
import { cn } from '@/lib/utils';

export default App;
