export type ReceiptExtractionItem = {
  name: string;
  quantity: number | null;
  unit: string | null;
};

export type ReceiptExtractionResult = {
  store: string | null;
  date: string | null;
  items: ReceiptExtractionItem[];
};

export type ReceiptReviewItem = ReceiptExtractionItem & {
  id: string;
  include: boolean;
};

export type ReceiptImportItem = {
  name: string;
  quantity?: number;
  unit?: string;
  source: "receipt";
};
