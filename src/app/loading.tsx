import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-10 sm:px-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:items-center">
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-8 h-4 w-56" />
            <Skeleton className="mt-3 h-10 w-full max-w-xl" />
            <Skeleton className="mt-2 h-10 w-3/4 max-w-md" />
            <Skeleton className="mt-6 h-16 w-full max-w-xl" />
            <div className="mt-8 flex gap-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className={`h-16 ${i === 4 ? "col-span-2" : ""}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <Skeleton className="mb-6 h-6 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </section>
    </div>
  );
}
