export const SITE_CONTENT = {
  brand: {
    name: 'ONLINE ANNAVARAM',
    tagline: 'Temple-town snacks handcrafted with Andhra devotion.',
    description:
      'Authentic Telugu savouries made fresh and shipped across India. Every bite carries the warmth of Annavaram streets.',
    cta: { label: 'Taste the Tradition', href: '/products' },
  },
  navLinks: [
    { label: 'Home', to: '/' },
    { label: 'Shop All', to: '/products' },
    { label: 'My Cart', to: '/cart' },
    { label: 'Checkout', to: '/checkout' },
  ],
  productSections: [
    {
      id: 'popular',
      title: 'Crowd Favourite Snacks',
      items: [
        {
          id: 'kakinada-kaja',
          slug: 'kakinada-kaja',
          name: 'Kakinada Kaja',
          category: 'Classic Sweets',
          price: 32000,
          image: '/telugu_snacks_images/snacks05.jpg',
          actionLabel: 'Add to Cart',
        },
        {
          id: 'gavvalu-jaggery',
          slug: 'gavvalu-jaggery',
          name: 'Gavvalu with Jaggery',
          category: 'Festive Nibbles',
          price: 28000,
          image: '/telugu_snacks_images/snacks06.jpg',
          actionLabel: 'Add to Cart',
        },
        {
          id: 'chekkalu-crunch',
          slug: 'chekkalu-crunch',
          name: 'Chekkalu Crunch',
          category: 'Savory Snacks',
          price: 24000,
          image: '/telugu_snacks_images/snacks07.jpg',
          actionLabel: 'Add to Cart',
        },
      ],
    },
    {
      id: 'newest',
      title: "Fresh From Today's Kitchen",
      items: [
        {
          id: 'madatha-kaja-swirls',
          slug: 'madatha-kaja-swirls',
          name: 'Madatha Kaja Swirls',
          category: 'Temple Special',
          price: 34000,
          image: '/telugu_snacks_images/snacks08.jpg',
          actionLabel: 'Add to Cart',
        },
        {
          id: 'kara-boondi-mix',
          slug: 'kara-boondi-mix',
          name: 'Kara Boondi Mix',
          category: 'Tea-Time Partner',
          price: 22000,
          image: '/telugu_snacks_images/snacks09.jpg',
          actionLabel: 'Add to Cart',
        },
        {
          id: 'bellam-murukulu',
          slug: 'bellam-murukulu',
          name: 'Bellam Murukulu',
          category: 'Sweet Crunch',
          price: 26000,
          image: '/telugu_snacks_images/snacks10.jpg',
          actionLabel: 'Add to Cart',
        },
      ],
    },
  ],
  infoBoxes: [
    {
      title: 'Temple-Town Gift Boxes',
      description:
        "Curated hampers packed with prasadam-inspired sweets that honour Annayya's legacy.",
      image: '/telugu_snacks_images/snacks02.jpg',
      actionLabel: 'Build Your Hamper',
      actionHref: '/products?category=hampers',
    },
    {
      title: 'Evening Tiffin Must-Haves',
      description:
        'Pair your filter coffee with our crunchy chekkalu, murukulu, and home-style mixtures.',
      image: '/telugu_snacks_images/snacks03.jpg',
      actionLabel: 'View Snack Shelf',
      actionHref: '/products?category=snacks',
    },
  ],
  testimonial: {
    quote:
      'Online Annavaram brings the same warmth we remember from temple streets. Every packet smells of hot ghee, roasted gram, and home kitchens.',
    author: 'Harika',
    role: 'Hyderabad Food Blogger',
  },
  features: [
    {
      id: 'secure-payments',
      title: 'Secure Payments',
      description: 'Unified UPI and card checkouts with tamper-proof packing slips.',
      icon: 'lock',
    },
    {
      id: 'fresh-shipping',
      title: 'Fresh Dispatch Daily',
      description: 'Early morning batches are sealed and shipped the same day across India.',
      icon: 'truck',
    },
    {
      id: 'order-tracking',
      title: 'Heritage Promise',
      description: "Every box carries ingredients, batch timings, and the maker's signature.",
      icon: 'map',
    },
  ],
  footer: {
    columns: [
      {
        title: 'Menu',
        links: [
          { label: 'Home', to: '/' },
          { label: 'Shop All', to: '/products' },
          { label: 'Gift Hampers', to: '/products?category=hampers' },
          { label: 'Contact', to: '/#footer' },
        ],
      },
      {
        title: 'Signature Bites',
        items: ['Madatha Kaja', 'Pootharekulu', 'Kobbari Undalu'],
      },
      {
        title: 'Support',
        links: [
          { label: 'WhatsApp Us', to: '/contact' },
          { label: 'Shipping FAQs', to: '/faq' },
        ],
      },
      {
        title: 'Follow Us',
        className: 'social-links',
        links: [
          { label: 'Instagram', href: 'https://instagram.com' },
          { label: 'YouTube', href: 'https://youtube.com' },
          { label: 'Facebook', href: 'https://facebook.com' },
        ],
      },
    ],
    copyright: '2025 Online Annavaram. Crafted in Andhra with love.',
  },
};

export const FALLBACK_PRODUCTS = [
  {
    id: 'fallback-1',
    name: 'Organic Palm Jaggery',
    slug: 'organic-palm-jaggery',
    description: 'Traditionally prepared jaggery sourced from Annavaram.',
    price: 49900,
    currency: 'INR',
    stock: 120,
    category: 'jaggery',
    images: ['/telugu_snacks_images/snacks01.jpg'],
  },
  {
    id: 'fallback-2',
    name: 'Cow Ghee 1L',
    slug: 'cow-ghee-1l',
    description: 'Rich aromatic ghee sourced from local dairy farms.',
    price: 89900,
    currency: 'INR',
    stock: 80,
    category: 'ghee',
    images: ['/telugu_snacks_images/snacks04.jpg'],
  },
];
