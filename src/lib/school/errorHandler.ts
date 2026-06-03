import { toast } from 'sonner';

export function handleApiError(error: any, defaultMessage = 'An unexpected error occurred') {
  console.error('API Error details:', error);

  let message = defaultMessage;

  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data.message === 'string') {
      message = data.message;
    } else if (Array.isArray(data.message)) {
      message = data.message.join(', ');
    } else if (data.error) {
      message = data.error;
    }
  } else if (error?.message) {
    message = error.message;
  }

  // Sanitize message: Remove raw localhost / URLs, token keywords, sql syntax errors, etc.
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('localhost') || lowerMessage.includes('127.0.0.1') || lowerMessage.includes('http://') || lowerMessage.includes('https://')) {
    message = 'Unable to connect to the server. Please check your network connection and try again.';
  } else if (lowerMessage.includes('jwt') || lowerMessage.includes('token') || lowerMessage.includes('unauthorized') || lowerMessage.includes('jwt expired')) {
    message = 'Session expired. Please log in again.';
  } else if (lowerMessage.includes('query failed') || lowerMessage.includes('database') || lowerMessage.includes('foreign key') || lowerMessage.includes('violates constraint')) {
    message = 'Action failed due to database constraints. Ensure related records are deleted first.';
  }

  toast.error(message);
  return message;
}
