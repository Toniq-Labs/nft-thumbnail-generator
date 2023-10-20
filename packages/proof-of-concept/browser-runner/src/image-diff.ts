import {assertDefined} from 'run-time-assertions';
import sharp, {Sharp} from 'sharp';

/**
 * Sharp currently does not have built-in image comparison. There's a feature request, and there
 * have been some proposed solutions. This function is derived from those.
 *
 * See https://github.com/lovell/sharp/issues/2067#issuecomment-1772697911
 */
export async function compareImages(a: Sharp, b: Sharp, threshold = 0.15): Promise<number> {
    sharp.cache(false);
    const rawBaseline = await a.ensureAlpha().raw().toBuffer();

    let diffPixels = 0;
    const rawComparison = await b.raw().toBuffer();

    if (rawBaseline.equals(rawComparison)) {
        /** No need to check further if the buffers are exactly equal. */
        return 0;
    } else {
        const metadata = await b.metadata();
        assertDefined(metadata.channels);

        for (let i = 0; i < rawBaseline.length; i += metadata.channels) {
            if (metadata.channels === 4 && rawComparison[i + 3] === 0 && rawBaseline[i + 3] === 0) {
                /** Skip fully transparent pixels. */
                continue;
            } else if (
                metadata.channels === 4 &&
                (rawComparison[i + 3] === 0 || rawBaseline[i + 3] === 0)
            ) {
                /**
                 * If one image's pixel is fully transparent, then only compare threshold of alpha
                 * channel.
                 */
                if (Math.abs(rawComparison[i + 3]! - rawBaseline[i + 3]!) > 255 * threshold) {
                    diffPixels++;
                }
            } else {
                if (
                    Math.abs(rawComparison[i]! - rawBaseline[i]!) +
                        Math.abs(rawComparison[i + 1]! - rawBaseline[i + 1]!) +
                        Math.abs(rawComparison[i + 2]! - rawBaseline[i + 2]!) +
                        Math.abs(rawComparison[i + 3]! - rawBaseline[i + 3]!) >
                    255 * threshold
                ) {
                    diffPixels++;
                }
            }
            /**
             * For more useful calculations of color distances/thresholds, see:
             * https://www.npmjs.com/package/d3-color
             * https://www.npmjs.com/package/d3-color-difference
             */
        }
    }

    return diffPixels;
}
