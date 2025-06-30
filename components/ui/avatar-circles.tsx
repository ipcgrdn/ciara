"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarCirclesProps {
  className?: string;
  numPeople?: number;
  avatarUrls: string[];
}

const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) => {
  return (
    <div className={cn("z-10 flex -space-x-4 rtl:space-x-reverse", className)}>
      {avatarUrls.map((url, index) => (
        <div
          key={index}
          className="relative h-10 w-10 rounded-full border-2 border-white dark:border-gray-800"
        >
          <Image
            className="rounded-full"
            src={url}
            fill
            alt={`Avatar ${index + 1}`}
          />
        </div>
      ))}
      {numPeople && (
        <a
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black text-center text-xs font-medium text-white hover:bg-gray-600 dark:border-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-300"
          href=""
        >
          +{numPeople}
        </a>
      )}
    </div>
  );
};

export { AvatarCircles };
