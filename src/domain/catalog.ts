export const destinationIds = ['madeira', 'iceland', 'dolomites', 'dilijan'] as const;
export type DestinationId = (typeof destinationIds)[number];
export const categories = ['Landscape', 'Culture', 'Coast', 'Town'] as const;
export type Category = (typeof categories)[number];
export interface Place {
  id: string;
  name: string;
  category: Category;
  coordinates: [number, number];
  minutes: number;
  allowanceCents: number;
  description: string;
}
export interface Destination {
  id: DestinationId;
  name: string;
  country: string;
  region: string;
  headline: string;
  short: string;
  intro: string;
  chapter: string;
  coordinates: [number, number];
  tags: string[];
  accent: string;
  imagePosition: string;
  days: number;
  defaults: { lodgingCents: number; foodCents: number; transportCents: number; limitCents: number };
  places: Place[];
  source: string;
}

export const destinations: Destination[] = [
  {
    id: 'madeira',
    name: 'Madeira',
    country: 'Portugal',
    region: 'Atlantic island',
    headline: 'An island.\nA thousand ways to feel small.',
    short: 'Where the mountains meet the Atlantic.',
    intro:
      'Follow a volcanic coastline into a world of laurel forests, little seaside towns and horizons that keep going. Leave a little space between the stops. That is where the island happens.',
    chapter: 'The ocean chapter',
    coordinates: [-16.95, 32.75],
    tags: ['Coast', 'Forest', 'Slow days'],
    accent: '#d5b591',
    imagePosition: '50% 50%',
    days: 3,
    defaults: { lodgingCents: 11000, foodCents: 3500, transportCents: 4500, limitCents: 80000 },
    source: 'https://www.visitmadeira.com/en/',
    places: [
      {
        id: 'funchal',
        name: 'Funchal old town',
        category: 'Town',
        coordinates: [-16.902, 32.648],
        minutes: 120,
        allowanceCents: 1500,
        description: 'An unhurried first chapter among the old town streets and waterfront.',
      },
      {
        id: 'cabo-girao',
        name: 'Cabo Girão',
        category: 'Coast',
        coordinates: [-17.005, 32.656],
        minutes: 60,
        allowanceCents: 1000,
        description: 'A coastal viewpoint with the Atlantic filling the frame.',
      },
      {
        id: 'fanal',
        name: 'Fanal forest',
        category: 'Landscape',
        coordinates: [-17.142, 32.812],
        minutes: 120,
        allowanceCents: 1000,
        description: 'A pause among the old laurel trees of the island’s northwest.',
      },
      {
        id: 'porto-moniz',
        name: 'Porto Moniz',
        category: 'Town',
        coordinates: [-17.167, 32.868],
        minutes: 150,
        allowanceCents: 2000,
        description: 'Volcanic rock, ocean views and a slow afternoon in town.',
      },
      {
        id: 'sao-lourenco',
        name: 'Ponta de São Lourenço',
        category: 'Coast',
        coordinates: [-16.699, 32.744],
        minutes: 180,
        allowanceCents: 1500,
        description: 'The island’s eastern peninsula, where rock and water share the horizon.',
      },
      {
        id: 'seixal',
        name: 'Seixal',
        category: 'Coast',
        coordinates: [-17.105, 32.825],
        minutes: 90,
        allowanceCents: 1000,
        description: 'A north-coast village framed by green slopes and dark volcanic sand.',
      },
      {
        id: 'santana',
        name: 'Santana',
        category: 'Culture',
        coordinates: [-16.881, 32.805],
        minutes: 90,
        allowanceCents: 1000,
        description: 'A cultural detour into the northeast of the island.',
      },
    ],
  },
  {
    id: 'iceland',
    name: 'South Iceland',
    country: 'Iceland',
    region: 'South coast',
    headline: 'Out here,\nthe elements lead.',
    short: 'Waterfalls. Black sand. Wide-open space.',
    intro:
      'Water moves through this landscape in a hundred different ways. Trace a line along the south coast, from waterfalls to black-sand shores, with time to stop when the light changes.',
    chapter: 'The wild chapter',
    coordinates: [-19.55, 63.55],
    tags: ['Waterfalls', 'Coast', 'Road trip'],
    accent: '#9baea3',
    imagePosition: '50% 55%',
    days: 3,
    defaults: { lodgingCents: 17000, foodCents: 5000, transportCents: 8000, limitCents: 120000 },
    source: 'https://www.visiticeland.com/the-regions/the-south/',
    places: [
      {
        id: 'seljalandsfoss',
        name: 'Seljalandsfoss',
        category: 'Landscape',
        coordinates: [-19.989, 63.616],
        minutes: 90,
        allowanceCents: 1500,
        description: 'A first waterfall stop near the western end of this coastal collection.',
      },
      {
        id: 'skogafoss',
        name: 'Skógafoss',
        category: 'Landscape',
        coordinates: [-19.511, 63.532],
        minutes: 120,
        allowanceCents: 1500,
        description: 'The broad waterfall that gives this chapter its cover image.',
      },
      {
        id: 'skogar',
        name: 'Skógar museum',
        category: 'Culture',
        coordinates: [-19.492, 63.527],
        minutes: 120,
        allowanceCents: 2500,
        description: 'Make room for a cultural stop in the village of Skógar.',
      },
      {
        id: 'dyrholaey',
        name: 'Dyrhólaey',
        category: 'Coast',
        coordinates: [-19.131, 63.399],
        minutes: 90,
        allowanceCents: 1500,
        description: 'A coastal headland and a different perspective on the south shore.',
      },
      {
        id: 'vik',
        name: 'Vík',
        category: 'Town',
        coordinates: [-19.009, 63.419],
        minutes: 120,
        allowanceCents: 2000,
        description: 'A village chapter between the mountains and the Atlantic.',
      },
      {
        id: 'reynisfjara',
        name: 'Reynisfjara',
        category: 'Coast',
        coordinates: [-19.046, 63.404],
        minutes: 60,
        allowanceCents: 1500,
        description:
          'A black-sand coast. Consult official visitor guidance and local restrictions before visiting.',
      },
      {
        id: 'kvernufoss',
        name: 'Kvernufoss',
        category: 'Landscape',
        coordinates: [-19.479, 63.528],
        minutes: 90,
        allowanceCents: 1500,
        description: 'Another waterfall chapter in the landscape around Skógar.',
      },
    ],
  },
  {
    id: 'dolomites',
    name: 'The Dolomites',
    country: 'Italy',
    region: 'Italian Alps',
    headline: 'A little closer\nto the sky.',
    short: 'Pale peaks, turquoise lakes and mountain air.',
    intro:
      'Build a few days around a lake, a mountain town and a road that makes you put the camera down. This is a collection of places to connect at your own pace, with plenty of room to look up.',
    chapter: 'The high chapter',
    coordinates: [12.15, 46.65],
    tags: ['Mountains', 'Lakes', 'Road trip'],
    accent: '#a8c4bb',
    imagePosition: '50% 45%',
    days: 3,
    defaults: { lodgingCents: 14000, foodCents: 4500, transportCents: 5500, limitCents: 100000 },
    source: 'https://www.dolomiti.org/en/',
    places: [
      {
        id: 'braies',
        name: 'Lago di Braies',
        category: 'Landscape',
        coordinates: [12.085, 46.694],
        minutes: 150,
        allowanceCents: 2000,
        description: 'The turquoise lake on the cover of this alpine chapter.',
      },
      {
        id: 'dobbiaco',
        name: 'Dobbiaco',
        category: 'Town',
        coordinates: [12.222, 46.735],
        minutes: 90,
        allowanceCents: 1500,
        description: 'An easy town chapter in the northern Dolomites.',
      },
      {
        id: 'misurina',
        name: 'Lake Misurina',
        category: 'Landscape',
        coordinates: [12.253, 46.581],
        minutes: 120,
        allowanceCents: 1500,
        description: 'A lakeside pause surrounded by the mountain landscape.',
      },
      {
        id: 'cortina',
        name: 'Cortina d’Ampezzo',
        category: 'Town',
        coordinates: [12.135, 46.54],
        minutes: 120,
        allowanceCents: 2500,
        description: 'A mountain-town afternoon to balance the open landscapes.',
      },
      {
        id: 'giau',
        name: 'Passo Giau',
        category: 'Landscape',
        coordinates: [12.05, 46.483],
        minutes: 90,
        allowanceCents: 1500,
        description: 'A mountain-pass viewpoint for the open-space part of your plan.',
      },
      {
        id: 'tre-cime',
        name: 'Tre Cime area',
        category: 'Landscape',
        coordinates: [12.306, 46.618],
        minutes: 240,
        allowanceCents: 3000,
        description:
          'A longer mountain chapter. Check official access, conditions and reservations when planning.',
      },
      {
        id: 'dobbiaco-lake',
        name: 'Lake Dobbiaco',
        category: 'Landscape',
        coordinates: [12.219, 46.703],
        minutes: 90,
        allowanceCents: 1000,
        description: 'One more lakeside pause before turning the page.',
      },
    ],
  },
  {
    id: 'dilijan',
    name: 'Dilijan',
    country: 'Armenia',
    region: 'Tavush forests',
    headline: 'Follow the road\ninto the green.',
    short: 'Forest roads and stories carved in stone.',
    intro:
      'The forest has a way of slowing a day down. Connect Dilijan’s town streets, quiet lakes and medieval monasteries into a small journey with a generous amount of green in between.',
    chapter: 'The quiet chapter',
    coordinates: [44.86, 40.74],
    tags: ['Forest', 'Culture', 'Slow days'],
    accent: '#b6bd92',
    imagePosition: '50% 48%',
    days: 3,
    defaults: { lodgingCents: 6500, foodCents: 2200, transportCents: 3000, limitCents: 55000 },
    source: 'https://armenia.travel/articles/spending-a-day-in-dilijan-armenia/',
    places: [
      {
        id: 'old-dilijan',
        name: 'Old Dilijan',
        category: 'Town',
        coordinates: [44.865, 40.738],
        minutes: 120,
        allowanceCents: 1200,
        description: 'Start with a slow walk through the town’s old-street quarter.',
      },
      {
        id: 'dilijan-lake',
        name: 'Dilijan town lake',
        category: 'Landscape',
        coordinates: [44.856, 40.74],
        minutes: 60,
        allowanceCents: 500,
        description: 'An open-air pause within the town before the forest chapters.',
      },
      {
        id: 'haghartsin',
        name: 'Haghartsin',
        category: 'Culture',
        coordinates: [44.891, 40.801],
        minutes: 120,
        allowanceCents: 1000,
        description: 'A medieval monastery complex held in a fold of forest.',
      },
      {
        id: 'parz',
        name: 'Parz Lake',
        category: 'Landscape',
        coordinates: [44.962, 40.751],
        minutes: 150,
        allowanceCents: 1500,
        description: 'A lake-and-forest afternoon east of Dilijan.',
      },
      {
        id: 'goshavank',
        name: 'Goshavank',
        category: 'Culture',
        coordinates: [44.996, 40.729],
        minutes: 120,
        allowanceCents: 1000,
        description: 'A monastery chapter in the village of Gosh.',
      },
      {
        id: 'jukhtak',
        name: 'Jukhtak monastery',
        category: 'Culture',
        coordinates: [44.809, 40.755],
        minutes: 120,
        allowanceCents: 1000,
        description: 'A quieter cultural stop on the western side of Dilijan.',
      },
      {
        id: 'matosavank',
        name: 'Matosavank',
        category: 'Culture',
        coordinates: [44.804, 40.752],
        minutes: 120,
        allowanceCents: 1000,
        description: 'Stone architecture and forest, a little west of the town.',
      },
    ],
  },
];
export function destinationById(id: string | undefined) {
  return destinations.find((d) => d.id === id);
}
export function placeById(destinationId: DestinationId, id: string) {
  return destinationById(destinationId)?.places.find((p) => p.id === id);
}
export const imagePath = (id: DestinationId, width: 800 | 1800 = 800) =>
  `${import.meta.env.BASE_URL}images/${id}-${width}.webp`;
export const photoAlt: Record<DestinationId, string> = {
  madeira: 'Pink sunrise over the volcanic cliffs of Ponta de São Lourenço in Madeira',
  iceland: 'Skógafoss waterfall flowing through a green valley in southern Iceland',
  dolomites: 'Turquoise Lago di Braies surrounded by forest and steep Dolomite peaks',
  dilijan: 'Mist drifting across Dilijan and its forested mountain slopes in Armenia',
};
