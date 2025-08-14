import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

const handlers = toNextJsHandler(auth.handler);

export const { GET, POST } = handlers;
