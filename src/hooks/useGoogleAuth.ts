import { useGoogleLogin } from '@react-oauth/google';
import { useAppStore } from '@/store';
import { GmailService } from '@/services/gmail';
import { storeToken, setTimestamp, clearAllTokens } from '@/lib/token-storage';

export function useGoogleAuth() {
    const { setUser, setAccessToken, setEmails } = useAppStore();

    const login = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/gmail.modify',
        // No 'flow' parameter = uses implicit flow (popup) by default
        onSuccess: async (tokenResponse) => {
            try {
                const token = tokenResponse.access_token;

                // Store token
                storeToken('access', token);
                setTimestamp(Date.now());
                setAccessToken(token);

                // Fetch user profile
                const gmail = new GmailService(token);
                const profile = await gmail.getUserProfile();
                setUser({ emailAddress: profile.emailAddress });

                // Fetch initial inbox emails
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
        setUser(null);
        setAccessToken(null);
        clearAllTokens();
        window.location.reload();
    };

    return { login, logout };
}
