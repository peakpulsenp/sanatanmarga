/**
 * SANATANMARGA 5.0 — Canonical Global Connectivity & Runtime State Owner
 * 
 * Centralizes browser online/offline/visibility listeners so individual
 * components and hooks do not mount duplicate global event listeners.
 */

import { useState, useEffect } from 'react';

type ConnectivityListener = (isOnline: boolean) => void;

class ConnectivityManager {
  private isOnline: boolean;
  private listeners = new Set<ConnectivityListener>();
  private isInitialized = false;

  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.addEventListener('online', this.handleOnline, { passive: true });
    window.addEventListener('offline', this.handleOffline, { passive: true });
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.notify();
    try {
      window.dispatchEvent(new CustomEvent('connectivity-status-changed', { detail: { isOnline: true } }));
    } catch (e) {}
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
    try {
      window.dispatchEvent(new CustomEvent('connectivity-status-changed', { detail: { isOnline: false } }));
    } catch (e) {}
  };

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isOnline);
      } catch (err) {
        console.warn('[ConnectivityManager] Listener notification error:', err);
      }
    });
  }

  public getIsOnline(): boolean {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return this.isOnline;
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSubscriberCount(): number {
    return this.listeners.size;
  }
}

export const connectivityManager = new ConnectivityManager();
export const connectivityBus = connectivityManager;

/**
 * React hook to consume canonical connectivity state without attaching separate window listeners.
 */
export function useConnectivity(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => connectivityManager.getIsOnline());

  useEffect(() => {
    setIsOnline(connectivityManager.getIsOnline());
    return connectivityManager.subscribe((status) => {
      setIsOnline(status);
    });
  }, []);

  return isOnline;
}
