import 'server-only';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'bj_device_id';
const UUID_RE = /^[0-9a-f-]{36}$/i;

export async function getDeviceId(): Promise<string> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (!value || !UUID_RE.test(value)) {
    throw new Error(
      'Missing or invalid bj_device_id cookie — proxy.ts should have set it. ' +
        'Confirm proxy.ts is at the project root and the matcher covers this route.',
    );
  }
  return value;
}
