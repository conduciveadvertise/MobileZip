export type ZipFile = {
  id: string;
  name: string;
  size: string;
  date: string;
  files: number;
};

export const RECENT_ZIPS: ZipFile[] = [];
export const ALL_ZIPS: ZipFile[] = [];

export type PickFile = {
  id: string;
  name: string;
  size: string;
  meta: string;
};

export const PICKABLE_FILES: PickFile[] = [];
