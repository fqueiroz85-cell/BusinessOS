import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategoryItems } from "@/lib/content";
import { CATEGORIES } from "@/lib/categories";

export default function Home() {
  const sections = CATEGORIES.map((category) => ({
    ...category,
    count: getCategoryItems(category.key).length,
  }));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          BusinessOS
        </h1>
        <p className="text-muted-foreground">
          Pra quem está começando do zero.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link key={section.key} href={`/${section.key}`} className="block">
            <Card className="h-full transition-colors hover:bg-muted/60">
              <CardHeader>
                <CardTitle>{section.label}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {section.count}{" "}
                  {section.count === 1 ? "item" : "itens"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
