import { NailFinish, NailDesign, NailShape } from '../types';

export interface ColorPaletteItem {
  hex: string;
  name: string;
  nameFa: string;
  category: string;
  categoryFa: string;
  recommendedFinish?: NailFinish;
}

export const POLISH_PALETTES: ColorPaletteItem[] = [
  // Nude & Natural
  { hex: '#E8C5B8', name: 'Ballet Slippers', nameFa: 'کرم صورتی نود', category: 'nude', categoryFa: 'نود و طبیعی', recommendedFinish: 'glossy' },
  { hex: '#D7A99C', name: 'Dusty Rose', nameFa: 'رز کالباسی', category: 'nude', categoryFa: 'نود و طبیعی', recommendedFinish: 'glossy' },
  { hex: '#C29B88', name: 'Warm Almond', nameFa: 'بادامی گرم', category: 'nude', categoryFa: 'نود و طبیعی', recommendedFinish: 'matte' },
  { hex: '#E5D0C5', name: 'Milky White', nameFa: 'شیری ماتیکی', category: 'nude', categoryFa: 'نود و طبیعی', recommendedFinish: 'jelly' },
  { hex: '#A88272', name: 'Muted Taupe', nameFa: 'تاپ دودی', category: 'nude', categoryFa: 'نود و طبیعی', recommendedFinish: 'glossy' },
  { hex: '#F3E5DC', name: 'Clean Linen', nameFa: 'کتان روشن', category: 'nude', categoryFa: 'نود و طبیعی', recommendedFinish: 'pearl' },

  // Classic Reds & Berries
  { hex: '#B31312', name: 'Classic Hollywood Red', nameFa: 'قرمز کلاسیک هالیوودی', category: 'red', categoryFa: 'قرمز و زرشکی', recommendedFinish: 'glossy' },
  { hex: '#58111A', name: 'Deep Burgundy Wine', nameFa: 'زرشکی شرابی عمیق', category: 'red', categoryFa: 'قرمز و زرشکی', recommendedFinish: 'glossy' },
  { hex: '#800020', name: 'Rich Bordeaux', nameFa: 'بورگاندی شاهانه', category: 'red', categoryFa: 'قرمز و زرشکی', recommendedFinish: 'matte' },
  { hex: '#E63946', name: 'Cherry Ruby', nameFa: 'یاقوتی آلبالویی', category: 'red', categoryFa: 'قرمز و زرشکی', recommendedFinish: 'glossy' },
  { hex: '#E76F51', name: 'Coral Sunset', nameFa: 'مرجانی غروب', category: 'red', categoryFa: 'قرمز و زرشکی', recommendedFinish: 'glossy' },

  // Trends & Modern
  { hex: '#F9F5F0', name: 'Glazed Donut', nameFa: 'گلیزد دونات مرواریدی', category: 'trend', categoryFa: 'ترند روز', recommendedFinish: 'pearl' },
  { hex: '#B5C99A', name: 'Matcha Latte', nameFa: 'سبز ماچا لاته', category: 'trend', categoryFa: 'ترند روز', recommendedFinish: 'glossy' },
  { hex: '#FEE440', name: 'Butter Yellow', nameFa: 'کَره‌ای روشن', category: 'trend', categoryFa: 'ترند روز', recommendedFinish: 'glossy' },
  { hex: '#B8C0FF', name: 'Periwinkle Dream', nameFa: 'آبی یاسی رویایی', category: 'trend', categoryFa: 'ترند روز', recommendedFinish: 'jelly' },
  { hex: '#CDB4DB', name: 'Soft Lilac', nameFa: 'اسطوخودوس ملایم', category: 'trend', categoryFa: 'ترند روز', recommendedFinish: 'matte' },

  // Dark & Luxury
  { hex: '#1C1917', name: 'Onyx Midnight', nameFa: 'مشکی شبق براق', category: 'dark', categoryFa: 'تیره و لوکس', recommendedFinish: 'glossy' },
  { hex: '#1E293B', name: 'Navy Royal', nameFa: 'سرمه‌ای اقیانوسی', category: 'dark', categoryFa: 'تیره و لوکس', recommendedFinish: 'glossy' },
  { hex: '#1B4332', name: 'Emerald Forest', nameFa: 'زمردی تیره درباری', category: 'dark', categoryFa: 'تیره و لوکس', recommendedFinish: 'metallic' },
  { hex: '#3B1824', name: 'Dark Cherry Cola', nameFa: 'چری کولای سوخته', category: 'dark', categoryFa: 'تیره و لوکس', recommendedFinish: 'jelly' },
  { hex: '#362419', name: 'Espresso Bean', nameFa: 'قهوه‌ای اسپرسو', category: 'dark', categoryFa: 'تیره و لوکس', recommendedFinish: 'matte' },

  // Shimmer, Metallics & Glitter
  { hex: '#D4AF37', name: 'Imperial Gold', nameFa: 'طلایی سلطنتی', category: 'metallic', categoryFa: 'متالیک و اکلیلی', recommendedFinish: 'metallic' },
  { hex: '#B76E79', name: 'Rose Gold Chrome', nameFa: 'رزگلد متالیک', category: 'metallic', categoryFa: 'متالیک و اکلیلی', recommendedFinish: 'metallic' },
  { hex: '#E0E1DD', name: 'Platinum Silver', nameFa: 'نقره‌ای پلاتینیوم', category: 'metallic', categoryFa: 'متالیک و اکلیلی', recommendedFinish: 'metallic' },
  { hex: '#FFB703', name: 'Stardust Sparkle', nameFa: 'اکلیل درخشان ستاره‌ای', category: 'metallic', categoryFa: 'متالیک و اکلیلی', recommendedFinish: 'shimmer' },
];

