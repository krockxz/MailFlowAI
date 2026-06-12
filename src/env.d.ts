declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_GMAIL_CLIENT_ID: string;
    NEXT_PUBLIC_GMAIL_CLIENT_SECRET: string;
    NEXT_PUBLIC_GMAIL_REDIRECT_URI: string;
    GROQ_API_KEY: string;
}

declare module '*.css' {
  const content: string;
  export default content;
}
}
