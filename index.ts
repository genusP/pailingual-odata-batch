import * as p from "pailingual-odata";
import { FormatterItem } from "./formatter";
import { MultiPartFormatter } from "./multipartFormatter";

declare module "pailingual-odata" {
    
    export interface IApiContext<T> {
        $batch(continueOnError?: boolean): IBatchRequestBuilder<Pick<this, Exclude<keyof this, "$batch">>, T>;
    }

    interface IBatchRequestBuilder<T, C, R = {}> {
        request<E, ER>(exp: (ctx: T) => IExecutable<E, ER>, opt?: p.Options): IBatchRequestBuilder<T, C, BatchResult<R, ExecuteResult<E, ER>>>
        BEGIN_changeSet(): IChangeSetBuilder<T, ChangeSetContext<C>, C, R>
        exec(opt?: p.Options): Promise<R>
    }

    interface IChangeSetBuilder<T, C, C2, R> {
        request<E, ER>(exp: (ctx: C) => IDataModifcationExecutable<E, ER>, opt?: p.Options): IChangeSetBuilder<T, ChangeSetContextWithRef<C, E extends IEntityBase ? Singleton<E> : void>, C2, BatchResult<R,ExecuteResult<E, ER>>>
        END_changeSet(): IBatchRequestBuilder<T, C2, R>
    }

    type ChangeSetContext<T> = NavigationSource<T> & Actions<T>

    type ChangeSetContextWithRef<T, U> = 
        "$1" extends keyof T ?
        "$2" extends keyof T ?
        "$3" extends keyof T ?
        "$4" extends keyof T ?
        "$5" extends keyof T ?
        "$6" extends keyof T ?
        "$7" extends keyof T ?
        "$8" extends keyof T ?
        "$9" extends keyof T ?
        "$10" extends keyof T ?
        "$11" extends keyof T ?
        "$12" extends keyof T ?
        "$13" extends keyof T ?
        "$14" extends keyof T ?
        "$15" extends keyof T ? T
        : T & { "$15": U }
        : T & { "$14": U }
        : T & { "$13": U }
        : T & { "$12": U }
        : T & { "$11": U }
        : T & { "$10": U }
        : T & { "$9": U }
        : T & { "$8": U }
        : T & { "$7": U }
        : T & { "$6": U }
        : T & { "$5": U }
        : T & { "$4": U }
        : T & { "$3": U }
        : T & { "$2": U }
        : T & { "$1": U }

    type BatchResult<T, R> =
        0 extends keyof T?  
        1 extends keyof T?  
        2 extends keyof T?  
        3 extends keyof T?  
        4 extends keyof T?  
        5 extends keyof T?  
        6 extends keyof T?  
        7 extends keyof T?  
        8 extends keyof T?  
        9 extends keyof T?  
        10 extends keyof T?  
        11 extends keyof T?  
        12 extends keyof T?  
        13 extends keyof T?  
        14 extends keyof T?  
        15 extends keyof T ? T
        : T & { 15: R | BatchError }
        : T & { 14: R | BatchError }
        : T & { 13: R | BatchError }
        : T & { 12: R | BatchError }
        : T & { 11: R | BatchError }
        : T & { 10: R | BatchError }
        : T & { 9: R | BatchError }
        : T & { 8: R | BatchError }
        : T & { 7: R | BatchError }
        : T & { 6: R | BatchError }
        : T & { 5: R | BatchError }
        : T & { 4: R | BatchError }
        : T & { 3: R | BatchError }
        : T & { 2: R | BatchError }
        : T & { 1: R | BatchError }
        : T & { 0: R | BatchError }
}

function $batch(this: p.ApiContextImpl, base, continueOnError: boolean | undefined) {
    return new BatchBuilder(this.__metadata, continueOnError, this.__options);
}

export default {
    register() {
        return {
            apiContextFn: {
                $batch
            }
        }
    }
};

type BatchRequestBuilderItem = { expr: (c) => any; options: p.Options | undefined };
type BatchRequestBuilderItems = Array<BatchRequestBuilderItem | BatchRequestBuilderItem[]>;
type BatchRequestItem = FormatterItem & { query: any };
type BatchRequestItems = Array<BatchRequestItem | BatchRequestItem[]>;

export class BatchError extends Error {
    constructor(public readonly status: number, public readonly error: any) {
        super((error && error.message) || `HTTP ${status}`);
    }
}

export function isBatchError(obj: any): obj is BatchError {
    return obj && obj.__proto__.constructor == BatchError;
}

class BatchBuilder implements p.IBatchRequestBuilder<any, any> {
    readonly requestsOrChangests: (BatchRequestBuilderItem | BatchRequestBuilderItem[])[] = [];
    private currentChangeset;

    constructor(
        private readonly apiMetadata: p.csdl.MetadataDocument,
        private readonly continueOnError: boolean | undefined,
        private _options: p.Options) { }

    request<E, ER>(expr: (ctx: any) => p.IExecutable<E, ER>, options?: p.Options): p.IBatchRequestBuilder<any, any, any> {
        if (this.currentChangeset)
            throw new Error("Exists not ended changeset");
        this.requestsOrChangests.push({ expr, options });
        return this;
    }

    BEGIN_changeSet(): p.IChangeSetBuilder<any, p.ChangeSetContext<any>, any, any> {
        return this.currentChangeset = new ChangeSetBuilder(
            this,
            cs => {
                this.requestsOrChangests.push(cs);
                this.currentChangeset = undefined;
            }
        );
    }

