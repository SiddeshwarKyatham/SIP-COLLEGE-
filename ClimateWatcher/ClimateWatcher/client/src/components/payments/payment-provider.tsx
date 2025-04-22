import React, { ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

/**
 * Payment Provider Component
 * 
 * This component provides a simplified approach to handling Stripe payments.
 * It fetches a payment intent from the server and sets up the Stripe Elements context.
 * 
 * IMPLEMENTATION NOTES:
 * - We've simplified the payment flow by removing webhooks and complex redirections
 * - PaymentProvider accepts either a function as children (render prop pattern) or React nodes
 * - When using the function pattern, it passes the paymentIntentId to the children function
 * - This approach makes the payment flow more robust and easier to maintain
 * - For development, we support a simulated payment option that doesn't require Stripe
 */

// Load the Stripe.js library
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing Stripe public key. Please set VITE_STRIPE_PUBLIC_KEY environment variable.');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentProviderProps {
  children: ((paymentIntentId: string) => ReactNode) | ReactNode;
  amount: number;
  applicationId: number;
}

export const PaymentProvider = ({ children, amount, applicationId }: PaymentProviderProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiRequest('POST', '/api/create-payment-intent', {
          amount,
          applicationId
        });
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize payment');
        console.error('Error creating payment intent:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [amount, applicationId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
        <p className="font-medium">Error initializing payment</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!clientSecret || !paymentIntentId) {
    return <div>Unable to initialize payment</div>;
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#7c3aed',
      },
    },
  };

  // Render content based on children type
  const renderContent = () => {
    if (typeof children === 'function') {
      // If children is a function, call it with paymentIntentId
      return children(paymentIntentId);
    } else {
      // If children is a regular ReactNode, clone and pass props
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { paymentIntentId } as any);
        }
        return child;
      });
    }
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {renderContent()}
    </Elements>
  );
};