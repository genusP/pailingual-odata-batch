import { Pailingual } from "pailingual-odata";
import { createMetadata, IContext } from "./models"
import { assert } from "chai";
import BatchPlugin, { BatchError } from "../index"

if (typeof Request === "undefined") {
    let nf = require("node-fetch");
    (global as any).Headers = nf.Headers;
    (global as any).Request = nf.Request;
    (global as any).Response = nf.Response;
}

Pailingual.use(BatchPlugin);
const md = createMetadata();


describe("Batch build", () => {
    it("get request", async () => {
        const context = Pailingual.createApiContext<IContext>(md);

        let actualUrl;
        let actualRequestInit;

        await context.$batch()
            .request(c => c.Parents)
            .exec({ fetch: (i, ri) => { actualUrl = i; actualRequestInit = ri; return Promise.resolve(new Response(undefined, { status: 200 })); } });

        assert.equal(actualUrl, "/api/$batch");
        assert.exists(actualRequestInit, "Request itialization object");
        assert.equal(actualRequestInit.method, "post");
        assert.containsAllKeys(actualRequestInit.headers || {}, ["Content-Type", "OData-Version"]);
        assert.isTrue(actualRequestInit.headers["Content-Type"].startsWith("multipart/mixed"), "Content-Type header must contains multipart/mixed");

        const boundary = actualRequestInit.headers["Content-Type"].split("boundary=")[1];

        assert.equal(
            actualRequestInit.body,
            `--${boundary}\r\nContent-Type: application/http\r\n\r\nGET Parents\r\n\r\n\r\n--${boundary}--`)
    })

    it("post request", async () => {
        const context = Pailingual.createApiContext<IContext>(md);

        let actualRequestInit;

        await context.$batch()
            .request(c => c.Parents.$insert({ id: 1, strField:"post request" }))
            .exec({ fetch: (i, ri) => { actualRequestInit = ri; return Promise.resolve(new Response(undefined, { status: 200 })); } });

        const boundary = actualRequestInit.headers["Content-Type"].split("boundary=")[1];

        assert.equal(
            actualRequestInit.body,
            `--${boundary}\r
Content-Type: application/http\r
\r
POST Parents\r
Content-Type: application/json\r
Content-Length: 34\r
\r
{"id":1,"strField":"post request"}\r
--${boundary}--`)
    })

    it("changeset", async () => {
        const context = Pailingual.createApiContext<IContext>(md);

        let actualRequestInit;

        await context.$batch().BEGIN_changeSet()
            .request(c => c.Parents.$insert({ id: 1, strField: "post request" }))
            .request(c => c.$1.childs.$insert({ id: "1", parentId: 1, childField: "chield" }))
            .END_changeSet()
            .exec({ fetch: (i, ri) => { actualRequestInit = ri; return Promise.resolve(new Response(undefined, { status: 200 })); } });

        const boundary = actualRequestInit.headers["Content-Type"].split("boundary=")[1];
        const csBoundary = /changeSet__\d+/.exec(actualRequestInit.body)[0];

        assert.equal(
            actualRequestInit.body,
            `--${boundary}\r
Content-Type: multipart/mixed; boundary=${csBoundary}\r
\r
--${csBoundary}\r
Content-Type: application/http\r
Content-ID: 1\r
\r
POST Parents\r
Content-Type: application/json\r
Content-Length: 34\r
\r
{"id":1,"strField":"post request"}\r
--${csBoundary}\r
Content-Type: application/http\r
Content-ID: 2\r
\r
POST $1/childs\r
Content-Type: application/json\r
Content-Length: 45\r
\r
{"id":"1","parentId":1,"childField":"chield"}\r
--${csBoundary}--\r
--${boundary}--`)
    })
})

