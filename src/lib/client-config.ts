export interface ClientConfig {
  clientCode: string;
  appType: string;
  localBodyLevel: number;
}

export interface ParsedClientConfig {
  currentClientCode: string;
  localBodyLevel: number;
}

function parseClientConfigs(raw: string): ClientConfig[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.clientCode === 'string' && typeof item.localBodyLevel === 'number');
  } catch {
    return [];
  }
}

export function getParsedClientConfig(): ParsedClientConfig {
  const raw = (import.meta.env.VITE_CLIENT_CONFIGS as string | undefined) || '[]';
  const configs = parseClientConfigs(raw);
  const clientCode = (import.meta.env.VITE_CLIENT_CODE as string | undefined) || '';
  const matched = configs.find((c) => c.clientCode === clientCode);
  return {
    currentClientCode: clientCode,
    localBodyLevel: matched?.localBodyLevel ?? 1,
  };
}
