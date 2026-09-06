---
name: interview
description: Conduct a persistent decision interview one short question at a time. Use when a workflow needs to resolve ambiguous intent into confirmed decisions in a durable artifact that can be resumed across sessions.
---

# Interview

Turn ambiguous intent into a durable set of decisions. The consuming workflow
must provide the artifact path, decision scope, and definition of done.

## Artifact contract

Read and apply [Durable context](references/durable-context.md) when creating or
resuming the artifact. During an interview, also retain its status and at most
one current question with a recommended answer; an unanswered recommendation
is not a confirmed decision.

## Interview loop

1. Read the artifact first. Resume its current question, or choose the next
   unresolved decision whose prerequisites are already settled.
2. Discover available facts instead of asking for them. Ask only for a decision,
   preference, or unavailable context.
3. Before asking, persist one short question and a clearly labelled recommended
   answer with a brief reason. Then ask it and wait; never batch questions or
   silently accept the recommendation.
4. On reply, record every decision the answer settles, remove obsolete open
   decisions, and surface any conflict with confirmed content. Persist the next
   question before asking it.
5. Finish when no relevant decision remains and the consuming workflow's
   definition of done is satisfied. Hand control back to that workflow.
