export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export enum FirestoreErrorCode {
  PERMISSION_DENIED = 'permission-denied',
  UNAUTHENTICATED = 'unauthenticated',
  RESOURCE_EXHAUSTED = 'resource-exhausted',
  UNAVAILABLE = 'unavailable',
  UNKNOWN = 'unknown'
}

export function classifyFirestoreError(error: unknown): FirestoreErrorCode {
  if (!error) return FirestoreErrorCode.UNKNOWN;
  
  const err = error as any;
  const code = (err.code || err.status || '').toString().toLowerCase();
  const message = (err.message || (typeof error === 'string' ? error : '')).toString().toLowerCase();

  if (code.includes('permission-denied') || message.includes('permission-denied') || message.includes('insufficient permissions')) {
    return FirestoreErrorCode.PERMISSION_DENIED;
  }

  if (code.includes('unauthenticated') || message.includes('unauthenticated') || message.includes('unauthorized')) {
    return FirestoreErrorCode.UNAUTHENTICATED;
  }

  if (code.includes('resource-exhausted') || message.includes('resource-exhausted') || message.includes('quota exceeded')) {
    return FirestoreErrorCode.RESOURCE_EXHAUSTED;
  }

  if (code.includes('unavailable') || message.includes('unavailable') || message.includes('offline') || message.includes('network')) {
    return FirestoreErrorCode.UNAVAILABLE;
  }

  return FirestoreErrorCode.UNKNOWN;
}

interface FirestoreErrorInfo {
  error: string;
  code: FirestoreErrorCode;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorCode = classifyFirestoreError(error);

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    code: errorCode,
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  if (typeof window !== 'undefined') {
    switch (errorCode) {
      case FirestoreErrorCode.RESOURCE_EXHAUSTED:
        window.dispatchEvent(new CustomEvent('firestore-quota-exceeded', { detail: errInfo }));
        break;
      case FirestoreErrorCode.PERMISSION_DENIED:
        window.dispatchEvent(new CustomEvent('firestore-permission-denied', { detail: errInfo }));
        break;
      case FirestoreErrorCode.UNAUTHENTICATED:
        window.dispatchEvent(new CustomEvent('firestore-unauthenticated', { detail: errInfo }));
        break;
      case FirestoreErrorCode.UNAVAILABLE:
        window.dispatchEvent(new CustomEvent('firestore-unavailable', { detail: errInfo }));
        break;
    }
  }
}
