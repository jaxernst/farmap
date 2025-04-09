import { Effect } from "effect";
import StaticMaps from "staticmaps";
import sharp from "sharp";

export interface MapImageOptions {
  lat: number;
  long: number;
  zoom?: number;
  width?: number;
  height?: number;
}

export const generateMapImage = ({
  lat,
  long,
  zoom = 15,
  width = 150,
  height = 150,
}: MapImageOptions) =>
  Effect.promise(async () => {
    const map = new StaticMaps({
      width,
      height,
      paddingX: 0,
      paddingY: 0,
      tileUrl:
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
      tileSubdomains: ["a", "b", "c", "d"],
      zoomRange: { min: 1, max: 17 },
    });

    // Add a marker at the location
    const coord: [number, number] = [long, lat];
    const marker = {
      coord,
      color: "#4caf50",
      radius: 10,
    } as const;

    map.addCircle(marker);

    // Render the map
    await map.render([long, lat], zoom);

    // Get the buffer
    return map.image.buffer("image/png");
  });

export const generateSocialPreview = ({
  photoBuffer,
  lat,
  long,
}: {
  photoBuffer: Buffer;
  lat: number;
  long: number;
}) =>
  Effect.gen(function* () {
    const mapBuffer = yield* generateMapImage({ lat, long });

    const finalImage = yield* Effect.promise(() =>
      sharp({
        create: {
          width: 1200,
          height: 630,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          { input: photoBuffer, top: 0, left: 0 },
          { input: mapBuffer, top: 20, left: 1030 }, // Position map in top-right
        ])
        .jpeg({ quality: 80 })
        .toBuffer()
    );

    return finalImage;
  });
