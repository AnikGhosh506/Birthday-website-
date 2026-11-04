import { PersonalizationData } from '../types';

export const DEFAULT_BIRTHDAY_DATA: PersonalizationData = {
  girlfriendName: "Atrayee",
  nickname: "Best Big Sis",
  boyfriendName: "Arpita",
  birthdayDate: "2026-05-28",
  anniversaryDate: "2010-05-28",
  heroKicker: "To the coolest, wisest older sister in the universe",
  heroHeadline: "Happy Birthday, Atrayee",
  heroMessage:
    "May 28th marks the day the world got a whole lot brighter—and the reason I got the best built-in best friend, protector, and role model anyone could ever ask for. Thank you for always having my back, giving the best advice, and filling life with laughter. Here is a little corner of the internet made just to celebrate you!",
  secretWishMessage:
    "May every big dream you have been working toward come true this year, Atrayee. No matter where life takes us, I will always look up to you and be cheering the loudest for you in every room.",
  memories: [
    {
      id: "mem-1",
      title: "Growing Up Side by Side",
      date: "Childhood Days",
      location: "Home Sweet Home",
      caption:
        "From childhood cartoons and silly games to teaching me the ropes of life, having you as my older sister meant I never had to face anything alone.",
      tag: "Childhood",
      imageUrl: "",
    },
    {
      id: "mem-2",
      title: "Late-Night Kitchen Talks & Snacks",
      date: "Midnight Hours",
      location: "The Kitchen Counter",
      caption:
        "Some of our best conversations happen past midnight over snacks—laughing until our stomachs hurt and debriefing every little detail of our lives.",
      tag: "Inside Jokes",
      imageUrl: "",
    },
    {
      id: "mem-3",
      title: "The Great Wardrobe Borrowing Era",
      date: "Every Special Occasion",
      location: "Your Closet",
      caption:
        "Let's be honest: having an older sister with immaculate taste means your closet has always been my favorite boutique (even when I 'forgot' to ask first!).",
      tag: "Sisterhood",
      imageUrl: "",
    },
    {
      id: "mem-4",
      title: "Always Having My Back",
      date: "Through Thick & Thin",
      location: "Everywhere We Go",
      caption:
        "Whenever life got tough or I needed someone to defend me, guide me, or tell me the honest truth, you stepped up without hesitation.",
      tag: "My Protector",
      imageUrl: "",
    },
    {
      id: "mem-5",
      title: "Family Outings & Unstoppable Giggles",
      date: "Every Celebration",
      location: "Together",
      caption:
        "Making eye contact across the room at family gatherings and immediately knowing what the other is thinking without saying a single word.",
      tag: "Inside Jokes",
      imageUrl: "",
    },
    {
      id: "mem-6",
      title: "Watching You Shine & Conquer Your Goals",
      date: "28th May & Beyond",
      location: "Your Next Chapter",
      caption:
        "Seeing the kind, brilliant, and fearless woman you are inspires me every single day. The best chapters of your life are just getting started!",
      tag: "Role Model",
      imageUrl: "",
    },
  ],
  letters: [
    {
      id: "let-1",
      sealColor: "#c2410c",
      title: "Open on your birthday morning ☀️",
      subtitle: "Happy 28th May, Big Sis!",
      openWhen: "The very first thing on your birthday morning",
      content: `Happy Birthday, Atrayee!\n\nToday is 28th May—officially Queen Big Sister Day! Before your phone blows up with messages and birthday wishes, I wanted to remind you how lucky I am to have you in my life.\n\nGrowing up with you as my older sister has been the greatest privilege. You paved the way, set the bar high, and somehow still made time to look out for me every step of the way.\n\nEat your favorite food today, celebrate to the fullest, and let everyone spoil you the way you deserve!`,
      signOff: "With the biggest birthday hug,",
    },
    {
      id: "let-2",
      sealColor: "#be185d",
      title: "Open when you need to know how proud I am 🌟",
      subtitle: "From your biggest fan",
      openWhen: "Whenever you doubt yourself or how far you've come",
      content: `Dear Atrayee,\n\nI don't say this nearly often enough, so I'm putting it in writing: I look up to you more than you know.\n\nI see how hard you work, how deeply you care about the people around you, and how gracefully you handle whatever life throws your way. Even on days when you feel like you don't have it all figured out, to me you have always been a superhero.\n\nKeep shining, keep chasing what makes you happy, and never forget that I'm always in your corner cheering for you.`,
      signOff: "Your proudest sibling,",
    },
    {
      id: "let-3",
      sealColor: "#047857",
      title: "Open when life or work feels stressful 🌿",
      subtitle: "Take a breather, sis",
      openWhen: "When responsibilities feel heavy and you need a break",
      content: `Hey Atrayee,\n\nTake a deep breath and relax your shoulders. As the older sister, you're so used to being the strong, responsible one who holds everything together.\n\nConsider this your official reminder that you don't have to carry the whole world on your own. Take a break, order your favorite comfort food, put on a good show, and call me whenever you want to vent—no judgment, just 100% support.\n\nYou've got this, and I've got you.`,
      signOff: "Always here for you,",
    },
    {
      id: "let-4",
      sealColor: "#7c3aed",
      title: "Open when we've had a silly sibling argument 😂",
      subtitle: "Peace treaty enclosed",
      openWhen: "Even when we bicker over the tiniest things",
      content: `Dearest Atrayee,\n\nOkay, even when we annoy each other or debate over the most random things on earth, you know we can never stay mad for more than ten minutes!\n\nThat's the magic of having a sister—we can roast each other one second and share snacks the very next minute. Thank you for putting up with my antics for all these years.\n\nTruce declared! Now let's go get something good to eat.`,
      signOff: "Your partner in crime,",
    },
    {
      id: "let-5",
      sealColor: "#b45309",
      title: "Open for your birthday treat promise 🎁",
      subtitle: "Special sister celebration",
      openWhen: "When you're ready to claim your birthday outing",
      content: `Surprise, birthday queen!\n\nBeyond this digital keepsake and arcade, your real birthday treat is waiting! Whether it's your favorite cafe, a shopping trip, dessert run, or a movie night, your wish is my command.\n\nCheck out your Sisterhood Vouchers below and redeem whichever one you want first!\n\nHappy 28th May, Atrayee!`,
      signOff: "With endless love and excitement,",
    },
  ],
  coupons: [
    {
      id: "coup-1",
      title: "Iced Coffee & Dessert Run on Me",
      description:
        "Your favorite coffee, boba, or pastry delivered straight to you or enjoyed at your favorite cafe—100% my treat.",
      category: "food",
      icon: "coffee",
      isRedeemed: false,
    },
    {
      id: "coup-2",
      title: "Personal Photographer for a Day",
      description:
        "Unlimited candid and posed photos until we get the exact angles you approve of, with zero complaints!",
      category: "pampering",
      icon: "sparkles",
      isRedeemed: false,
    },
    {
      id: "coup-3",
      title: "You Pick the Movie & Takeout Night",
      description:
        "Full control of the remote and the food order. Any movie, series binge, or comfort food you're craving.",
      category: "romantic",
      icon: "film",
      isRedeemed: false,
    },
    {
      id: "coup-4",
      title: "Win Any Sibling Debate 'Free Pass'",
      description:
        "Play this voucher during any sibling disagreement and I will immediately admit that the older sister is always right.",
      category: "romantic",
      icon: "shield-check",
      isRedeemed: false,
    },
    {
      id: "coup-5",
      title: "Sister Shopping & Day Out Spree",
      description:
        "A dedicated sister day out—shopping, window browsing, carrying your bags, and hyping up every outfit.",
      category: "adventure",
      icon: "compass",
      isRedeemed: false,
    },
    {
      id: "coup-6",
      title: "No-Questions-Asked Chore / Favor Pass",
      description:
        "Redeem anytime you want me to handle an errand, chore, or favor for you while you relax like birthday royalty.",
      category: "food",
      icon: "heart",
      isRedeemed: false,
    },
  ],
  quiz: [
    {
      id: "q-1",
      question: "When is Atrayee's iconic birthday celebrated every year?",
      options: [
        "14th April",
        "28th May — The start of the best season!",
        "12th August",
        "Every single day of the year",
      ],
      correctIndex: 1,
      explanation:
        "28th May is officially the best day on the calendar (though celebrating you every day is also valid!).",
    },
    {
      id: "q-2",
      question: "What is the best perk of having Atrayee as an older sister?",
      options: [
        "Top-tier life advice and honest pep talks",
        "Having a built-in protector and best friend for life",
        "Immaculate taste in food, music, and style",
        "All of the above (and a thousand more!)",
      ],
      correctIndex: 3,
      explanation:
        "Trick question—you truly are the ultimate all-in-one older sister!",
    },
    {
      id: "q-3",
      question: "What is our undefeated sibling bonding activity?",
      options: [
        "Laughing at inside jokes nobody else understands",
        "Sharing delicious food & late-night chats",
        "Roasting each other with love and then teaming up immediately",
        "All of the above!",
      ],
      correctIndex: 3,
      explanation:
        "Nothing beats our sisterhood duo—partner in crime for life!",
    },
  ],
  adoreReasons: [
    {
      id: 1,
      text: "How you have always been my first role model, protector, and built-in best friend.",
      category: "sisterhood",
    },
    {
      id: 2,
      text: "The way we can communicate an entire paragraph just by looking at each other across a room.",
      category: "funny",
    },
    {
      id: 3,
      text: "Your honest, wise advice whenever I'm overthinking a decision and need clarity.",
      category: "deep",
    },
    {
      id: 4,
      text: "How fiercely you care for our family and everyone lucky enough to know you.",
      category: "sweet",
    },
    {
      id: 5,
      text: "That even when we bicker like typical siblings, we have each other's backs 100% of the time.",
      category: "sisterhood",
    },
    {
      id: 6,
      text: "Your contagious laugh that instantly brightens up the entire house.",
      category: "sweet",
    },
    {
      id: 7,
      text: "How you let me borrow your things (even when I forget to ask permission first!).",
      category: "funny",
    },
    {
      id: 8,
      text: "The late-night chats where we talk about everything from silly memes to our biggest dreams.",
      category: "deep",
    },
    {
      id: 9,
      text: "Your impeccable taste in snacks, outfits, and knowing exactly how to celebrate any occasion.",
      category: "sweet",
    },
    {
      id: 10,
      text: "How you paved the way as the older sister and made growing up so much easier and more fun for me.",
      category: "deep",
    },
    {
      id: 11,
      text: "The pride I feel whenever I tell people that you are my big sister.",
      category: "sisterhood",
    },
    {
      id: 12,
      text: "Because no matter how old we get, you will always be my favorite person to share life's memories with.",
      category: "deep",
    },
  ],
};
