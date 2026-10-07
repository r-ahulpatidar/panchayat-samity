import type { Metadata } from "next";
import { ComplaintForm } from "@/components/form/ComplaintForm";
import { PageHeading } from "@/components/ui/PageHeading";
import { form } from "@/content/hi/form";

export const metadata: Metadata = {
  title: form.metaTitle,
  description: form.metaDescription,
};

export default function ComplaintPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title={form.title} intro={form.intro} />
      <ComplaintForm />
    </div>
  );
}
