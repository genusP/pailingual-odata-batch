# Pailingual-Odata-Batch

Plugin for [Pailingual-OData](https://github.com/geniusP/pailingual-odata) offering a simple and type-safe batch opertaions.

# Install

```bash
npm --save pailingual-odata-batch
```

# Usage

Before create instance ApiContext you must initialize plugin:
```ts
import Pailingual from "pailingual-odata";
import BatchPlugin from "pailingual-odata-batch";

Pailingual.use(BatchPlugin);
```

Now you can make batch request to your OData service
```ts
const query = context.$batch()
  .request(c=>c.Parent.$byKey(1))
  .BEGIN_changeSet()
    .request(c=>c.Parents.$insert({id:1, strField:"string value"}))
    .request(c=>c.$1.chields.$insert({id:"1", chieldField:"test"}))
  .END_changeSet()

const results = await query.exec();
```

Batch request result is tuple containing items for each request function call.
When an error occurs processing a request and the continue-on-error preference is not specified, or specified with an explicit value of false, processing of the batch is terminated and all next results contains error object.

## ChangeSet

All request between calls BEGIN_changeSet and END_changeSet execute as atomic change set.
ChangeSet may contain data modification requests or action invocation requests.
If any request occurs error all changeset results will be contains error object.
