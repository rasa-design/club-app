import { getMembers, getPayments } from '@/lib/data'
import PaymentTable from '@/components/PaymentTable'

export default function PaymentsPage() {
  const members = getMembers()
  const payments = getPayments()

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">月謝 支払い状況</h2>
      <p className="text-xs text-gray-500 mb-4">◯ = 支払い済み</p>
      <PaymentTable members={members} payments={payments} isAdmin={false} />
    </div>
  )
}