export interface FinishOption {
  id: NailFinish;
  name: string;
  nameFa: string;
  descriptionFa: string;
  specularPower: number; // For canvas highlight
  diffuseAlpha: number;
}

export const FINISH_OPTIONS: FinishOption[] = [
  {
    id: 'glossy',
    name: 'Gel Gloss',
    nameFa: 'ژل براق و آینه‌ای',
    descriptionFa: 'درخشش فوق‌العاده شیشه‌ای مانند ژلیش سالنی با انعکاس نور خطی',
    specularPower: 0.95,
    diffuseAlpha: 0.95,
  },
  {
    id: 'matte',
    name: 'Velvet Matte',
    nameFa: 'مات مخملی',
    descriptionFa: 'پوشش مخملی مات بدون بازتاب مستقیم نور با سایه‌های نرم',
    specularPower: 0.1,
    diffuseAlpha: 0.98,
  },
  {
    id: 'metallic',
    name: 'Liquid Chrome',
    nameFa: 'کروم و فلزی',
    descriptionFa: 'انعکاس آینه‌ای فلزی متالیک با بازتاب عمیق نور محیطی',
    specularPower: 0.9,
    diffuseAlpha: 0.92,
  },
  {
    id: 'shimmer',
    name: 'Diamond Shimmer',
    nameFa: 'اکلیلی و شاین',
    descriptionFa: 'ذرات میکروکریستال درخشان با برق چشمک‌زن زیر تابش نور',
    specularPower: 0.85,
    diffuseAlpha: 0.9,
  },
  {
    id: 'jelly',
    name: 'Glass Jelly',
    nameFa: 'ژله‌ای آب‌نباتی',
    descriptionFa: 'جلوه شیشه‌ای ترند کره‌ای با عمق شفاف و براقیت آبدار',
    specularPower: 0.88,
    diffuseAlpha: 0.75,
  },
  {
    id: 'pearl',
    name: 'Glazed Pearl',
    nameFa: 'صدفی ابریشمی',
    descriptionFa: 'شید هفت‌رنگ صدف طبیعی با درخشش ملایم مروارید',
    specularPower: 0.7,
    diffuseAlpha: 0.93,
  },
];

export interface DesignOption {
  id: NailDesign;
  name: string;
  nameFa: string;
  descriptionFa: string;
  requiresSecondaryColor?: boolean;
}

