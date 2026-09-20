import { assertNever, type Faction, type RaceId } from "@/lib/types";

export type RaceDef = {
  id: RaceId;
  name: string;
  faction: Faction;
  skyborne: boolean;
  short: string;
};

export const RACES: RaceDef[] = [
  { id: "orc", name: "Orc", faction: "horde", skyborne: false, short: "Orc" },
  {
    id: "undead",
    name: "Undead",
    faction: "horde",
    skyborne: false,
    short: "UD",
  },
  {
    id: "tauren",
    name: "Tauren",
    faction: "horde",
    skyborne: false,
    short: "Tau",
  },
  { id: "troll", name: "Troll", faction: "horde", skyborne: false, short: "Tro" },
  {
    id: "windshaper",
    name: "Skyborne",
    faction: "horde",
    skyborne: true,
    short: "Sky",
  },
  {
    id: "human",
    name: "Human",
    faction: "alliance",
    skyborne: false,
    short: "Hum",
  },
  {
    id: "dwarf",
    name: "Dwarf",
    faction: "alliance",
    skyborne: false,
    short: "Dwa",
  },
  {
    id: "nightelf",
    name: "Night Elf",
    faction: "alliance",
    skyborne: false,
    short: "NE",
  },
  {
    id: "gnome",
    name: "Gnome",
    faction: "alliance",
    skyborne: false,
    short: "Gno",
  },
  {
    id: "highorder",
    name: "Skyborne",
    faction: "alliance",
    skyborne: true,
    short: "Sky",
  },
];

export function raceById(id: RaceId): RaceDef {
  const found = RACES.find((race) => race.id === id);
  if (!found) {
    throw new Error(`unknown race ${id}`);
  }
  return found;
}

export function racesForFaction(faction: Faction): RaceDef[] {
  switch (faction) {
    case "horde":
      return RACES.filter((race) => race.faction === "horde");
    case "alliance":
      return RACES.filter((race) => race.faction === "alliance");
    default:
      return assertNever(faction, "faction");
  }
}
