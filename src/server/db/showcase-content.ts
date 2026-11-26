import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";

/** Legacy caption left by early seeds — used only for idempotent cleanup. */
export const LEGACY_PLACEHOLDER_CAPTION =
  "Placeholder — replace with a site photo.";

export const HERO_IMAGE = "/showcase/exterior-day.jpg";

export const SHOWCASE_DESCRIPTION =
  "A student hostel in Obuasi made for university life — a place that feels like home, with a kitchen, study room, lounge, laundry, and Wi-Fi throughout. Look around the rooms online, then apply when you’re ready.";

export const HOME_HERO_PITCH =
  "Skip the stress of unnecessary trips across town. Browse real photos of our rooms and facilities right here, check live bed availability, and reserve your spot online in minutes.";

export const showcaseMedia = [
  {
    kind: "EXTERIOR" as const,
    title: "Front, day",
    description: null,
    url: "/showcase/exterior-day.jpg",
    caption: "The front of Victorious Residence in daylight.",
    sortOrder: 0,
  },
  {
    kind: "EXTERIOR" as const,
    title: "Front, night",
    description: null,
    url: "/showcase/exterior-night.jpg",
    caption: "The hostel front lit in the evening.",
    sortOrder: 1,
  },
  {
    kind: "EXTERIOR" as const,
    title: "Entrance",
    description: null,
    url: "/showcase/exterior-entrance.jpg",
    caption: "Main entrance from the street.",
    sortOrder: 2,
  },
  {
    kind: "FACILITY" as const,
    title: "Shared kitchen",
    description:
      "A shared kitchen with new worktops, a cooker, and space to store food. Residents prepare their own meals.",
    url: "/showcase/facility-kitchen.jpg",
    caption: "Shared kitchen for everyday cooking.",
    sortOrder: 3,
  },
  {
    kind: "FACILITY" as const,
    title: "Study room",
    description:
      "A quiet study room with new desks and chairs for reading and assignments.",
    url: "/showcase/facility-study.jpg",
    caption: "Quiet desks for reading and assignments.",
    sortOrder: 4,
  },
  {
    kind: "FACILITY" as const,
    title: "Lounge",
    description:
      "A bright lounge with seating for residents to sit together away from the bedrooms.",
    url: "/showcase/facility-lounge.jpg",
    caption: "Lounge seating away from the bedrooms.",
    sortOrder: 5,
  },
  {
    kind: "FACILITY" as const,
    title: "Laundry",
    description:
      "A laundry room with modern machines for everyday clothes.",
    url: "/showcase/facility-laundry.jpg",
    caption: "Laundry room for everyday clothes.",
    sortOrder: 6,
  },
  {
    kind: "FACILITY" as const,
    title: "Reception",
    description:
      "A reception where visitors are welcomed and residents check in, rather than walking straight into the rooms.",
    url: "/showcase/facility-reception.jpg",
    caption: "Reception for check-in and visitors.",
    sortOrder: 7,
  },
];

export const showcaseRoomTypes = [
  {
    name: "Executive Single",
    capacity: 1,
    pricePerBed: "2500.00",
    description:
      "A private room with one bed, a wardrobe, a writing desk, and a window. The bathroom is private to the room. The kitchen, study room, lounge, laundry, and reception are shared. Wi-Fi covers the whole hostel. Suited to a resident who wants a quiet space of their own.",
    amenities: [
      "Private bathroom",
      "Wardrobe",
      "Writing desk",
      "Window",
      "Wi-Fi",
    ],
    coverImageUrl: "/showcase/room-single-bed.jpg",
    sortOrder: 1,
    roomCount: 2,
    labelPrefix: "S",
    angles: [
      {
        url: "/showcase/room-single-bed.jpg",
        caption: "Bed and wardrobe in the executive single.",
      },
      {
        url: "/showcase/room-single-desk.jpg",
        caption: "Writing desk by the window.",
      },
      {
        url: "/showcase/room-single-bath.jpg",
        caption: "Private bathroom for the room.",
      },
    ],
  },
  {
    name: "Standard 2-in-1",
    capacity: 2,
    pricePerBed: "1800.00",
    description:
      "A shared room with two single beds, wardrobes, and a desk by the window. Residents share the room bathroom and the hostel kitchen, study room, lounge, and laundry. Wi-Fi works throughout the hostel. A practical choice when you want company without a four-bed room.",
    amenities: [
      "Two single beds",
      "Shared bathroom",
      "Wardrobes",
      "Desk",
      "Wi-Fi",
    ],
    coverImageUrl: "/showcase/room-double-beds.jpg",
    sortOrder: 2,
    roomCount: 4,
    labelPrefix: "D",
    angles: [
      {
        url: "/showcase/room-double-beds.jpg",
        caption: "Two single beds in the standard room.",
      },
      {
        url: "/showcase/room-double-window.jpg",
        caption: "Window and desk shared by the room.",
      },
      {
        url: "/showcase/room-double-door.jpg",
        caption: "View from the doorway.",
      },
    ],
  },
  {
    name: "Economy 4-in-1",
    capacity: 4,
    pricePerBed: "1200.00",
    description:
      "A shared room with four bed spaces, personal storage, and a window for daylight. The bathroom is shared by the room. Kitchen, study room, lounge, laundry, and reception are shared across the residence. Wi-Fi works throughout the hostel. This is the lowest price per bed.",
    amenities: [
      "Four bed spaces",
      "Shared bathroom",
      "Personal storage",
      "Window",
      "Wi-Fi",
    ],
    coverImageUrl: "/showcase/room-quad-beds.jpg",
    sortOrder: 3,
    roomCount: 3,
    labelPrefix: "Q",
    angles: [
      {
        url: "/showcase/room-quad-beds.jpg",
        caption: "Four bed spaces in the economy room.",
      },
      {
        url: "/showcase/room-quad-window.jpg",
        caption: "Daylight from the window.",
      },
      {
        url: "/showcase/room-quad-storage.jpg",
        caption: "Personal storage for each bed space.",
      },
    ],
  },
] as const;

/** @deprecated Use CONTACT_PHONE — kept for older imports. */
export const PLACEHOLDER_PHONE = CONTACT_PHONE;

/** @deprecated Use CONTACT_EMAIL — kept for older imports. */
export const PLACEHOLDER_EMAIL = CONTACT_EMAIL;

/** @deprecated Use LEGACY_PLACEHOLDER_CAPTION for migrations only. */
export const PLACEHOLDER_CAPTION = LEGACY_PLACEHOLDER_CAPTION;

export function isLegacyPlaceholderCaption(
  caption: string | null | undefined,
): boolean {
  if (!caption) {
    return false;
  }
  return caption.includes(LEGACY_PLACEHOLDER_CAPTION);
}
