import type { CreatorVision } from "@/lib/vision-store";

export async function createSharedBoardLink(vision: CreatorVision): Promise<string> {
  const response = await fetch("/api/shared-boards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vision }),
  });

  const data = (await response.json()) as { id?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to create share link.");
  }

  if (!data.id) {
    throw new Error("No share id returned.");
  }

  return `${window.location.origin}/share/${data.id}`;
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
