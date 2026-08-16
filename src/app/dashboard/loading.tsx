import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-40" />

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>

      <section className="mb-8">
        <Skeleton className="mb-4 h-6 w-64" />
        <Skeleton className="mb-4 h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </section>

      <section>
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="h-96 w-full" />
      </section>
    </div>
  );
}
