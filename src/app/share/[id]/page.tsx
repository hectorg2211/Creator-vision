import type { Metadata } from "next";
import { SharedVisionBoard } from "@/components/SharedVisionBoard";

type SharePageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Shared Creator Vision Board",
  description: "View a shared Creator Vision board.",
};

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  return <SharedVisionBoard boardId={id} />;
}
