import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Skeleton className="mb-6 h-8 w-32" />
      <Skeleton className="mb-6 h-24 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
