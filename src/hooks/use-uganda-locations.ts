import { useMemo } from "react";
import districtsRaw from "@/data/uganda-districts.json";
import subcountiesRaw from "@/data/uganda-subcounties.json";
import parishesRaw from "@/data/uganda-parishes.json";
import villagesRaw from "@/data/uganda-villages.json";

export interface District {
  district_code: number;
  district_name: string;
  region_code: number;
  region_name: string;
}

export interface Subcounty {
  subcounty_code: number;
  subcounty_name: string;
  district_code: number;
  district_name: string;
}

export interface LocationValue {
  region: string;
  district_code: number;
  district_name: string;
  subcounty_code: number;
  subcounty_name: string;
  parish: string;
  village: string;
}

const REGIONS = ["CENTRAL", "EASTERN", "NORTHERN", "WESTERN"];

const districts = districtsRaw as District[];
const subcounties = subcountiesRaw as Subcounty[];
const parishesBySubcounty = parishesRaw as Record<string, Record<string, string[]>>;
const villagesByParish = villagesRaw as Record<string, Record<string, Record<string, string[]>>>;

export function useUgandaLocations() {
  const regionNames = useMemo(() => REGIONS, []);

  const districtsByRegion = useMemo(() => {
    const map: Record<string, District[]> = {};
    for (const d of districts) {
      if (!map[d.region_name]) map[d.region_name] = [];
      map[d.region_name].push(d);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.district_name.localeCompare(b.district_name));
    }
    return map;
  }, []);

  const subcountiesByDistrict = useMemo(() => {
    const map: Record<number, Subcounty[]> = {};
    for (const s of subcounties) {
      if (!map[s.district_code]) map[s.district_code] = [];
      map[s.district_code].push(s);
    }
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) => a.subcounty_name.localeCompare(b.subcounty_name));
    }
    return map;
  }, []);

  const getDistricts = (region: string): District[] => districtsByRegion[region] ?? [];
  const getSubcounties = (districtCode: number): Subcounty[] => subcountiesByDistrict[districtCode] ?? [];

  const getParishes = (districtName: string, subcountyName: string): string[] => {
    const upperDist = districtName.toUpperCase();
    const upperSub = subcountyName.toUpperCase();
    const bySub = parishesBySubcounty[upperDist];
    if (!bySub) return [];
    const parishes = bySub[upperSub];
    if (!parishes) return [];
    return parishes.sort((a, b) => a.localeCompare(b));
  };

  const getVillages = (districtName: string, subcountyName: string, parishName: string): string[] => {
    const upperDist = districtName.toUpperCase();
    const upperSub = subcountyName.toUpperCase();
    const upperPar = parishName.toUpperCase();
    const bySub = villagesByParish[upperDist];
    if (!bySub) return [];
    const byPar = bySub[upperSub];
    if (!byPar) return [];
    const villages = byPar[upperPar];
    if (!villages) return [];
    return villages.sort((a, b) => a.localeCompare(b));
  };

  return { regions: regionNames, getDistricts, getSubcounties, getParishes, getVillages };
}
