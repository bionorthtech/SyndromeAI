// Telemetry removed: this app does not phone home.
// The PostHog client and all network egress have been stripped. The analytics
// surface below is preserved as local no-ops so existing call sites keep working
// while nothing ever leaves the machine.

import { ConsentManager } from './consent';
import type { EventName, AnalyticsSettings } from './types';

export * from './types';
export * from './events';
export { ConsentManager } from './consent';
export { ResourceMonitor, resourceMonitor } from './resourceMonitor';

class AnalyticsService {
  private static instance: AnalyticsService;
  private consentManager: ConsentManager;

  private constructor() {
    this.consentManager = ConsentManager.getInstance();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // No-op: kept so main.tsx's call site stays valid.
  async initialize(): Promise<void> {}

  // Consent is tracked locally only (localStorage). No network either way.
  async enable(): Promise<void> {
    await this.consentManager.grantConsent();
  }

  async disable(): Promise<void> {
    await this.consentManager.revokeConsent();
  }

  async deleteAllData(): Promise<void> {
    await this.consentManager.deleteAllData();
  }

  setScreen(_screenName: string): void {}

  track(_eventName: EventName | string, _properties?: Record<string, any>): void {}

  identify(_traits?: Record<string, any>): void {}

  shutdown(): void {}

  isEnabled(): boolean {
    return this.consentManager.isEnabled();
  }

  hasConsented(): boolean {
    return this.consentManager.hasConsented();
  }

  getSettings(): AnalyticsSettings | null {
    return this.consentManager.getSettings();
  }
}

export const analytics = AnalyticsService.getInstance();
export default analytics;

/**
 * Local-only performance helper. Computes percentiles in-memory; never transmits.
 */
export class PerformanceTracker {
  private static performanceData: Map<string, number[]> = new Map();

  static recordMetric(operation: string, duration: number): void {
    if (!this.performanceData.has(operation)) {
      this.performanceData.set(operation, []);
    }
    const data = this.performanceData.get(operation)!;
    data.push(duration);
    if (data.length > 100) {
      data.shift();
    }
  }

  static getStats(operation: string): { p50: number; p95: number; p99: number; count: number } | null {
    const data = this.performanceData.get(operation);
    if (!data || data.length === 0) return null;
    const sorted = [...data].sort((a, b) => a - b);
    return {
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: data.length,
    };
  }

  static clear(operation?: string): void {
    if (operation) {
      this.performanceData.delete(operation);
    } else {
      this.performanceData.clear();
    }
  }
}
