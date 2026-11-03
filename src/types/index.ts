export interface Memory {
  id: string;
  title: string;
  date: string;
  location: string;
  caption: string;
  imageUrl?: string;
  tag: string;
}

export interface LoveLetter {
  id: string;
  sealColor: string;
  title: string;
  subtitle: string;
  openWhen: string;
  content: string;
  signOff: string;
  isOpened?: boolean;
}

export interface LoveCoupon {
  id: string;
  title: string;
  description: string;
  category: 'romantic' | 'adventure' | 'pampering' | 'food';
  icon: string;
  isRedeemed: boolean;
  redeemedDate?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AdoreReason {
  id: number;
  text: string;
  category: 'sweet' | 'funny' | 'deep';
}

export interface PersonalizationData {
  girlfriendName: string;
  nickname: string;
  boyfriendName: string;
  birthdayDate: string;
  anniversaryDate: string;
  heroKicker: string;
  heroHeadline: string;
  heroMessage: string;
  secretWishMessage: string;
  memories: Memory[];
  letters: LoveLetter[];
  coupons: LoveCoupon[];
  quiz: QuizQuestion[];
  adoreReasons: AdoreReason[];
}
