export type SeedProduct = {
  sku: string;
  slug: string;
  name: string;
  category: "new" | "mens" | "womens" | "footwear" | "accessories" | "slides";
  priceCents: number;
  description: string;
  material?: string;
  sizeChart?: string;
  careInstructions?: string;
  modelInfo?: string;
  image: string;
  gallery: string[];
  stock: number;
  sortOrder: number;
};

export const seedProducts: SeedProduct[] = [
  {
    sku: "SL-03",
    slug: "sl-03-black-boot",
    name: "SL-03",
    category: "footwear",
    priceCents: 18000,
    description: "黑色厚底靴，极简轮廓与高筒鞋面。",
    image: "/products/sl-03.png",
    gallery: ["/products/sl-03.png"],
    stock: 12,
    sortOrder: 1
  },
  {
    sku: "PK-01",
    slug: "pk-01-black-parka",
    name: "PK-01",
    category: "new",
    priceCents: 10000,
    description: "黑色亮面连帽羽绒外套，宽松短版廓形。",
    image: "/products/pk-01.png",
    gallery: ["/products/pk-01.png", "/products/pk-01-detail.png", "/products/pk-01-alt.png", "/products/pk-01.png"],
    stock: 24,
    sortOrder: 2
  },
  {
    sku: "JC-10",
    slug: "jc-10-bomber",
    name: "JC-10",
    category: "mens",
    priceCents: 16000,
    description: "黑色短款立领夹克，干净利落的日常层次。",
    image: "/products/jc-10.png",
    gallery: ["/products/jc-10.png"],
    stock: 10,
    sortOrder: 3
  },
  {
    sku: "JC-11",
    slug: "jc-11-field-jacket",
    name: "JC-11",
    category: "mens",
    priceCents: 19000,
    description: "多口袋黑色外套，强调结构与功能。",
    image: "/products/jc-11.png",
    gallery: ["/products/jc-11.png"],
    stock: 9,
    sortOrder: 4
  },
  {
    sku: "SG-03",
    slug: "sg-03-sunglasses",
    name: "SG-03",
    category: "accessories",
    priceCents: 8000,
    description: "方形黑色太阳镜，低调锐利。",
    image: "/products/sg-03.png",
    gallery: ["/products/sg-03.png"],
    stock: 32,
    sortOrder: 5
  },
  {
    sku: "BP-02",
    slug: "bp-02-backpack",
    name: "BP-02",
    category: "accessories",
    priceCents: 14000,
    description: "黑色日用背包，轻量容量与隐藏细节。",
    image: "/products/bp-02.png",
    gallery: ["/products/bp-02.png"],
    stock: 15,
    sortOrder: 6
  },
  {
    sku: "PK-02",
    slug: "pk-02-camo-parka",
    name: "PK-02",
    category: "womens",
    priceCents: 12000,
    description: "白灰迷彩连帽外套，冬季视觉重点单品。",
    image: "/products/pk-02.png",
    gallery: ["/products/pk-02.png"],
    stock: 8,
    sortOrder: 7
  },
  {
    sku: "WD-02",
    slug: "wd-02-denim",
    name: "WD-02",
    category: "mens",
    priceCents: 11000,
    description: "灰色水洗直筒牛仔裤。",
    image: "/products/wd-02.png",
    gallery: ["/products/wd-02.png"],
    stock: 16,
    sortOrder: 8
  },
  {
    sku: "SL-01",
    slug: "sl-01-grey-slide",
    name: "SL-01",
    category: "slides",
    priceCents: 6000,
    description: "灰色一体式拖鞋，柔和曲线和厚底纹路。",
    image: "/products/sl-01.png",
    gallery: ["/products/sl-01.png"],
    stock: 40,
    sortOrder: 9
  },
  {
    sku: "CT-01",
    slug: "ct-01-coat",
    name: "CT-01",
    category: "womens",
    priceCents: 21000,
    description: "浅灰长款防风外套，宽松且安静。",
    image: "/products/ct-01.png",
    gallery: ["/products/ct-01.png"],
    stock: 11,
    sortOrder: 10
  },
  {
    sku: "BG-03",
    slug: "bg-03-duffle",
    name: "BG-03",
    category: "accessories",
    priceCents: 9000,
    description: "军绿色大容量托特包。",
    image: "/products/bg-03.png",
    gallery: ["/products/bg-03.png"],
    stock: 20,
    sortOrder: 11
  },
  {
    sku: "TS-07",
    slug: "ts-07-white-tee",
    name: "TS-07",
    category: "new",
    priceCents: 4000,
    description: "白色基础短袖，上身干净，版型挺括。",
    image: "/products/ts-07.png",
    gallery: ["/products/ts-07.png"],
    stock: 50,
    sortOrder: 12
  }
];
