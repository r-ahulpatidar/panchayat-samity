import { ButtonLink } from "@/components/ui/ButtonLink";
import { common } from "@/content/hi/common";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
      <h1 className="text-3xl font-bold">{common.notFound.title}</h1>
      <p className="text-muted">{common.notFound.body}</p>
      <div className="grid gap-3">
        <ButtonLink href="/samasya-batayen">{common.cta}</ButtonLink>
        <ButtonLink href="/" variant="outline">
          {common.notFound.back}
        </ButtonLink>
      </div>
    </div>
  );
}
