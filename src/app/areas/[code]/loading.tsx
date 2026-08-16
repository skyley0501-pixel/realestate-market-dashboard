import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="mb-4 h-9 w-40" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>

      <section className="mb-8">
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="h-24 w-full" />
      </section>

      <section className="mb-8">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </section>

      <section>
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="h-64 w-full" />
      </section>
    </div>
  );
}
