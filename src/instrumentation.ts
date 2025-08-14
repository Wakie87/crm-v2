// Instrumentation file for application monitoring
// Removed Sentry integration - can be used for other monitoring tools if needed

export async function register() {
  // Application instrumentation can be added here if needed
  console.log('Application instrumentation initialized');
}

export const onRequestError = (error: Error) => {
  // Basic error logging - replace with your preferred error tracking
  console.error('Request error:', error);
};
