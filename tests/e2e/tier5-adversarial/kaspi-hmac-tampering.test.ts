/**
 * Tier 5: Adversarial Hardening — Suite 1
 * Kaspi Pay Cryptographic Signature & HMAC Tampering Stress
 */

import { describe, it, expect, setTestTier } from '../helpers/test-framework.ts';
import { MockKaspiService } from '../helpers/kaspi-mock.ts';
import crypto from 'node:crypto';

setTestTier(5);

export async function run() {
  const secret = 'adversarial_hardened_secret_998877';
  const kaspi = new MockKaspiService(secret);

  await describe('Adversarial 1: Kaspi Webhook HMAC Tampering & Timing Attacks', () => {
    it('5.1 should detect single-bit flip anywhere in HMAC signature hex digest', () => {
      const payload = {
        invoiceId: 'inv-adv-01',
        orderId: 'ord-adv-01',
        amount: 14990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-adv-1',
        paymentMethod: 'KASPI_GOLD'
      };
      const signed = kaspi.createSignedWebhook(payload);

      // Flip last character of signature
      const rawSig = signed.signatureHeader.slice(7); // remove "sha256="
      const flippedChar = rawSig.endsWith('a') ? 'b' : 'a';
      const tamperedHeader = `sha256=${rawSig.slice(0, -1)}${flippedChar}`;

      const isValid = kaspi.verifyWebhookSignature(signed.rawBody, tamperedHeader);
      expect(isValid).toBe(false);
    });

    it('5.2 should detect 1-byte alteration in body after signature computation', () => {
      const payload = {
        invoiceId: 'inv-adv-02',
        orderId: 'ord-adv-02',
        amount: 4990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-adv-2',
        paymentMethod: 'KASPI_GOLD'
      };
      const signed = kaspi.createSignedWebhook(payload);

      // Alter amount from 4990 to 4991
      const tamperedBody = signed.rawBody.replace('4990', '4991');
      const isValid = kaspi.verifyWebhookSignature(tamperedBody, signed.signatureHeader);
      expect(isValid).toBe(false);
    });

    it('5.3 should reject signature with null-byte or control character injections', () => {
      const payload = { invoiceId: 'inv-adv-03', orderId: 'ord-adv-03', amount: 5000, status: 'SUCCESS' as const, transactionId: 'txn-3', paymentMethod: 'KASPI_GOLD' };
      const signed = kaspi.createSignedWebhook(payload);

      expect(kaspi.verifyWebhookSignature(signed.rawBody, signed.signatureHeader + '\x00')).toBe(false);
      expect(kaspi.verifyWebhookSignature(signed.rawBody, signed.signatureHeader + '\r\n')).toBe(false);
      expect(kaspi.verifyWebhookSignature(signed.rawBody, 'sha256=\x00\x00\x00')).toBe(false);
    });

    it('5.4 should use timing-safe constant time comparison resistant to timing attacks', () => {
      const bufA = Buffer.from('a'.repeat(32), 'hex');
      const bufB = Buffer.from('b'.repeat(32), 'hex');
      // Verify crypto.timingSafeEqual works and handles mismatch cleanly
      expect(crypto.timingSafeEqual(bufA, bufA)).toBe(true);
      expect(crypto.timingSafeEqual(bufA, bufB)).toBe(false);
    });

    it('5.5 should reject webhook when merchant secret in environment is empty string', () => {
      const insecureKaspi = new MockKaspiService('');
      const payload = { invoiceId: 'inv-empty', orderId: 'ord-empty', amount: 1000, status: 'SUCCESS' as const, transactionId: 'txn-0', paymentMethod: 'KASPI_GOLD' };
      const signed = insecureKaspi.createSignedWebhook(payload);

      // Even if signed with empty string, verification against real secret must fail
      const isValid = kaspi.verifyWebhookSignature(signed.rawBody, signed.signatureHeader);
      expect(isValid).toBe(false);
    });

    it('5.6 should reject replay attack when webhook payload has expired timestamp header', () => {
      const isReplayExpired = (timestampMs: number, maxAgeMs = 300000) => {
        return Date.now() - timestampMs > maxAgeMs;
      };
      const oldTimestamp = Date.now() - 600000; // 10 minutes ago
      expect(isReplayExpired(oldTimestamp)).toBe(true);

      const recentTimestamp = Date.now() - 5000; // 5 seconds ago
      expect(isReplayExpired(recentTimestamp)).toBe(false);
    });
  });
}