export const DESIGN_OPTIONS: DesignOption[] = [
  {
    id: 'solid',
    name: 'Solid Color',
    nameFa: 'تک‌رنگ یکدست',
    descriptionFa: 'پوشش کامل و بی‌نقص با بافت و برق واقع‌گرایانه',
  },
  {
    id: 'french',
    name: 'Classic French',
    nameFa: 'فرنچ کلاسیک',
    descriptionFa: 'پایه نود/صورتی ملایم با نوک سفید یا رنگی منحنی',
    requiresSecondaryColor: true,
  },
  {
    id: 'micro_french',
    name: 'Micro French',
    nameFa: 'میکرو فرنچ ظریف',
    descriptionFa: 'خط بسیار باریک و مینیمال روی لبه بالایی ناخن',
    requiresSecondaryColor: true,
  },
  {
    id: 'ombre',
    name: 'Baby Boomer / Ombré',
    nameFa: 'آمبره محو (بیبی بومر)',
    descriptionFa: 'محو شدن تدریجی و لطیف دو رنگ در امتداد انحنای ناخن',
    requiresSecondaryColor: true,
  },
  {
    id: 'glazed_donut',
    name: 'Glazed Donut',
    nameFa: 'کروم مرواریدی هِیلی',
    descriptionFa: 'لایه بازتابش نوری ابریشمی روی پایه رنگ انتخابی',
  },
  {
    id: 'marble',
    name: 'Quartz Marble',
    nameFa: 'ماربل مرمر طبیعی',
    descriptionFa: 'رگه‌های محو سنگی و طلایی شیک روی سطح ناخن',
    requiresSecondaryColor: true,
  },
  {
    id: 'minimal_gold',
    name: 'Minimal Gold Foil',
    nameFa: 'خطوط مینیمال ورق طلا',
    descriptionFa: 'نوارهای متالیک طلایی و اشکال ژئومتریک مدرن',
    requiresSecondaryColor: true,
  },
  {
    id: 'cat_eye',
    name: 'Velvet Cat Eye',
    nameFa: 'چشم‌گربه‌ای مگنتی',
    descriptionFa: 'نوار نوری درخشان خطی که با زاویه نور حرکت می‌کند',
    requiresSecondaryColor: true,
  },
  {
    id: 'polka_dot',
    name: 'Polka Dots',
    nameFa: 'خال‌خال‌های فانتزی',
    descriptionFa: 'نقاط منظم و ظریف تزئینی روی بستر ناخن',
    requiresSecondaryColor: true,
  },
];

export interface ShapeOption {
  id: NailShape | 'natural';
  name: string;
  nameFa: string;
  descriptionFa: string;
}

export const SHAPE_OPTIONS: ShapeOption[] = [
  {
    id: 'natural',
    name: 'Natural Hand Shape',
    nameFa: 'فرم طبیعی دست',
    descriptionFa: 'انطباق ۱۰۰٪ روی کادر و لبه آزاد واقعی ناخن در تصویر',
  },
  {
    id: 'almond',
    name: 'Almond',
    nameFa: 'بادامی سالنی',
    descriptionFa: 'دیواره‌های باریک‌شونده با نوک گرد ظریف؛ انگشتان را بلندتر و کشیده‌تر نشان می‌دهد',
  },
  {
    id: 'squoval',
    name: 'Squoval',
    nameFa: 'اسکووال (مربعی نرم)',
    descriptionFa: 'محبوب‌ترین فرم مدرن؛ تلفیق لبه مربعی با گوشه‌های ملایم و هلالی',
  },
  {
    id: 'square',
    name: 'Square',
    nameFa: 'مربعی کلاسیک',
    descriptionFa: 'لبه آزاد کاملاً صاف و افقی با لبه‌های جانبی موازی و گوشه‌های راست',
  },
  {
    id: 'coffin',
    name: 'Coffin / Ballerina',
    nameFa: 'گلدانی (کافین)',
    descriptionFa: 'دیواره‌های زاویه‌دار به سمت نوک با لبه بالایی کات‌خورده و صاف',
  },
  {
    id: 'oval',
    name: 'Oval',
    nameFa: 'بیضی کلاسیک',
    descriptionFa: 'قوس کامل و هماهنگ در امتداد انحنای کوتیکول برای دست‌های متناسب',
  },
  {
    id: 'stiletto',
    name: 'Stiletto',
    nameFa: 'استیلتو (نوک‌تیز)',
    descriptionFa: 'فرم کشیده و نوک‌تیز جسورانه با امتداد باریک و جلوه اکستنشن بالا',
  },
  {
    id: 'round',
    name: 'Round',
    nameFa: 'گرد طبیعی',
    descriptionFa: 'لبه آزاد منحنی و بدون زاویه تیز، ایده‌آل برای ناخن‌های کوتاه‌تر',
  },
];

