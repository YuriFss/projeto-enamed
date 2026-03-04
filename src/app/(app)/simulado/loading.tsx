import { Skeleton } from '@/components/ui/skeleton'

export default function SimuladoLoading() {
  return (
    <div>
      <Skeleton className="h-8 w-32 mb-6" />

      {/* Setup form */}
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>
    </div>
  )
}
