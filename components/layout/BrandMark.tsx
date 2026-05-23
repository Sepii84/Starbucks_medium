import Image from "next/image";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center ${className}`}>
      <Image
        src="/images/site/starbucks-brand-mark.svg"
        alt="Starbucks"
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-contain shadow-glow"
        priority
      />
    </span>
  );
}
