import { z } from 'astro/zod';

export const imageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
  caption: z.string().optional(),
});

export const hotspotContentBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    content: z.string().min(1),
  }),

  z.object({
    type: z.literal('image'),
    image: imageSchema,
  }),
]);

// The hotspot frame must always stay fully inside the image. width/height
// are bounded to [MIN_SIZE, 100], x/y to [0, 100], and the two refine()
// checks below reject any combination that would still let the frame
// extend past the right or bottom edge. Keep MIN_SIZE in sync with the
// equivalent constant in hotspot-frame-field-type.js.
const HOTSPOT_MIN_SIZE = 3;

export const hotspotFrameSchema = z
  .object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),

    width: z.number().min(HOTSPOT_MIN_SIZE).max(100),
    height: z.number().min(HOTSPOT_MIN_SIZE).max(100),
  })
  .refine((frame) => frame.x + frame.width <= 100, {
    message: 'Hotspot frame extends past the right edge of the image (x + width > 100).',
    path: ['width'],
  })
  .refine((frame) => frame.y + frame.height <= 100, {
    message: 'Hotspot frame extends past the bottom edge of the image (y + height > 100).',
    path: ['height'],
  });

export const hotspotBlockSchema = z.object({
  id: z.string().min(1),

  type: z.literal('hotspots'),

  title: z.string().min(1),

  frame: hotspotFrameSchema,

  side: z.enum(['left', 'right']).default('right'),

  content: z.array(hotspotContentBlockSchema).min(1),
});

export const textBlockSchema = z.object({
  type: z.literal('texts'),

  text: z.string().min(1),
});

export const scrollerBlockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  hotspotBlockSchema,
]);

export const scrollerSchema = z.object({
  scroller_id: z.string().min(1),

  title: z.string().min(1),

  image: z.string().min(1),

  blocks: z.array(scrollerBlockSchema).min(1),
});

export const pageSchema = z.object({
  title: z.string().min(1),

  content: z.string().optional(),

  scroller: z.string().min(1).optional(),
  
  image: imageSchema,
});

export type Image = z.infer<typeof imageSchema>;
export type HotspotContentBlock =
  z.infer<typeof hotspotContentBlockSchema>;
export type HotspotFrame =
  z.infer<typeof hotspotFrameSchema>;
export type HotspotBlock =
  z.infer<typeof hotspotBlockSchema>;
export type TextBlock =
  z.infer<typeof textBlockSchema>;
export type ScrollerBlock =
  z.infer<typeof scrollerBlockSchema>;
export type Scroller =
  z.infer<typeof scrollerSchema>;
export type Page =
  z.infer<typeof pageSchema>;