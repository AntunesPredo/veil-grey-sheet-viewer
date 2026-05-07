const PLAYER_WEBHOOK = import.meta.env.VITE_PLAYER_WEBHOOK;
const INVENTORY_WEBHOOK = import.meta.env.VITE_INVENTORY_WEBHOOK;

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: { name: string; value: string; inline?: boolean }[];
}

interface DiscordWebhookPayload {
  username: string;
  content?: string;
  embeds?: DiscordEmbed[];
  avatar_url?: string;
}

export async function dispatchDiscordLog(
  type: "PLAYER" | "INVENTORY",
  username: string,
  content?: string,
  embeds?: DiscordEmbed[],
) {
  const url = type === "PLAYER" ? PLAYER_WEBHOOK : INVENTORY_WEBHOOK;
  if (!url) return;

  try {
    const payload: DiscordWebhookPayload = {
      username: username || "UNKNOWN_UNIT",
    };

    if (content) payload.content = content;
    if (embeds && embeds.length > 0) payload.embeds = embeds;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Erro ao enviar webhook:", error);
  }
}
