import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth.helper';
import { createTestUser } from './fixtures/test-user.fixture';

/**
 * Notifications E2E Tests
 * 
 * FOR JUNIORS: These tests verify that notifications work correctly end-to-end.
 * We test the full flow: creating planned transactions/income, checking notifications,
 * marking them as read, and deleting them.
 * 
 * What it tests:
 * - Creating notifications for planned transactions
 * - Creating notifications for planned income
 * - Reading list of notifications
 * - Filtering notifications
 * - Marking notifications as read
 * - Deleting notifications
 */

test.describe('Notifications', () => {
  let authHelper: AuthHelper;
  let testUser: ReturnType<typeof createTestUser>;
  let authCookie: string | undefined;

  test.beforeEach(async ({ page, context }) => {
    authHelper = new AuthHelper(page);
    testUser = createTestUser('notifications');
    
    // Register and login
    await authHelper.register(testUser.email, testUser.password, testUser.name);
    
    // Get auth cookie for API requests
    const cookies = await context.cookies();
    authCookie = cookies.find(c => c.name === 'connect.sid')?.value;
    
    // Navigate to dashboard
    await page.goto('/app/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should create notification for planned expense', async ({ page, request }) => {
    // Create a planned transaction with today's date
    const today = new Date().toISOString().split('T')[0];
    
    const plannedExpenseResponse = await request.post('/api/planned', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Planned Expense',
        amount: '100.00',
        currency: 'USD',
        targetDate: today,
        status: 'planned',
        category: 'Food',
      },
    });

    expect(plannedExpenseResponse.ok()).toBeTruthy();
    const plannedExpense = await plannedExpenseResponse.json();

    // Trigger notification check by calling notifications endpoint
    const notificationsResponse = await request.get('/api/notifications', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(notificationsResponse.ok()).toBeTruthy();
    const notifications = await notificationsResponse.json();

    // Should have at least one notification for the planned expense
    const notification = notifications.find(
      (n: any) => n.plannedTransactionId === plannedExpense.id && n.type === 'planned_expense'
    );

    expect(notification).toBeDefined();
    expect(notification.status).toBe('unread');
    expect(notification.transactionData).toBeDefined();
    expect(notification.transactionData.amount).toBe('100.00');
    expect(notification.transactionData.type).toBe('expense');
  });

  test('should create notification for planned income', async ({ page, request }) => {
    // Create a planned income with today's date
    const today = new Date().toISOString().split('T')[0];
    
    const plannedIncomeResponse = await request.post('/api/planned-income', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
        'Content-Type': 'application/json',
      },
      data: {
        amount: '500.00',
        currency: 'USD',
        amountUsd: '500.00',
        description: 'Test Salary',
        expectedDate: today,
        status: 'pending',
      },
    });

    expect(plannedIncomeResponse.ok()).toBeTruthy();
    const plannedIncome = await plannedIncomeResponse.json();

    // Trigger notification check
    const notificationsResponse = await request.get('/api/notifications', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(notificationsResponse.ok()).toBeTruthy();
    const notifications = await notificationsResponse.json();

    // Should have notification for planned income
    const notification = notifications.find(
      (n: any) => n.plannedIncomeId === plannedIncome.id && n.type === 'planned_income'
    );

    expect(notification).toBeDefined();
    expect(notification.status).toBe('unread');
    expect(notification.transactionData).toBeDefined();
    expect(notification.transactionData.amount).toBe('500.00');
    expect(notification.transactionData.type).toBe('income');
  });

  test('should get unread notifications count', async ({ page, request }) => {
    // Create a planned transaction
    const today = new Date().toISOString().split('T')[0];
    
    await request.post('/api/planned', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Expense',
        amount: '50.00',
        currency: 'USD',
        targetDate: today,
        status: 'planned',
      },
    });

    // Get unread count
    const countResponse = await request.get('/api/notifications/unread-count', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(countResponse.ok()).toBeTruthy();
    const { count } = await countResponse.json();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should mark notification as read', async ({ page, request }) => {
    // Create a planned transaction
    const today = new Date().toISOString().split('T')[0];
    
    await request.post('/api/planned', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Expense',
        amount: '75.00',
        currency: 'USD',
        targetDate: today,
        status: 'planned',
      },
    });

    // Get notifications
    const notificationsResponse = await request.get('/api/notifications', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    const notifications = await notificationsResponse.json();
    const notification = notifications.find((n: any) => n.type === 'planned_expense');
    
    expect(notification).toBeDefined();
    expect(notification.status).toBe('unread');

    // Mark as read
    const readResponse = await request.patch(`/api/notifications/${notification.id}/read`, {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(readResponse.ok()).toBeTruthy();
    const updatedNotification = await readResponse.json();
    expect(updatedNotification.status).toBe('read');
    expect(updatedNotification.readAt).toBeDefined();
  });

  test('should mark notification as dismissed', async ({ page, request }) => {
    // Create a planned transaction
    const today = new Date().toISOString().split('T')[0];
    
    await request.post('/api/planned', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Expense',
        amount: '80.00',
        currency: 'USD',
        targetDate: today,
        status: 'planned',
      },
    });

    // Get notifications
    const notificationsResponse = await request.get('/api/notifications', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    const notifications = await notificationsResponse.json();
    const notification = notifications.find((n: any) => n.type === 'planned_expense');

    // Mark as dismissed
    const dismissResponse = await request.patch(`/api/notifications/${notification.id}/dismiss`, {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(dismissResponse.ok()).toBeTruthy();
    const updatedNotification = await dismissResponse.json();
    expect(updatedNotification.status).toBe('dismissed');
    expect(updatedNotification.dismissedAt).toBeDefined();
  });

  test('should delete notification', async ({ page, request }) => {
    // Create a planned transaction
    const today = new Date().toISOString().split('T')[0];
    
    await request.post('/api/planned', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Expense',
        amount: '90.00',
        currency: 'USD',
        targetDate: today,
        status: 'planned',
      },
    });

    // Get notifications
    const notificationsResponse = await request.get('/api/notifications', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    const notifications = await notificationsResponse.json();
    const notification = notifications.find((n: any) => n.type === 'planned_expense');

    // Delete notification
    const deleteResponse = await request.delete(`/api/notifications/${notification.id}`, {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(deleteResponse.ok()).toBeTruthy();
    const result = await deleteResponse.json();
    expect(result.success).toBe(true);

    // Verify notification is deleted
    const getResponse = await request.get(`/api/notifications/${notification.id}`, {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(getResponse.status()).toBe(404);
  });

  test('should get notification by ID', async ({ page, request }) => {
    // Create a planned transaction
    const today = new Date().toISOString().split('T')[0];
    
    await request.post('/api/planned', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Expense',
        amount: '110.00',
        currency: 'USD',
        targetDate: today,
        status: 'planned',
      },
    });

    // Get notifications
    const notificationsResponse = await request.get('/api/notifications', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    const notifications = await notificationsResponse.json();
    const notification = notifications.find((n: any) => n.type === 'planned_expense');

    // Get notification by ID
    const getResponse = await request.get(`/api/notifications/${notification.id}`, {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(getResponse.ok()).toBeTruthy();
    const fetchedNotification = await getResponse.json();
    expect(fetchedNotification.id).toBe(notification.id);
    expect(fetchedNotification.type).toBe('planned_expense');
  });

  test('should return 404 for non-existent notification', async ({ page, request }) => {
    const getResponse = await request.get('/api/notifications/99999', {
      headers: {
        'Cookie': `connect.sid=${authCookie}`,
      },
    });

    expect(getResponse.status()).toBe(404);
  });
});
