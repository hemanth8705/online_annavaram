export const SITE_CONTENT = {
  brand: {
    name: 'ONLINE ANNAVARAM',
    tagline: 'ఆంధ్ర రుచులు, ప్రతీ ముక్కలో ఆనందం',
    description: 'Authentic Telugu savouries hand-crafted from the temple town straight to your table.',
    cta: { label: 'Taste the Tradition', href: '#popular' },
  },
  navLinks: [
    { label: 'Home', href: '#' },
    { label: 'Snacks', href: '#popular' },
    { label: 'Festive Hampers', href: '#collections' },
    { label: 'Contact', href: '#footer' },
  ],
  productSections: [
    {
      id: 'popular',
      title: 'Crowd Favourite Snacks',
      items: [
        {
          name: 'Kakinada Kaja',
          category: 'Classic Sweets',
          price: '\u20B9 320.00',
          image: '/telugu_snacks_images/snacks05.jpg',
          actionLabel: 'Add to Brass Plate',
        },
        {
          name: 'Gavvalu with Jaggery',
          category: 'Festive Nibbles',
          price: '\u20B9 280.00',
          image: '/telugu_snacks_images/snacks06.jpg',
          actionLabel: 'Order Batch',
        },
        {
          name: 'Chekkalu Crunch',
          category: 'Savory Snacks',
          price: '\u20B9 240.00',
          image: '/telugu_snacks_images/snacks07.jpg',
          actionLabel: 'Add to Brass Plate',
        },
      ],
    },
    {
      id: 'newest',
      title: "Fresh From Today's Kitchen",
      items: [
        {
          name: 'Madatha Kaja Swirls',
          category: 'Temple Special',
          price: '\u20B9 340.00',
          image: '/telugu_snacks_images/snacks08.jpg',
          actionLabel: 'Reserve Box',
        },
        {
          name: 'Kara Boondi Mix',
          category: 'Tea-Time Partner',
          price: '\u20B9 220.00',
          image: '/telugu_snacks_images/snacks09.jpg',
          actionLabel: 'Add to Brass Plate',
        },
        {
          name: 'Bellam Murukulu',
          category: 'Sweet Crunch',
          price: '\u20B9 260.00',
          image: '/telugu_snacks_images/snacks10.jpg',
          actionLabel: 'Reserve Box',
        },
      ],
    },
  ],
  infoBoxes: [
    {
      title: 'Temple-Town Gift Boxes',
      description: "Curated hampers packed with prasadam-inspired sweets that honour Annayya's legacy.",
      image: '/telugu_snacks_images/snacks02.jpg',
      actionLabel: 'Build Your Hamper',
      actionHref: '#',
    },
    {
      title: 'Evening Tiffin Must-Haves',
      description: 'Pair your filter coffee with our crunchy chekkalu, murukulu, and home-style mixtures.',
      image: '/telugu_snacks_images/snacks03.jpg',
      actionLabel: 'View Snack Shelf',
      actionHref: '#',
    },
  ],
  testimonial: {
    quote: `Online Annavaram brings the same warmth we remember from temple streets. Every packet smells of hot ghee, roasted gram, and home kitchens. The flavours hit nostalgic notes from our Andhra childhood.`,
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
      description: 'Early-morning batches are sealed and shipped the same day across India.',
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
          { label: 'Home', href: '#' },
          { label: 'Snacks', href: '#popular' },
          { label: 'Hampers', href: '#collections' },
          { label: 'Custom Orders', href: '#footer' },
        ],
      },
      {
        title: 'Signature Bites',
        items: ['Madatha Kaja', 'Pootharekulu', 'Kobbari Undalu'],
      },
      {
        title: 'Support',
        links: [
          { label: 'WhatsApp Us', href: '#' },
          { label: 'Shipping FAQs', href: '#' },
        ],
      },
      {
        title: 'Follow Us',
        className: 'social-links',
        links: [
          { label: 'Instagram', href: '#' },
          { label: 'YouTube', href: '#' },
          { label: 'Facebook', href: '#' },
        ],
      },
    ],
    copyright: '2025 Online Annavaram. Crafted in Andhra with love.',
  },
}
