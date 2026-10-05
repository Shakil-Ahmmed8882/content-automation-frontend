import { BaseSkeleton } from "./BaseSkeleton";

export const CardSkeletonV2 = () => {
  return (
    <div className="w-full rounded-lg overflow-hidden  bg-card">
      {/* Image skeleton */}
      <BaseSkeleton className="w-full h-40" />

      {/* Buttons */}
      <div className="flex gap-3 mt-2">
        <BaseSkeleton className="h-7 rounded-md w-[80%]" />
      </div>
      {/* Price */}
      <div className="flex items-center gap-2 mt-2">
        <BaseSkeleton className="w-1/2 h-5 rounded-md" />
      </div>
    </div>
  );
};

export const CardSkeletonV2List = ({
  className = "",
}: {
  className?: string;
}) => {
  return (
    <div
      className={`${className} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 `}
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <CardSkeletonV2 key={index} />
      ))}
    </div>
  );
};
