import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CheckoutFormProps {
  applicationId: number;
  amount: number;
  paymentIntentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CheckoutForm = ({ applicationId, amount, paymentIntentId, onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
      return;
    }

    setIsLoading(true);
    setErrorMessage(undefined);

    // Confirm the payment with Stripe.js
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?paymentIntentId=${paymentIntentId}&applicationId=${applicationId}`,
      }
    });

    if (stripeError) {
      setErrorMessage(stripeError.message);
      toast({
        title: 'Payment failed',
        description: stripeError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        // Confirm the payment with our backend
        const response = await apiRequest('POST', '/api/payment-confirm', {
          paymentIntentId,
          applicationId
        });
        
        if (response.ok) {
          toast({
            title: 'Payment successful',
            description: `₹${amount} payment was successfully processed!`,
          });
          onSuccess();
        } else {
          const data = await response.json();
          toast({
            title: 'Payment registration failed',
            description: data.message || 'Could not record payment in the system',
            variant: 'destructive',
          });
          setIsLoading(false);
        }
      } catch (err: any) {
        toast({
          title: 'System error',
          description: err.message || 'An error occurred while processing payment',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } else {
      // Payment is still processing or requires additional steps
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
      )}
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !stripe || !elements}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₹${amount}`
          )}
        </Button>
      </div>
    </form>
  );
};