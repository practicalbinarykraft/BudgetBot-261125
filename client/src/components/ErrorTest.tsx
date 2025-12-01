/**
 * Error Test Component
 *
 * This component is used to test the ErrorBoundary functionality.
 * It intentionally throws an error when rendered.
 *
 * Usage:
 * 1. Import this component in any page
 * 2. Add it to the JSX
 * 3. The ErrorBoundary should catch the error and display fallback UI
 *
 * Example:
 * ```tsx
 * import { ErrorTest } from '@/components/ErrorTest';
 *
 * function MyPage() {
 *   return (
 *     <div>
 *       <ErrorTest />
 *     </div>
 *   );
 * }
 * ```
 *
 * To test:
 * - In development: Should see detailed error message with stack trace
 * - In production: Should see user-friendly error message
 * - Should have "Reload Page" and "Go to Home" buttons
 *
 * IMPORTANT: Remove this component from production code!
 * This is only for testing ErrorBoundary during development.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Component that throws an error immediately when rendered
 */
export function ErrorTestImmediate() {
  // This will throw an error during render
  throw new Error('Test error from ErrorTestImmediate component - this is intentional!');

  // eslint-disable-next-line no-unreachable
  return <div>This should never render</div>;
}

/**
 * Component that throws an error after a button click
 */
export function ErrorTestOnClick() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error triggered by button click - this is intentional!');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Boundary Test</CardTitle>
        <CardDescription>
          Click the button below to trigger an error and test the ErrorBoundary
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => setShouldError(true)}
          variant="destructive"
        >
          Trigger Error
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Component that throws an error in useEffect
 */
export function ErrorTestInEffect() {
  useEffect(() => {
    // This will throw an error after component mounts
    setTimeout(() => {
      throw new Error('Test error from useEffect - this is intentional!');
    }, 1000);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Test (useEffect)</CardTitle>
        <CardDescription>
          This component will throw an error after 1 second
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Waiting for error...</p>
      </CardContent>
    </Card>
  );
}

/**
 * Component that throws an error in async function
 */
export function ErrorTestAsync() {
  const [error, setError] = useState<Error | null>(null);

  const triggerAsyncError = async () => {
    try {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Throw error
      throw new Error('Test async error - this is intentional!');
    } catch (err) {
      // ErrorBoundary doesn't catch async errors directly
      // We need to set state to trigger a render error
      setError(err as Error);
    }
  };

  if (error) {
    // Re-throw in render to be caught by ErrorBoundary
    throw error;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Test (Async)</CardTitle>
        <CardDescription>
          Click to trigger an async error
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={triggerAsyncError} variant="destructive">
          Trigger Async Error
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Component with null reference error
 */
export function ErrorTestNullReference() {
  const [data, setData] = useState<{ name: string } | null>(null);
  const [shouldAccess, setShouldAccess] = useState(false);

  if (shouldAccess && data) {
    // This will cause an error if data is null
    return <div>{data.name.toUpperCase()}</div>;
  }

  if (shouldAccess && !data) {
    // Simulate accessing property of null
    // @ts-ignore - intentional error for testing
    return <div>{data.name}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Test (Null Reference)</CardTitle>
        <CardDescription>
          Trigger a null reference error
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => setShouldAccess(true)}
          variant="destructive"
        >
          Access Null Property
        </Button>
      </CardContent>
    </Card>
  );
}
