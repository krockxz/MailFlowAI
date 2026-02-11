import { useGoogleLogin } from '@react-oauth/google';
import { useAppStore } from '@/store';
import { GmailService } from '@/services/gmail';
import { storeToken, setTimestamp, clearAllTokens } from '@/lib/token-storage';

export function useGoogleAuth() {
    const { setUser, setAccessToken, setEmails } = useAppStore();

    const login = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/gmail.modify',
        flow: 'redirect', // Use redirect instead of popup to avoid COOP issues
        onSuccess: async (response) => {
            try {
                const token = response.access_token;

                // Store token using secure storage abstraction (sessionStorage)
                storeToken('access', token);
                setTimestamp(Date.now());

                // Update store
                setAccessToken(token);

                // Fetch user profile
                const gmail = new GmailService(token);
                const profile = await gmail.getUserProfile();
                setUser({ emailAddress: profile.emailAddress });

                // Fetch initial inbox emails after successful login
                const messagesResponse = await gmail.listMessages(['INBOX'], 50);
                const fullMessages = await gmail.getBatchMessages(
                    messagesResponse.messages.map((m) => m.id)
                );
                const parsedEmails = fullMessages.map((msg) => gmail.parseMessage(msg));
                setEmails('inbox', parsedEmails);
            } catch (error) {
                console.error('Failed to fetch user profile or emails:', error);
            }
        },
        onError: (error) => {
            console.error('Login failed:', error);
        },
    });

    const logout = () => {
        // Clear store
        setUser(null);
        setAccessToken(null);

        // Clear all tokens using secure storage abstraction
        clearAllTokens();

        // Reload to reset app state
        window.location.reload();
    };

    return { login, logout };
}