    async exec(options?: p.Options): Promise<any> {
        const opt = { ...this._options, ...options };
        const fetchApi = opt.fetch || fetch;
        const url = this.apiMetadata.$ApiRoot + "/$batch";

        const formatter = new MultiPartFormatter()

        const requestInit: RequestInit = {
            headers: {
                "Content-Type": formatter.contentType,
                "OData-Version": this.apiMetadata.$Version
            },
            method: "post",
        };

        if (this.continueOnError !== undefined)
            requestInit.headers["Prefer"] = "odata.continue-on-error=" + this.continueOnError;

        if (opt.credentials)
            requestInit.credentials = opt.credentials;

        const requests = this.serializeRequests(this.requestsOrChangests, opt);
        requestInit.body = formatter.write(requests);

        const batchResponse = await fetchApi(url, requestInit);

        return await this.proccessBatchResponse(requests, batchResponse);

    }

    private serializeRequests(requestsOrChangests: BatchRequestBuilderItem[], options: p.Options, context: p.ApiContextImpl | undefined, addConetntId: true): BatchRequestItem[];
    private serializeRequests(requestsOrChangests: BatchRequestBuilderItems, options: p.Options, context?: p.ApiContextImpl | undefined): BatchRequestItems;
    private serializeRequests(requestsOrChangests: BatchRequestBuilderItems, options: p.Options, context: p.ApiContextImpl | undefined, addConetntId = false): BatchRequestItems
    {
        return requestsOrChangests.map((item, index) => Array.isArray(item)
            ? this.serializeRequests(item, options, new p.ApiContextImpl(this.apiMetadata), true)
            : this.serilaizeRequest(item, addConetntId ? index + 1 : undefined, context, options));
    }

    private serilaizeRequest(item: BatchRequestBuilderItem, contentId: number | undefined, context: p.ApiContextImpl | undefined, options: p.Options): BatchRequestItem {
        if (!context)
            context = new p.ApiContextImpl(this.apiMetadata);

        const executable = item.expr(context);
        const query = executable.query;

        let url: string = query.url(true).substr(this.apiMetadata.$ApiRoot.length);
        if (url[0] == "/")
            url = url.substr(1);

        const request = query.getRequestInit(options) as RequestInit;

        if (contentId) 
            this.defineChangeSetRefProperty(context, "$" + contentId, query, executable instanceof p.CollectionSource);
        return { url, request, query, contentId };
    }

    private defineChangeSetRefProperty(context: p.ApiContextImpl, property: string, query:any, collection: boolean) {
        Object.defineProperty(context, property, {
            get(this: p.ApiContextImpl) {
                const q = p.Query.create(this.__metadata, null as any, {}).navigate(property, query._entityMetadata);
                if (collection)
                    return new p.CollectionSource(query._entityMetadata, this.__metadata, q);
                else
                    return new p.SingleSource(query._entityMetadata, this.__metadata, q);
            }
        });
    }

    private async proccessBatchResponse(items: BatchRequestItems, response: Response) {
        const strBody = response.body
            ? await response.text()
            : undefined;

        if (response.ok) {
            const formatter = new MultiPartFormatter();
            const context = {
                pos: 0, result: <Record<string, any>>{}
            };
            if (strBody) {
                const responses = formatter.read(items, strBody, response);
                for (var i = 0; i < items.length; i++) {
                    const request = items[i];
                    const response = responses[i];
                    if (Array.isArray(request))
                        await this.proccessChangeSetResponse(request, response, context);
                    else
                        await this.proccessResponse(request, response as Response, context);
                }
            }
            return context.result;
        }
        throw { status: response.status };
    }

    private async proccessResponse(request: BatchRequestItem, response: Response, context: { pos: number, result: Record<string, any> }) {
        let obj;
        try {
            if (response)
                obj = await request.query.proccessResponse(response, {});
        }
        catch (e) {
            obj = new BatchError(e.status, e.error);
        }
        //if previous request ends with error then no response for next requests then return error info
        if (obj == undefined && context.pos > 0)
            obj = context.result[context.pos - 1];
        context.result[context.pos] = obj ;
        context.pos++;
        return obj;
    }

    private async proccessChangeSetResponse(changeSet: BatchRequestItem[], response: Response | Response[], context: { pos: number, result: Record<string, any> }) {
        if (Array.isArray(response)) //if changeset execute without errors return array of responses
            for (var i = 0; i < response.length; i++) {
                const r = response[i];
                const csItem = changeSet[i];
                await this.proccessResponse(csItem, r, context);
            }
        else { // else one response contains error information
            let err;
            for (const cs of changeSet) {
                if (!err)
                    err = await this.proccessResponse(cs, response, context);
                else { //write error info to all result
                    context.result[context.pos] = err;
                    context.pos++;
                }
            }
        }
    }
}

class ChangeSetBuilder implements p.IChangeSetBuilder<any, p.ChangeSetContext<any>, any, any>{
    private readonly _changeSet: BatchRequestBuilderItem[] = [];
    constructor(private batchBuilder: BatchBuilder, private _callback:(cs)=>void) {

    }

    request<E, ER>(expr: (ctx: p.ChangeSetContext<any>) => p.IDataModifcationExecutable<E, ER>, options?: p.Options)
        : p.IChangeSetBuilder<any, p.ChangeSetContext<any>, any, any>
    {
        if (this.batchBuilder) {
            this._changeSet.push({ expr, options });
            return this;
        }
        throw new Error("Populating this changeset ended");
    }

    END_changeSet(): p.IBatchRequestBuilder<any, any, any>
    {
        if (!this.batchBuilder)
            throw new Error("Changeset already ended");
        const batchBuilder = this.batchBuilder;
        this.batchBuilder = undefined;
        this._callback(this._changeSet);
        return batchBuilder;
    }
}
