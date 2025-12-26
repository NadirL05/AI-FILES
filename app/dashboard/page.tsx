import { getDashboardStats } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Users, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/calculations';

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'SENT':
      return 'bg-blue-100 text-blue-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'Brouillon';
    case 'SENT':
      return 'Envoyée';
    case 'PAID':
      return 'Payée';
    default:
      return status;
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">VoiceInvoice</h1>
              <nav className="flex gap-4">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Éditeur
                </Link>
                <Link
                  href="/dashboard"
                  className="text-gray-900 bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/clients"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Clients
                </Link>
              </nav>
            </div>
            <Link href="/">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle facture
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Chiffre d&apos;affaires total
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue, 'EUR')}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Somme de toutes les factures
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total factures
              </CardTitle>
              <FileText className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.invoiceCount}</div>
              <p className="text-xs text-gray-500 mt-2">
                Nombre total de factures
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total clients
              </CardTitle>
              <Users className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.clientCount}</div>
              <p className="text-xs text-gray-500 mt-2">
                Clients uniques
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Valeur moyenne
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.averageInvoiceValue, 'EUR')}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Par facture en moyenne
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Activité récente</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Les 5 dernières factures créées</p>
          </CardHeader>
          <CardContent>
            {stats.recentInvoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Aucune facture</p>
                <p className="text-sm mt-2">
                  Créez votre première facture pour commencer
                </p>
                <Link href="/" className="mt-4 inline-block">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle facture
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Numéro
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Client
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Montant
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentInvoices.map((invoice: any) => (
                      <tr
                        key={invoice.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {invoice.number}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {invoice.clientName}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(invoice.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(invoice.amount, invoice.currency as 'EUR' | 'USD')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              invoice.status
                            )}`}
                          >
                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

