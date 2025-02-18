import AbstractProvider, { EndpointArgument, LatLng, ParseArgument, SearchArgument, SearchResult } from './provider';
export interface RequestResult {
    results: RawResult[];
}
export interface RawResult {
    annotations: {
        DMS: {
            lat: string;
            lng: string;
        };
        MGRS: string;
        Maidenhead: string;
        Mercator: {
            x: number;
            y: number;
        };
        OSM: {
            edit_url: string;
            note_url: string;
            url: string;
        };
        UN_M49: {
            regions: {
                [key: string]: string;
            };
            statistical_groupings: string[];
        };
        callingcode: number;
        currency: {
            alternate_symbols: string[];
            decimal_mark: string;
            html_entity: string;
            iso_code: string;
            iso_numeric: string;
            name: string;
            smallest_denomination: number;
            subunit: string;
            subunit_to_unit: number;
            symbol: string;
            symbol_first: number;
            thousands_separator: string;
        };
        flag: string;
        geohash: string;
        qibla: number;
        roadinfo: {
            drive_on: string;
            road: string;
            road_type: string;
            speed_in: string;
        };
        sun: {
            rise: {
                apparent: number;
                astronomical: number;
                civil: number;
                nautical: number;
            };
            set: {
                apparent: number;
                astronomical: number;
                civil: number;
                nautical: number;
            };
        };
        timezone: {
            name: string;
            now_in_dst: number;
            offset_sec: number;
            offset_string: string;
            short_name: string;
        };
        what3words: {
            words: string;
        };
    };
    bounds: {
        northeast: LatLng;
        southwest: LatLng;
    };
    formatted: string;
    geometry: LatLng;
}
export default class OpenCageProvider extends AbstractProvider<RequestResult, RawResult> {
    searchUrl: string;
    endpoint({ query }: EndpointArgument): string;
    parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[];
    search(options: SearchArgument): Promise<SearchResult<RawResult>[]>;
}
