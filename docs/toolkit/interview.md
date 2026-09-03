# Interview

## What it does

`interview` resolves ambiguous intent one decision at a time. Every question is
short and includes a recommended answer. A durable document records confirmed
and unresolved decisions plus the current question, so the interview can resume
without its chat history.

## When to reach for it

Use it when a workflow needs the operator to settle dependent decisions before
continuing. The calling workflow supplies the topic, document location, and
completion criteria.

It is unnecessary when the request is already unambiguous or the missing answer
can be discovered from the repository or available tools.

## It's working if

The operator sees one answerable decision with a useful default, the document
matches the latest understanding, and another session can continue from it.

## Where it fits

`interview` is a model-invoked toolkit skill. Flow skills such as
`to-web-surface` own their artifacts and decide when the interview is complete.
