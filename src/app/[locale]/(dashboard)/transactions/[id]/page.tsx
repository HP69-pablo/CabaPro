import TransactionDetailView from "@/components/transactions/TransactionDetailView";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function TransactionPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <TransactionDetailView transactionId={id} />
    </div>
  );
}
