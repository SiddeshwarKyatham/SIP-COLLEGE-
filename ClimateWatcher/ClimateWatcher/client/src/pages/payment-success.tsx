import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // Get query parameters from URL
        const params = new URLSearchParams(window.location.search);
        const paymentIntentId = params.get('payment_intent');
        const applicationId = params.get('applicationId');
        
        if (!paymentIntentId || !applicationId) {
          console.error('Missing payment intent ID or application ID');
          toast({
            title: 'Missing payment information',
            description: 'Could not confirm payment due to missing information.',
            variant: 'destructive',
          });
          return;
        }
        
        setIsConfirming(true);
        
        // Call our backend to confirm and record the payment
        const response = await apiRequest('POST', '/api/payment-confirm', {
          paymentIntentId,
          applicationId
        });
        
        if (response.ok) {
          setConfirmed(true);
          toast({
            title: 'Payment confirmed',
            description: 'Your payment has been successfully confirmed and recorded.'
          });
        } else {
          const data = await response.json();
          toast({
            title: 'Payment confirmation issue',
            description: data.message || 'Could not confirm payment with our system.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Payment confirmation error:', error);
        toast({
          title: 'Error confirming payment',
          description: error.message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setIsConfirming(false);
      }
    };
    
    // Attempt to confirm payment when component mounts
    confirmPayment();
    
    // Auto-redirect after success
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-4">
          {isConfirming ? (
            <div className="rounded-full bg-blue-100 p-3">
              <Loader2 size={48} className="text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isConfirming ? 'Confirming Payment...' : 'Payment Successful!'}
        </h1>
        <p className="text-gray-600 mb-6">
          {isConfirming 
            ? 'We are confirming your payment with our system. Please wait...'
            : 'Your payment has been processed successfully. Thank you for your payment.'
          }
        </p>
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => navigate("/")}
            disabled={isConfirming}
          >
            Return to Home
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.print()}
            disabled={isConfirming}
          >
            Print Receipt
          </Button>
        </div>
      </div>
    </div>
  );
}