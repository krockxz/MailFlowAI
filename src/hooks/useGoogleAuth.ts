import { useGoogleLogin } from '@react-oauth/google';
import { useAppStore } from '@/store';
import { GmailService } from '@/services/gmail';

export function useGoogleAuth() {
    const { setUser, setAccessToken } = useAppStore();

    const login = useGoogleLogin({
        scope: 'https://www.googleapis.com/auth/gmail.modify',
        onSuccess: async (response) => {
            try {
                const token = response.access_token;

                // Store token in localStorage
                localStorage.setItem('access_token', token);
                localStorage.setItem('token_timestamp', Date.now().toString());

                // Update store
                setAccessToken(token);

                // Fetch user profile
                const gmail = new GmailService(token);
                const profile = await gmail.getUserProfile();
                setUser({ emailAddress: profile.emailAddress });
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
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

        // Clear localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_timestamp');

        // Reload to reset app state
        window.location.reload();
    };

    return { login, logout };
}