describe("Batch parse", () => {
    function getFetchMock(httpCode: number, body?: string) {
        return function (r: RequestInfo, init?: RequestInit) {
            let headers: any = {};
            if (body != null)
                headers["Content-Type"] = "multipart/mixed; boundary=b_243234_25424_ef_892u748";
            const response = new Response(body, { status: httpCode, headers });
            return Promise.resolve(response as any as Response);
        }
    };

    it("select + insert", async () => {
        const context = Pailingual.createApiContext<IContext>(md);
        const responseBody = `--b_243234_25424_ef_892u748\r
Content-Type: application/http\r
\r
HTTP/1.1 200 Ok\r
Content-Type: application/json\r
Content-Length: ###\r
\r
{"@odata.context":"http://example.com/$metadata#Parents/$entity","id":1,"strField":"test"}\r
--b_243234_25424_ef_892u748\r
Content-Type: application/http\r
\r
HTTP/1.1 201 Created\r
Content-Type: application/json\r
Content-Length: ###\r
\r
{"@odata.context":"http://example.com/$metadata#Childs/$entity","id":"100", "parentId":1, "childField":"childField"}\r
--b_243234_25424_ef_892u748--`;
        const fetchMock = getFetchMock(200, responseBody);

        const actual = await context.$batch()
            .request(c => c.Parents.$byKey(1))
            .request(c => c.Childs.$insert({ id: "100", parentId: 1, childField: "childField" }))
            .exec({ fetch: fetchMock });

        assert.exists(actual);
        assert.containsAllKeys(actual, ["0", "1"]);
        assert.deepEqual(actual[0], { id: 1, strField: "test" });
        assert.deepEqual(actual[1], { id: "100", parentId: 1, childField: "childField" });
    })

    it("changeset", async () => {
        const context = Pailingual.createApiContext<IContext>(md);
        const responseBody = `--b_243234_25424_ef_892u748\r
Content-Type: multipart/mixed; boundary=cs-155445-455545\r
\r
--cs-155445-455545\r
Content-Type: application/http\r
Content-ID: 1\r
\r
HTTP/1.1 201 Ok\r
Content-Type: application/json\r
Content-Length: ###\r
\r
{"@odata.context":"http://example.com/$metadata#Parents/$entity","id":50,"strField":"strField"}\r
--cs-155445-455545\r
Content-Type: application/http\r
Content-ID: 2\r
\r
HTTP/1.1 204 No Content\r
Preference-Applied: return=minimal\r
EntityId: /api/Childs('100')\r
\r
\r
--cs-155445-455545--\r
--b_243234_25424_ef_892u748--`;
        const fetchMock = getFetchMock(200, responseBody);

        const actual = await context.$batch()
            .BEGIN_changeSet()
            .request(c => c.Parents.$insert({ id: 50, strField: "strField" }))
            .request(c => c.$1.childs.$insert({ id: "100", parentId: 1, childField: "childField" }, true))
            .END_changeSet()
            .exec({ fetch: fetchMock });

        assert.exists(actual);
        assert.containsAllKeys(actual, ["0", "1"]);
        assert.deepEqual(actual[0], { id: 50, strField: "strField" });
        assert.deepEqual(actual[1], { id: "100" });
    })


    it("error in first request", async () => {
        const context = Pailingual.createApiContext<IContext>(md);
        const responseBody = `--b_243234_25424_ef_892u748\r
Content-Type: application/http\r
\r
HTTP/1.1 400 Bad Request\r
Content-Type: application/json\r
\r
{"error":{"message":"Error message"}}\r
--b_243234_25424_ef_892u748--`;
        const fetchMock = getFetchMock(200, responseBody);

        const actual = await context.$batch()
            .request(c => c.Parents.$insert({ id: 50, strField: "strField" }))
            .request(c => c.Childs.$insert({ id: "100", parentId: 1, childField: "childField" }, true))
            .exec({ fetch: fetchMock });

        const expected = new BatchError(400, { message: "Error message" });

        assert.exists(actual);
        assert.containsAllKeys(actual, ["0", "1"]);
        assert.instanceOf(actual[0], BatchError);
        assert.instanceOf(actual[1], BatchError);
        assert.equal((actual[0] as any).status, expected.status)
        assert.equal((actual[1] as any).status, expected.status)
    })

    it("error in changeset", async () => {
        const context = Pailingual.createApiContext<IContext>(md);
        const responseBody = `--b_243234_25424_ef_892u748\r
Content-Type: application/http\r
\r
HTTP/1.1 200 Ok\r
Content-Type: application/json\r
Content-Length: ###\r
\r
{"@odata.context":"http://example.com/$metadata#Parents/$entity","id":1,"strField":"test"}\r
--b_243234_25424_ef_892u748\r
Content-Type: application/http\r
\r
HTTP/1.1 400 Bad Request\r
Content-Type: application/json\r
\r
{"error":{"message":"Error message"}}\r
--b_243234_25424_ef_892u748--`;
        const fetchMock = getFetchMock(200, responseBody);

        const actual = await context.$batch()
            .request(c => c.Parents.$byKey(1))
            .BEGIN_changeSet()
                .request(c => c.Parents.$insert({ id: 50, strField: "strField" }))
                .request(c => c.$1.childs.$insert({ id: "100", parentId: 1, childField: "childField" }, true))
            .END_changeSet()
            .exec({ fetch: fetchMock });

        const expected = new BatchError(400, { message: "Error message" });

        assert.exists(actual);
        assert.containsAllKeys(actual, ["0", "1", "2"]);
        assert.deepEqual(actual[0], { "id": 1, "strField": "test" });
        assert.instanceOf(actual[1], BatchError);
        assert.instanceOf(actual[2], BatchError);
        assert.equal((actual[1] as any).status, expected.status)
        assert.equal((actual[2] as any).status, expected.status)
    })
})

describe("Continue On Error", () => {
    it("enable", async () => {
        const context = Pailingual.createApiContext<IContext>(md);
        let requestInit: RequestInit;
        const fetchMock = (r, ri) => { requestInit = ri; return Promise.resolve(new Response(undefined, { status: 200 })); };
        await context.$batch(true)
                .request(c => c.Parents)
                .exec({ fetch: fetchMock });

        assert.exists(requestInit, "requestInit");
        assert.containsAllKeys(requestInit.headers, ["Prefer"])
        assert.isTrue(requestInit.headers["Prefer"].indexOf("odata.continue-on-error=true") > -1, "Prefer must contains odata.continue-on-error=true");
    })

    it("disable", async () => {
        const context = Pailingual.createApiContext<IContext>(md);
        let requestInit: RequestInit;
        const fetchMock = (r, ri) => { requestInit = ri; return Promise.resolve(new Response(undefined, { status: 200 })); };
        await context.$batch(false)
            .request(c => c.Parents)
            .exec({ fetch: fetchMock });

        assert.exists(requestInit, "requestInit");
        assert.containsAllKeys(requestInit.headers, ["Prefer"])
        assert.isTrue(requestInit.headers["Prefer"].indexOf("odata.continue-on-error=false") > -1, "Prefer must contains odata.continue-on-error=false");
    })

    it("not specified", async () => {
        const context = Pailingual.createApiContext<IContext>(md);
        let requestInit: RequestInit;
        const fetchMock = (r, ri) => { requestInit = ri; return Promise.resolve(new Response(undefined, { status: 200 })); };
        await context.$batch()
            .request(c => c.Parents)
            .exec({ fetch: fetchMock });

        assert.exists(requestInit, "requestInit");
        const prefer = requestInit.headers["Prefer"];
        assert.isTrue(!prefer || prefer.indexOf("odata.continue-on-error") == -1, "Must no Prefer header or not contains odata.continue-on-error");
    })
})