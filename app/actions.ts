'use server';

import { prisma } from '@/lib/db';
import { Invoice } from '@/lib/types';
import { calculateSubtotal, calculateTax, calculateTotal, formatCurrency } from '@/lib/calculations';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { createStripePaymentLink } from '@/lib/stripe';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function saveInvoice(invoiceData: Invoice) {
  try {
    // Convertir les dates de string à Date
    const date = new Date(invoiceData.date);
    const dueDate = new Date(invoiceData.dueDate);

    // Valider que les dates sont valides
    if (isNaN(date.getTime()) || isNaN(dueDate.getTime())) {
      return {
        success: false,
        error: 'Dates invalides',
      };
    }

    // Vérifier que le client a un nom
    if (!invoiceData.client?.name) {
      return {
        success: false,
        error: 'Le nom du client est requis',
      };
    }

    // Calculer le totalAmount
    const subtotal = calculateSubtotal(invoiceData.items);
    const tax = calculateTax(subtotal, invoiceData.taxRate);
    const totalAmount = calculateTotal(subtotal, tax);

    // Chercher ou créer le client (par nom)
    let client = await prisma.client.findFirst({
      where: {
        name: invoiceData.client.name,
      },
    });

    if (!client) {
      // Créer le client s'il n'existe pas
      client = await prisma.client.create({
        data: {
          name: invoiceData.client.name,
          email: invoiceData.client.email || undefined,
          address: invoiceData.client.address || undefined,
        },
      });
    } else {
      // Mettre à jour le client s'il existe (seulement si de nouvelles données sont fournies)
      const updateData: { email?: string; address?: string } = {};
      if (invoiceData.client.email) {
        updateData.email = invoiceData.client.email;
      }
      if (invoiceData.client.address) {
        updateData.address = invoiceData.client.address;
      }

      if (Object.keys(updateData).length > 0) {
        client = await prisma.client.update({
          where: { id: client.id },
          data: updateData,
        });
      }
    }

    // Générer un numéro de facture unique
    // Format: INV-YYYYMMDD-XXXX (où XXXX est un nombre aléatoire)
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV-${datePrefix}-${randomSuffix}`;

    // Vérifier que le numéro n'existe pas déjà (peu probable mais sécurité)
    let finalInvoiceNumber = invoiceNumber;
    const existingInvoice = await prisma.invoice.findUnique({
      where: { number: invoiceNumber },
    });

    if (existingInvoice) {
      // Si le numéro existe, générer un nouveau
      const newRandomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalInvoiceNumber = `INV-${datePrefix}-${newRandomSuffix}`;
    }

    // Convertir le status de l'Invoice type vers InvoiceStatus enum
    const invoiceStatus = invoiceData.status === 'finalized' ? 'SENT' : 'DRAFT';

    // Générer le lien de paiement Stripe automatiquement
    let paymentLink: string | undefined;
    let stripePaymentId: string | undefined;

    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const description = `Facture ${finalInvoiceNumber} - ${invoiceData.client.name}`;
        const { paymentLink: link, paymentId } = await createStripePaymentLink({
          amount: totalAmount,
          currency: invoiceData.currency,
          description,
          invoiceNumber: finalInvoiceNumber,
          clientEmail: invoiceData.client.email,
        });
        paymentLink = link;
        stripePaymentId = paymentId;
      } catch (error) {
        console.error('Error creating Stripe payment link:', error);
        // Continue sans le lien de paiement si Stripe échoue
      }
    }

    // Créer l'Invoice avec les InvoiceItems et le lien de paiement
    const invoice = await prisma.invoice.create({
      data: {
        number: finalInvoiceNumber,
        date,
        dueDate,
        status: invoiceStatus,
        totalAmount,
        currency: invoiceData.currency,
        ...(paymentLink && { paymentLink }),
        ...(stripePaymentId && { stripePaymentId }),
        paymentStatus: 'PENDING',
        clientId: client.id,
        items: {
          create: invoiceData.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      } as any,
      include: {
        client: true,
        items: true,
      },
    });

    // Revalider les chemins pour mettre à jour le cache
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/clients');

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
    };
  } catch (error) {
    console.error('Error saving invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde',
    };
  }
}

export async function getDashboardStats() {
  try {
    // Calculer le totalRevenue (somme de TOUTES les factures)
    const totalRevenueResult = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
      },
    });

    const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

    // Compter le nombre total de factures
    const invoiceCount = await prisma.invoice.count();

    // Compter le nombre de clients uniques
    const clientCount = await prisma.client.count();

    // Calculer la valeur moyenne des factures (Total Revenue / Total Invoices)
    // Gérer la division par zéro en retournant 0 si invoiceCount est 0
    const averageInvoiceValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;

    // Récupérer les 5 dernières factures avec les informations du client
    const recentInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        number: true,
        date: true,
        totalAmount: true,
        currency: true,
        status: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      totalRevenue,
      invoiceCount,
      clientCount,
      averageInvoiceValue,
      recentInvoices: recentInvoices.map((invoice: any) => ({
        id: invoice.id,
        number: invoice.number,
        date: invoice.date.toISOString().split('T')[0],
        amount: invoice.totalAmount,
        currency: invoice.currency,
        status: invoice.status,
        clientName: invoice.client?.name || 'Sans client',
      })),
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalRevenue: 0,
      invoiceCount: 0,
      clientCount: 0,
      averageInvoiceValue: 0,
      recentInvoices: [],
    };
  }
}

export async function sendInvoiceEmail(invoiceId: string, email: string) {
  try {
    // Vérifier que la facture existe
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    }) as any;

    if (!invoice) {
      return {
        success: false,
        error: 'Facture introuvable',
      };
    }

    // Vérifier que RESEND_API_KEY est configuré
    if (!process.env.RESEND_API_KEY) {
      return {
        success: false,
        error: 'RESEND_API_KEY n\'est pas configuré',
      };
    }

    // Formater le montant
    const amountFormatted = formatCurrency(invoice.totalAmount, invoice.currency as 'EUR' | 'USD');
    const paymentLink = invoice.paymentLink || null;

    // Générer le contenu HTML de l'email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.number}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2563eb; margin-top: 0;">Votre facture est prête</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Bonjour${invoice.client?.name ? ` ${invoice.client.name}` : ''},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Veuillez trouver ci-joint votre facture <strong>${invoice.number}</strong> d&apos;un montant de <strong>${amountFormatted}</strong>.
    </p>
    
    <div style="background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Numéro de facture :</strong> ${invoice.number}</p>
      <p style="margin: 5px 0;"><strong>Date :</strong> ${new Date(invoice.date).toLocaleDateString('fr-FR')}</p>
      <p style="margin: 5px 0;"><strong>Échéance :</strong> ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
      <p style="margin: 5px 0;"><strong>Montant :</strong> ${amountFormatted}</p>
    </div>
    
    ${paymentLink ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${paymentLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Payer maintenant
      </a>
    </div>
    <p style="font-size: 14px; color: #666; text-align: center; margin-top: 10px;">
      Ou copiez ce lien : <a href="${paymentLink}" style="color: #2563eb; word-break: break-all;">${paymentLink}</a>
    </p>
    ` : ''}
    
    <p style="font-size: 16px; margin-top: 30px;">
      Cordialement,<br>
      <strong>L&apos;équipe VoiceInvoice</strong>
    </p>
  </div>
</body>
</html>
    `.trim();

    // Envoyer l'email via Resend
    const { data, error } = await getResend().emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Facture disponible : ${invoice.number}`,
      html: htmlContent,
    });

    // Si erreur lors de l'envoi, retourner l'erreur
    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi de l\'email',
      };
    }

    // Vérifier que l'email a été envoyé avec succès
    if (!data || !data.id) {
      return {
        success: false,
        error: 'L\'email n\'a pas pu être envoyé',
      };
    }

    // Mettre à jour le statut de la facture à 'SENT' seulement si l'email a été envoyé avec succès
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'SENT',
      },
    });

    // Revalider les chemins pour mettre à jour l'UI
    revalidatePath('/');
    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email',
    };
  }
}

export async function getAllClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    return clients.map((client: any) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      address: client.address,
      vatNumber: client.vatNumber,
      createdAt: client.createdAt.toISOString(),
      invoiceCount: client._count.invoices,
    }));
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
}

export async function getInvoicePaymentLink(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    }) as any;

    if (!invoice) {
      return null;
    }

    return {
      paymentLink: invoice.paymentLink || null,
      paymentStatus: invoice.paymentStatus || null,
    };
  } catch (error) {
    console.error('Error fetching invoice payment link:', error);
    return null;
  }
}

export async function getClientById(clientId: string) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            number: true,
            date: true,
            dueDate: true,
            totalAmount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!client) {
      return null;
    }

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      address: client.address,
      vatNumber: client.vatNumber,
      createdAt: client.createdAt.toISOString(),
      invoices: client.invoices.map((invoice: any) => ({
        id: invoice.id,
        number: invoice.number,
        date: invoice.date.toISOString().split('T')[0],
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        amount: invoice.totalAmount,
        currency: invoice.currency,
        status: invoice.status,
        createdAt: invoice.createdAt.toISOString().split('T')[0],
      })),
    };
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
}
