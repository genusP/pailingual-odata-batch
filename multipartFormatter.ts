import * as f from "./formatter";

type ReadContext = { pos?: number };

const NEW_LINE = "\r\n";
const NEW_LINE2 = "\r\n\r\n";
const headerRE = /^([^()<>@,;:\\"\/[\]?={} \t]+)\s?:\s?(.*)/;
const httpRE = /\S+\s(\d+)\s(.*)$/;
const contentTypeRE = /multipart\/mixed;\s*boundary="?([^"\s]+)"?/;

export class MultiPartFormatter implements f.IBatchFormatter {
    readonly contentType: string;
    readonly boundary: string

    constructor() {
        this.boundary = this.getBoundary("batch___");
        this.contentType = "multipart/mixed; boundary=" + this.boundary;
    }

    private getBoundary(prefix: string) {
        return prefix + new Date().valueOf().toString();
    }

    read(items: f.FormatterItems, body: string, response: Response): f.ReadResult {
        const headers: Record<string, string> = {};
        response.headers.forEach((v, k) => headers[k] = v);

        return this.readBatchResponse(body, headers);
    }

    readBatchResponse(body: string, headers: Record<string, string>): f.ReadResult {
        const contentType: string = headers["content-type"];
        const match = contentType.match(contentTypeRE);
        if (!match)
            throw new Error("Invalid content type");
        const boundary = "--" + match[1];

        return body.split(boundary)
            .filter(d => d && d.trim() !== "--")//skip boundary end and empty blocks
            .map(d => this.readResponse(d));

    }

    readResponse(strResponse: string): Response | Response[] {
        const context: ReadContext = {};
        this.readLine(strResponse, context); //skip empty line
        const headers = this.readHeaders(strResponse, context);
        const contentType = headers["content-type"];
        if (contentType == "application/http")
            return this.readHttpResponse(strResponse, context);
        else if (contentType && contentType.match(contentTypeRE))
            return this.readBatchResponse(strResponse.substr(context.pos), headers) as any;
        throw new Error(`Not supported content type: ${contentType}`);
    }

    readHeaders(text: string, context: ReadContext): Record<string, string> {
        let line: string;
        const res: Record<string, string> = {}
        do {
            line = this.readLine(text, context);
            const parts = headerRE.exec(line);
            if (parts) {
                res[parts[1].toLowerCase()] = parts[2];
            }
            else 
                break;
        } while (line)
        return res;
    }

    readHttpResponse(text: string, context: ReadContext) {
        const httpResponse = this.readLine(text, context);
        const parts = httpRE.exec(httpResponse);
        const headers = this.readHeaders(text, context);
        const body = text.substr(context.pos).trim();

        return new Response(body || undefined, {
            status: parseInt(parts[1]),
            statusText: parts[2],
			headers
        })
    }

    readLine(text: string, context: ReadContext) {
        const pos = context.pos || 0;
        let end = text.indexOf(NEW_LINE, pos);
        if (end === -1)
            end = text.length - 1;
        context.pos = end + NEW_LINE.length;
        return text.substring(pos, end);
    }

    write(items: f.FormatterItems): string {
        let result = "";
        let pos = 1;
        for (let item of items) {
            if (Array.isArray(item)) {
                const csBoundary = this.getBoundary("changeSet__" + pos);
                result += "--" + this.boundary + NEW_LINE
                    + "Content-Type: multipart/mixed; boundary=" + csBoundary + NEW_LINE2;
                for (let csItem of item)
                    result += this.writeItem(csItem, csBoundary);
                result += "--" + csBoundary + "--" + NEW_LINE;
            }
            else
                result += this.writeItem(item, this.boundary);
            pos++;
        }

        result += "--" + this.boundary + "--";
        return result;
    }

    private writeItem(item: f.FormatterItem, boundary: string) {
        const method = (item.request.method || "get").toUpperCase();
        let result = "--" + boundary + NEW_LINE
            + "Content-Type: application/http" + NEW_LINE;
        if (item.contentId)
            result += "Content-ID: " + item.contentId + NEW_LINE;
        result += NEW_LINE + method + " " + item.url + NEW_LINE;
        if (item.request.body) {
            for (let header of ["Content-Type"])
                if (header in item.request.headers)
                    result += header + ": " + item.request.headers[header] + NEW_LINE;
            const body = item.request.body.toString();
            result += "Content-Length: " + body.length + NEW_LINE2;
            result += body;
        }
        else result += NEW_LINE;

        result += NEW_LINE;
        return result
    }
}