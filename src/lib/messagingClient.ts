/** Local no-op replacement for firebase/messaging in demo mode. */
export async function getToken(_messaging?: any, _options?: any): Promise<string | null> {
  return null;
}

export function onMessage(_messaging?: any, _callback?: any): () => void {
  return () => {};
}

export function isSupported(): Promise<boolean> {
  return Promise.resolve(false);
}
