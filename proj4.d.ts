declare module 'proj4' {
  type Proj4Coordinate = [number, number];
  type Proj4Function = (
    fromProjection: string,
    toProjection: string,
    coordinate: Proj4Coordinate
  ) => Proj4Coordinate;

  const proj4: Proj4Function;
  export default proj4;
}
