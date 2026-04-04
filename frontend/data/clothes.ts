/**
 * Mock data for the user's wardrobe and local items.
 * This file is used to provide initial data to components and fix module import errors.
 */

export interface ClothingItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  size: string;
  seller: string;
  distance: number;
  listing: 'buy' | 'trade' | 'trade_buy' | 'donate';
  description?: string;
  condition?: string;
}

export const myClosetItems: ClothingItem[] = [
  {
    id: "m1",
    name: "Classic Denim Jacket",
    price: 120.00,
    image: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?q=80&w=400&auto=format&fit=crop",
    category: "Outerwear",
    size: "L",
    seller: "Me",
    distance: 0,
    listing: 'buy',
    condition: "Like new",
    description: "A well-maintained classic denim jacket."
  },
  {
    id: "m2",
    name: "Cotton Knit Sweater",
    price: 0,
    image: "https://images.unsplash.com/photo-1574015974293-817f0efebb19?q=80&w=400&auto=format&fit=crop",
    category: "T-shirts",
    size: "M",
    seller: "Me",
    distance: 0,
    listing: 'trade',
    condition: "Good",
    description: "Comfortable sweater for casual wear."
  },
  {
    id: "m3",
    name: "Vintage Floral Dress",
    price: 85.00,
    image: "https://images.unsplash.com/photo-1572804013307-a9a111dc81b2?q=80&w=400&auto=format&fit=crop",
    category: "Dresses",
    size: "S",
    seller: "Me",
    distance: 0,
    listing: 'buy',
    condition: "New with tags"
  },
  {
    id: "m4",
    name: "Canvas Sneakers",
    price: 0,
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=400&auto=format&fit=crop",
    category: "Footwear",
    size: "42",
    seller: "Me",
    distance: 0,
    listing: 'donate',
    condition: "Used"
  }
];
