export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type PublicMenuItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  category: PublicCategory;
};
