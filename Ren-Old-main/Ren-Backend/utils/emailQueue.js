// Simple in-process queue with configurable concurrency
import pLimit from 'p-limit';
import dotenv from 'dotenv';

dotenv.config();

const concurrency = parseInt(process.env.EMAIL_CONCURRENCY || '5', 10);
const limit = pLimit(concurrency);

export const enqueueEmail = (fn) => {
  return limit(() => fn());
};

export default enqueueEmail;
