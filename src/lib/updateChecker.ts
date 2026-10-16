// src/lib/updateChecker.ts

export interface UpdateCheckResult {
  hasUpdate: boolean;
  localCount: number;
  remoteCount: number;
  newCodes: string[];
  checkedAt: number;
  error?: string;
}

interface RemoteSet {
  set_name: string;
  set_code: string;
  num_of_cards: number;
  tcg_date?: string;
}

export async function checkDataUpdate(
  localSets: { code: string; name: string }[]
): Promise<UpdateCheckResult> {
  const checkedAt = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://db.ygoprodeck.com/api/v7/cardsets.php', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const remote: RemoteSet[] = await res.json();

    const localCodes = new Set(localSets.map(s => s.code));
    const remoteCodes = new Set<string>();
    const newCodes: string[] = [];

    for (const s of remote) {
      const code = s.set_code;
      if (!code) continue;
      remoteCodes.add(code);
      if (!localCodes.has(code)) {
        newCodes.push(code);
      }
    }

    return {
      hasUpdate: newCodes.length > 0,
      localCount: localCodes.size,
      remoteCount: remoteCodes.size,
      newCodes,
      checkedAt,
    };
  } catch (err: any) {
    return {
      hasUpdate: false,
      localCount: localSets.length,
      remoteCount: 0,
      newCodes: [],
      checkedAt,
      error: err?.message || '网络错误',
    };
  }
}