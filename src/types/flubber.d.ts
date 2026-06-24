declare module 'flubber' {
  type Point = [number, number]
  type Shape = string | Point[]

  type InterpolateOptions = {
    maxSegmentLength?: number | false
    string?: boolean
  }

  export function interpolate(
    fromShape: Shape,
    toShape: Shape,
    options?: InterpolateOptions,
  ): (progress: number) => string
}
