# UT Port JSON RPC

Provides standard JSON-RPC over HTTP implementation

Main purpose of this module is to move all repeatable code out of implementation, for instance, checking response or creating request.

examples:
if you send following message to this port:
```javascript
{a: 'foo', b: 'bar'}
```
with method `a.b.c`
it will get translated to
```javascript
{
  "id": "1",
  "jsonrpc": "2.0",
  "method": "a.b.c",
  "params": {a: 'foo', b: 'bar'}
}
```
params will be `msg` and method will be the method that you are calling.

Response follows same logic, if you usually receive response like:

```javascript
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": [
    {
      "a": "foo",
      "b": "bar"
    }
  ]
}
```
real response from this module will look like:

```javascript
{
    "a": "foo",
    "b": "bar"
}
```
