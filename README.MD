# UT Port JSON RPC

Provides standard JSON-RPC over HTTP implementation, this ports inherits and extends ut-port-http

This port allows easy calling of remote procedures exposed on remote HTTP server.

If the port works in namespace `a`, calling
```javascript
bus.importMethod('a.b.c')({a: 'foo', b: 'bar'})
```

will send standard json-rpc request to the remote server:
```javascript
{
  "id": "1",
  "jsonrpc": "2.0",
  "method": "a.b.c",
  "params": {"a": 'foo', "b": "bar"}
}
```

If HTTP returns response like:

```javascript
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
      "c": "baz"
  }
}
```

Response from the bus.importMethod()() will be:
```javascript
{
    "c": "baz"
}
```
