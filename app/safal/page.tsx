import type { Metadata } from "next";
import { SuccessCard } from "./SuccessCard";
import { success } from "@/content/hi/form";

export const metadata: Metadata = {
  title: success.metaTitle,
  robots: { index: false },
};

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-xl">
      <SuccessCard />
    </div>
  );
}
