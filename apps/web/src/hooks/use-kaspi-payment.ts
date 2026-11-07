'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ApiClient } from '../lib/api-client';
import type { KaspiPaymentMode, KaspiInvoiceState } from '../types/checkout';
import { formatCountdown, truncateKaspiDescription } from '../lib/kaspi-helpers';

interface UseKaspiPaymentOptions {
  onSuccess?: (orderId: string) => void;
  onFailure?: (error: string) => void;
}

export function useKaspiPayment(options?: UseKaspiPaymentOptions) {
  const [invoice, setInvoice] = useState<KaspiInvoiceState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSubmittingRef = useRef<boolean>(false);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);


  // Stop polling helper
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // Poll order status every 2.5s
  const startPolling = useCallback(
    (orderId: string) => {
      stopPolling();
      pollTimerRef.current = setInterval(async () => {
        try {
          const order = await ApiClient.getOrder(orderId);
          if (order.status === 'paid' || order.paymentStatus === 'paid') {
            stopPolling();
            setIsSuccess(true);
            setInvoice((prev: KaspiInvoiceState | null) => (prev ? { ...prev, status: 'paid' } : null));
            options?.onSuccess?.(orderId);
          } else if (order.status === 'cancelled' || order.status === 'failed') {
            stopPolling();
            setInvoice((prev: KaspiInvoiceState | null) => (prev ? { ...prev, status: 'failed' } : null));
            setError('Платеж был отклонен или отменен');
            options?.onFailure?.('Payment cancelled');
          }
        } catch (err) {
          // Resilient polling: temporary network drops are ignored and retried (B23.1)
          console.warn('Temporary error polling order status:', err);
        }
      }, 2500);
    },
    [stopPolling, options]
  );

  // Start countdown timer
  const startCountdown = useCallback(
    (durationSeconds: number) => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      setInvoice((prev: KaspiInvoiceState | null) =>
        prev
          ? {
              ...prev,
              remainingSeconds: durationSeconds,
              isExpired: false,
            }
          : null
      );

      countdownTimerRef.current = setInterval(() => {
        setInvoice((prev: KaspiInvoiceState | null) => {
          if (!prev) return null;
          if (prev.remainingSeconds <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            stopPolling();
            return {
              ...prev,
              remainingSeconds: 0,
              isExpired: true,
              status: 'expired',
            };
          }
          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1,
          };
        });
      }, 1000);
    },
    [stopPolling]
  );

  // Create Invoice and open Modal
  const initiatePayment = useCallback(
    async (params: {
      orderId: string;
      amountKzt: number;
      paymentMode: KaspiPaymentMode;
      phone?: string;
      description: string;
    }) => {
      // Double click protection / Debounce guard (B22.5)
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;

      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const invData = await ApiClient.createKaspiInvoice({
          orderId: params.orderId,
          amountKzt: params.amountKzt,
          phone: params.phone,
          paymentMode: params.paymentMode,
          description: truncateKaspiDescription(params.description),
        });

        const isPush = params.paymentMode !== 'QR';
        const durationSeconds = isPush ? 15 * 60 : 5 * 60;

        const state: KaspiInvoiceState = {
          paymentId: invData.paymentId,
          orderId: invData.orderId,
          providerInvoiceId: invData.providerInvoiceId,
          status: invData.status,
          paymentMode: params.paymentMode,
          amountKzt: params.amountKzt,
          phone: params.phone,
          qrTokenUrl: invData.qrTokenUrl,
          qrImageUrl: invData.qrImageUrl,
          paymentUrl: invData.paymentUrl,
          expiresAt: invData.expiresAt,
          remainingSeconds: durationSeconds,
          isExpired: false,
        };

        setInvoice(state);
        startCountdown(durationSeconds);
        startPolling(params.orderId);
      } catch (err: any) {
        setError(err?.message || 'Не удалось создать счет Kaspi Pay');
        options?.onFailure?.(err?.message || 'Invoice failed');
      } finally {
        setIsLoading(false);
        isSubmittingRef.current = false;
      }
    },
    [startCountdown, startPolling, options]
  );

  // Reset modal state
  const resetPayment = useCallback(() => {
    stopPolling();
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setInvoice(null);
    setError(null);
    setIsSuccess(false);
    setIsLoading(false);
    isSubmittingRef.current = false;
  }, [stopPolling]);

  return {
    invoice,
    isLoading,
    error,
    isSuccess,
    initiatePayment,
    resetPayment,
    formatCountdown,
  };
}
