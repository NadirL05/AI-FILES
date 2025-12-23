'use client';
import { Invoice } from './types';
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
} from './calculations';

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  senderInfo: {
    marginBottom: 10,
  },
  clientInfo: {
    marginTop: 20,
    textAlign: 'right',
  },
  table: {
    marginTop: 30,
    marginBottom: 30,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ccc',
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2 solid #000',
    paddingBottom: 8,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
  },
  tableCellDescription: {
    flex: 3,
  },
  footer: {
    marginTop: 30,
    borderTop: '1 solid #ccc',
    paddingTop: 20,
  },
  totals: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 5,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalAmount: {
    fontWeight: 'bold',
  },
});

function InvoicePDF({ invoice }: { invoice: Invoice }) {
  const subtotal = calculateSubtotal(invoice.items);
  const tax = calculateTax(subtotal, invoice.taxRate);
  const total = calculateTotal(subtotal, tax);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FACTURE</Text>
          <View style={styles.senderInfo}>
            {invoice.sender.name && <Text>{invoice.sender.name}</Text>}
            {invoice.sender.address && <Text>{invoice.sender.address}</Text>}
            {invoice.sender.email && <Text>{invoice.sender.email}</Text>}
          </View>
          {invoice.client.name && (
            <View style={styles.clientInfo}>
              <Text style={{ fontWeight: 'bold' }}>Client</Text>
              <Text style={{ fontWeight: 'bold' }}>{invoice.client.name}</Text>
              {invoice.client.address && <Text>{invoice.client.address}</Text>}
              {invoice.client.email && <Text>{invoice.client.email}</Text>}
            </View>
          )}
        </View>

        {/* Items Table */}
        {invoice.items.length > 0 && (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.tableCellDescription]}>
                Description
              </Text>
              <Text style={styles.tableCell}>Qté</Text>
              <Text style={styles.tableCell}>Prix unit.</Text>
              <Text style={styles.tableCell}>Total</Text>
            </View>
            {invoice.items.map((item) => {
              const lineTotal = item.quantity * item.unitPrice;
              return (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellDescription]}>
                    {item.description}
                  </Text>
                  <Text style={styles.tableCell}>{item.quantity}</Text>
                  <Text style={styles.tableCell}>
                    {formatCurrency(item.unitPrice)}
                  </Text>
                  <Text style={styles.tableCell}>{formatCurrency(lineTotal)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Total HT</Text>
              <Text>{formatCurrency(subtotal)}</Text>
            </View>
            {invoice.taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text>TVA ({invoice.taxRate}%)</Text>
                <Text>{formatCurrency(tax)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total TTC</Text>
              <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
            </View>
          </View>

          {(invoice.date || invoice.dueDate) && (
            <View style={{ marginTop: 20 }}>
              {invoice.date && (
                <Text>
                  Date d&apos;émission :{' '}
                  {new Date(invoice.date).toLocaleDateString('fr-FR')}
                </Text>
              )}
              {invoice.dueDate && (
                <Text>
                  Échéance :{' '}
                  {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </View>
          )}

          {invoice.notes && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ fontWeight: 'bold' }}>Notes :</Text>
              <Text>{invoice.notes}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}

export async function generatePDF(invoice: Invoice) {
  // Utiliser react-pdf pour générer le PDF côté client
  const ReactPDF = await import('@react-pdf/renderer');
  // Utiliser JSX directement car react-pdf le supporte
  const doc = <InvoicePDF invoice={invoice} />;
  const blob = await ReactPDF.pdf(doc).toBlob();
  
  // Télécharger le fichier
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `facture-${invoice.id.slice(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

