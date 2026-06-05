import type { GroundDto } from '../../types';

export interface GroundGroup {
  group: string;
  items: GroundDto[];
}

function matchesGround(ground: GroundDto, query: string): boolean {
  if (!query) return true;
  const haystack = `${ground.label} ${ground.value} ${ground.group} ${ground.detailPrompt ?? ''}`.toLowerCase();
  if (haystack.includes(query)) return true;

  const aliases: Record<string, string[]> = {
    race: ['racial'],
    disability: ['disabled'],
    sex: ['sexual'],
  };

  return (aliases[query] ?? []).some((alias) => haystack.includes(alias));
}

export function filterGroundGroups(groundsCatalog: GroundDto[], query: string): GroundGroup[] {
  const q = query.trim().toLowerCase();
  const groups = new Map<string, GroundDto[]>();

  groundsCatalog.forEach((ground) => {
    if (!matchesGround(ground, q)) return;
    const items = groups.get(ground.group) ?? [];
    items.push(ground);
    groups.set(ground.group, items);
  });

  return Array.from(groups.entries()).map(([group, items]) => ({ group, items }));
}
