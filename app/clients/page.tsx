import { getAllClients } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Mail, MapPin, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function ClientsPage() {
  const clients = await getAllClients();

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
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/clients"
                  className="text-gray-900 bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Clients</h2>
          <p className="text-gray-600">
            Base de données clients générée automatiquement lors de la création de factures
          </p>
        </div>

        {clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">Aucun client</p>
              <p className="text-sm text-gray-500 mb-4">
                Les clients sont créés automatiquement lorsque vous générez des factures.
              </p>
              <Link href="/">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une facture
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{client.name}</CardTitle>
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{client.email}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{client.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-3 pt-3 border-t">
                        <FileText className="h-4 w-4" />
                        <span>
                          {client.invoiceCount} facture{client.invoiceCount > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


