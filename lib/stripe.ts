import Stripe from 'stripe';

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  });
}

export { stripe };

export interface CreatePaymentLinkParams {
  amount: number; // Amount in cents
  currency: string;
  description: string;
  invoiceNumber: string;
  clientEmail?: string;
}

export async function createStripePaymentLink({
  amount,
  currency,
  description,
  invoiceNumber,
  clientEmail,
}: CreatePaymentLinkParams): Promise<{ paymentLink: string; paymentId: string }> {
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  try {
    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create a Payment Link using Stripe API
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Facture ${invoiceNumber}`,
              description,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        invoiceNumber,
        description,
      },
      ...(clientEmail && {
        customer_email: clientEmail,
      }),
    });

    return {
      paymentLink: paymentLink.url,
      paymentId: paymentLink.id,
    };
  } catch (error) {
    console.error('Error creating Stripe payment link:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to create payment link: ${error.message}`
        : 'Failed to create payment link'
    );
  }
}

