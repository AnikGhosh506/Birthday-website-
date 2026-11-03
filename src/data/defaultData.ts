import { PersonalizationData } from '../types';

export const DEFAULT_BIRTHDAY_DATA: PersonalizationData = {
  girlfriendName: "Atrayee",
  nickname: "My Sunshine",
  boyfriendName: "Julian",
  birthdayDate: "2026-10-26",
  anniversaryDate: "2023-04-14",
  heroKicker: "To the most extraordinary soul in the universe",
  heroHeadline: "Happy Birthday, Atrayee",
  heroMessage: "Today marks the day the world was blessed with you. Thank you for filling my days with warmth, quiet laughter, and endless adventure. Here is a little corner of the internet dedicated entirely to celebrating you.",
  secretWishMessage: "May every dream you hold close in your heart whisper back to you this year. I promise to stand beside you, cheer for you, and love you more fiercely with every sunrise.",
  memories: [
    {
      id: "mem-1",
      title: "The Evening We First Met",
      date: "April 14, 2023",
      location: "The Little Corner Bookstore & Cafe",
      caption: "You were reading with a cup of chamomile tea. I was pretending to look at architecture books just to muster the courage to ask what chapter you were on. Best 20 minutes of my life.",
      tag: "The Beginning",
      imageUrl: ""
    },
    {
      id: "mem-2",
      title: "Our First Spontaneous Road Trip",
      date: "August 22, 2023",
      location: "Pacific Coast Highway",
      caption: "Windows rolled down, warm summer wind in your hair, singing at the top of our lungs to songs we barely knew the lyrics to. We pulled over just to watch the sky turn pink and gold.",
      tag: "Adventures",
      imageUrl: ""
    },
    {
      id: "mem-3",
      title: "The Rainy Sunday We Baked",
      date: "November 5, 2023",
      location: "Our Kitchen",
      caption: "Flour ended up in your hair, the cookies burned on the bottom, but neither of us cared because we were laughing too hard on the kitchen floor while the storm tapped on the window.",
      tag: "Everyday Magic",
      imageUrl: ""
    },
    {
      id: "mem-4",
      title: "Stargazing at the Old Lookout",
      date: "January 19, 2024",
      location: "Pine Hill Summit",
      caption: "Wrapped in two thick blankets drinking hot cider from a thermos. You pointed at shooting stars and made wishes you refused to tell me. I already had everything I wished for right next to me.",
      tag: "Pure Wonder",
      imageUrl: ""
    },
    {
      id: "mem-5",
      title: "That Late Night Walk in the Fog",
      date: "May 2, 2024",
      location: "Harbor Promenade",
      caption: "The whole city had gone quiet. We walked for hours talking about our childhoods, our deepest fears, and the life we wanted to build together. That was the night I knew without a doubt.",
      tag: "Heart to Heart",
      imageUrl: ""
    },
    {
      id: "mem-6",
      title: "Celebrating Another Beautiful Milestone",
      date: "October 2024",
      location: "Under the Fairy Lights",
      caption: "Every single day with you is a gift I never take for granted. Watching you bloom, pursue your dreams, and make everyone around you feel cherished is my greatest honor.",
      tag: "Forever Growing",
      imageUrl: ""
    }
  ],
  letters: [
    {
      id: "let-1",
      sealColor: "#c2410c",
      title: "Open on your birthday morning ☀️",
      subtitle: "Before the day gets busy",
      openWhen: "The very first moment you wake up on your birthday",
      content: `Good morning, birthday girl.\n\nBefore anyone else texts you, before the candles are lit, and before you blow away another year, take a deep breath. Today is completely yours.\n\nI want you to know how deeply you are adored. You bring an effortless grace and warmth into every room you enter. Seeing your sleepy smile in the morning is my absolute favorite sight in the world.\n\nToday, we celebrate everything that makes you, YOU. Go put on that outfit you love, drink your coffee hot, and get ready for a day where you are treated like royalty.\n\nAll my heart,\nJulian`,
      signOff: "Forever your biggest fan"
    },
    {
      id: "let-2",
      sealColor: "#be185d",
      title: "Open when you miss me 💌",
      subtitle: "A reminder across any distance",
      openWhen: "Whenever you feel alone or miss hearing my voice",
      content: `Hey beautiful,\n\nIf you're reading this, maybe you're having a quiet evening, or maybe we are apart for a few days. Close your eyes for three seconds and imagine my arms wrapped around you, pulling you in close.\n\nNo matter where I am, my heart is always anchored right next to yours. You are the thought that brings me peace during long days and the reason I look forward to coming home.\n\nCall me right after you read this so I can tell you in my own voice just how much I love you.`,
      signOff: "Always holding you close"
    },
    {
      id: "let-3",
      sealColor: "#047857",
      title: "Open when you feel overwhelmed 🌿",
      subtitle: "Take a gentle pause with me",
      openWhen: "When work, life, or stress feels heavy",
      content: `My love,\n\nPause. Unclench your jaw. Drop your shoulders away from your ears. Take one slow, deep breath in... and let it out.\n\nYou carry so much on your shoulders, and you do it with so much strength and kindness. But you don't have to carry it all at once, and you certainly don't have to carry it alone.\n\nYou are more than enough just as you are right now. The to-do list can wait. The world can wait. Whatever is bothering you right now, we will face it together and figure it out one step at a time.\n\nI'm in your corner. Always.`,
      signOff: "Your safe haven"
    },
    {
      id: "let-4",
      sealColor: "#7c3aed",
      title: "Open when you doubt how beautiful you are ✨",
      subtitle: "The truth as I see it every day",
      openWhen: "On days you are being too hard on yourself",
      content: `Dearest Atrayee,\n\nI wish you could see yourself through my eyes for just five seconds. You would never doubt your radiance ever again.\n\nI see your beauty in the quietest, most unguarded moments: when you're laughing so hard your nose crinkles, when you're deeply lost in thought, when you're dancing around the room in oversized pajamas, and when your eyes light up talking about things you love.\n\nYou have a beauty that transcends surfaces—it's in your kindness, your empathy, and the softness you give to people around you. You are breathtaking.`,
      signOff: "Eternally captivated by you"
    },
    {
      id: "let-5",
      sealColor: "#b45309",
      title: "Open for your secret birthday surprise 🎁",
      subtitle: "A little promise from me to you",
      openWhen: "When you are ready to claim your birthday gift",
      content: `Surprise, birthday angel!\n\nBeyond this little digital keepsake, your real birthday surprise is ready. Consider this official confirmation that an entire weekend of pampering, your favorite restaurant, and a special package handpicked just for you is officially on the calendar.\n\nCheck your side table (or ask me for clue #1) whenever you're ready!\n\nHappy Birthday, my love!`,
      signOff: "With all my love and excitement"
    }
  ],
  coupons: [
    {
      id: "coup-1",
      title: "Breakfast in Bed & Artisan Coffee",
      description: "Pancakes or French toast made to your exact liking, fresh berries, and your favorite hot beverage served directly to your pillow.",
      category: "food",
      icon: "coffee",
      isRedeemed: false
    },
    {
      id: "coup-2",
      title: "Full Body Massage & Aromatherapy",
      description: "60-minute relaxing back, shoulder, and foot massage with soothing lavender oil and calm music. Guaranteed zero rush.",
      category: "pampering",
      icon: "sparkles",
      isRedeemed: false
    },
    {
      id: "coup-3",
      title: "You Pick the Movie & Snacks Feat",
      description: "Complete control of the remote control. Any rom-com, thriller, or documentary you want, paired with your favorite takeout.",
      category: "romantic",
      icon: "film",
      isRedeemed: false
    },
    {
      id: "coup-4",
      title: "Win Any Argument 'Get Out of Jail Free' Card",
      description: "Play this card during any friendly debate and I will instantly surrender, agree with your point, and make you tea.",
      category: "romantic",
      icon: "shield-check",
      isRedeemed: false
    },
    {
      id: "coup-5",
      title: "Spontaneous Weekend Getaway Trip",
      description: "Pack a small weekend bag. I plan the entire itinerary, booking, driving, and meals so all you have to do is relax and enjoy.",
      category: "adventure",
      icon: "compass",
      isRedeemed: false
    },
    {
      id: "coup-6",
      title: "Late Night Sweet Tooth Delivery Run",
      description: "No matter what hour or what weather, whenever you crave ice cream, boba, or warm cookies, I will venture out and fetch it.",
      category: "food",
      icon: "heart",
      isRedeemed: false
    }
  ],
  quiz: [
    {
      id: "q-1",
      question: "Where did we have our very first official date?",
      options: ["The Italian Bistro with candlelit tables", "The Cozy Rooftop Coffee Shop", "The Botanical Garden greenhouse", "The seaside ramen counter"],
      correctIndex: 1,
      explanation: "Spot on! We talked for nearly four hours until the barista gently told us they were closing up for the night."
    },
    {
      id: "q-2",
      question: "What is my absolute favorite thing you do without even realizing?",
      options: ["Humming little tunes when you cook", "Holding my pinky finger in the car", "The scrunch of your nose when you giggle", "All of the above (and a thousand more)"],
      correctIndex: 3,
      explanation: "Trick question—because every single thing you do makes me fall in love all over again!"
    },
    {
      id: "q-3",
      question: "If we could teleport anywhere in the world tonight, where would you pick?",
      options: ["A cozy cabin in the snowy mountains with a fireplace", "A seaside villa watching Mediterranean waves", "A quiet cottage surrounded by blooming wildflower fields", "Anywhere, as long as we have good dessert and each other"],
      correctIndex: 3,
      explanation: "Wherever you are is my favorite place on Earth."
    }
  ],
  adoreReasons: [
    { id: 1, text: "The joyful crinkle around your eyes whenever you laugh at something genuinely hilarious.", category: "sweet" },
    { id: 2, text: "How fiercely protective and compassionate you are toward every stray cat and puppy we pass.", category: "sweet" },
    { id: 3, text: "The adorable victory dance you do when your food arrives at the restaurant.", category: "funny" },
    { id: 4, text: "How your hand slides into mine so naturally, like two puzzle pieces made by the same craftsman.", category: "sweet" },
    { id: 5, text: "Your quiet resilience and how deeply you care about the people in your life.", category: "deep" },
    { id: 6, text: "How you always leave the last bite of the tastiest snack for me, even when I know you want it.", category: "sweet" },
    { id: 7, text: "Your infectious enthusiasm when you discover a new song you can't stop listening to.", category: "sweet" },
    { id: 8, text: "The way you steal all the blankets like a master burglar in the middle of the night.", category: "funny" },
    { id: 9, text: "How you make the ordinary grocery shopping feel like our own private little adventure.", category: "deep" },
    { id: 10, text: "The calming reassurance of your voice whenever I've had a stressful day.", category: "deep" },
    { id: 11, text: "How cute you look when you're completely absorbed in reading or focused on a project.", category: "sweet" },
    { id: 12, text: "That no matter what year it is, being with you still gives me the exact same butterflies as our first date.", category: "deep" }
  ]
};
