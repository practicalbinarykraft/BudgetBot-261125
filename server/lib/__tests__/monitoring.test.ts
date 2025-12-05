/**
 * Monitoring Tests
 *
 * Tests for metrics and alerts modules.
 * Junior-Friendly: ~80 lines, covers core monitoring features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { metrics, BusinessEvents } from '../metrics';

describe('Metrics Module', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('incrementCounter', () => {
    it('increments counter by 1 by default', () => {
      metrics.incrementCounter('test_counter');
      metrics.incrementCounter('test_counter');

      const all = metrics.getAll();
      expect(all.counters['test_counter']).toBe(2);
    });

    it('increments counter by custom value', () => {
      metrics.incrementCounter('test_counter', 5);

      const all = metrics.getAll();
      expect(all.counters['test_counter']).toBe(5);
    });
  });

  describe('setGauge', () => {
    it('sets gauge value', () => {
      metrics.setGauge('active_users', 42);

      const all = metrics.getAll();
      expect(all.gauges['active_users']).toBe(42);
    });

    it('overwrites previous gauge value', () => {
      metrics.setGauge('active_users', 10);
      metrics.setGauge('active_users', 20);

      const all = metrics.getAll();
      expect(all.gauges['active_users']).toBe(20);
    });
  });

  describe('recordTiming', () => {
    it('records timing values', () => {
      metrics.recordTiming('api_time', 100);
      metrics.recordTiming('api_time', 200);
      metrics.recordTiming('api_time', 300);

      const all = metrics.getAll();
      expect(all.timings['api_time'].count).toBe(3);
      expect(all.timings['api_time'].avg).toBe(200);
      expect(all.timings['api_time'].min).toBe(100);
      expect(all.timings['api_time'].max).toBe(300);
    });
  });

  describe('trackApiCall', () => {
    it('tracks successful API calls', () => {
      metrics.trackApiCall('GET', 200, 50);

      const all = metrics.getAll();
      expect(all.counters['api_calls_total']).toBe(1);
      expect(all.counters['api_calls_success']).toBe(1);
      expect(all.counters['api_calls_get']).toBe(1);
    });

    it('tracks failed API calls', () => {
      metrics.trackApiCall('POST', 500, 100);

      const all = metrics.getAll();
      expect(all.counters['api_calls_server_error']).toBe(1);
    });

    it('tracks client errors', () => {
      metrics.trackApiCall('PUT', 400, 30);

      const all = metrics.getAll();
      expect(all.counters['api_calls_client_error']).toBe(1);
    });
  });

  describe('trackEvent', () => {
    it('tracks business events', () => {
      metrics.trackEvent(BusinessEvents.USER_REGISTERED);
      metrics.trackEvent(BusinessEvents.TRANSACTION_CREATED);
      metrics.trackEvent(BusinessEvents.TRANSACTION_CREATED);

      const all = metrics.getAll();
      expect(all.counters['event_user_registered']).toBe(1);
      expect(all.counters['event_transaction_created']).toBe(2);
    });
  });

  describe('getAll', () => {
    it('returns all metrics', () => {
      metrics.incrementCounter('counter1');
      metrics.setGauge('gauge1', 10);
      metrics.recordTiming('timing1', 100);

      const all = metrics.getAll();

      expect(all.counters).toHaveProperty('counter1');
      expect(all.gauges).toHaveProperty('gauge1');
      expect(all.timings).toHaveProperty('timing1');
    });
  });

  describe('reset', () => {
    it('clears all metrics', () => {
      metrics.incrementCounter('counter');
      metrics.setGauge('gauge', 10);
      metrics.recordTiming('timing', 100);

      metrics.reset();
      const all = metrics.getAll();

      expect(Object.keys(all.counters)).toHaveLength(0);
      expect(Object.keys(all.gauges)).toHaveLength(0);
      expect(Object.keys(all.timings)).toHaveLength(0);
    });
  });
});

describe('BusinessEvents', () => {
  it('contains expected event names', () => {
    expect(BusinessEvents.USER_REGISTERED).toBe('user_registered');
    expect(BusinessEvents.TRANSACTION_CREATED).toBe('transaction_created');
    expect(BusinessEvents.BUDGET_EXCEEDED).toBe('budget_exceeded');
  });
});
