
export type FormatterItems = Array<FormatterItem | FormatterItem[]>;
export type FormatterItem = { url: string, request: RequestInit, contentId?: number | undefined }
export type ReadResult = Array<Response | Response[]>;

export interface IBatchFormatter {
    readonly contentType: string;
    read(items: FormatterItems, body: string, response: Response): ReadResult;
    write(items: FormatterItems): string
}
