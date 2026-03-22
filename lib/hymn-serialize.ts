export type HymnJSON = {
  id: string;
  number: number;
  title: string;
  lyrics: string;
  audioUrl: string;
  pageUrl: string;
  sheetMusicUrl: string;
  createdAt?: string;
  updatedAt?: string;
};

export function hymnToJSON(doc: {
  _id: { toString(): string };
  number: number;
  title?: string;
  lyrics?: string;
  audioUrl?: string;
  pageUrl?: string;
  sheetMusicUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): HymnJSON {
  return {
    id: doc._id.toString(),
    number: doc.number,
    title: doc.title ?? "",
    lyrics: doc.lyrics ?? "",
    audioUrl: doc.audioUrl ?? "",
    pageUrl: doc.pageUrl ?? "",
    sheetMusicUrl: doc.sheetMusicUrl ?? "",
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}
