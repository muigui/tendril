# @muigui/tendril

Tendril is a lightweight parsing library that converts text documents into a flat Abstract Syntax Tree (AST). Unlike traditional parsers that rely heavily on deeply nested trees, Tendril uses a linear stream of nodes to represent document structure and content.

## The Core Concept: Flat Stream AST

Aside from the top-level [ASTNode](./libs/tendril/src/lib/node/ast-node.ts), Tendril's AST is entirely flat.

It represents document structures using matching boundary markers instead of parent-child nesting:

- **Structure Spans**: Represented by explicit New and End nodes; and
- **Text Content**: Represented by standard Token nodes containing the literal text.

## The Problem Tendril Solves: Overlapping Structures

Traditional parsers force text into strict hierarchical trees. This design breaks down when dealing with real-world formatting that naturally overlaps.

## The Quote Dilemma

A classic example is a dialogue quote that starts in the middle of one paragraph, spans across a second paragraph, and ends inside a third paragraph.

- **Traditional Parsers**: Cannot easily represent this because a `Quote` node cannot be both a child of Paragraph 1 and a parent of Paragraph 2 without duplicating data or breaking XML/JSON tree validation rules.
- **Tendril's Solution**: Because Tendril uses a flat stream, it handles this effortlessly. Boundary markers simply appear exactly where they occur in the text flow, completely bypassing the nesting restriction.

For example the following text:

> He turned to face them.
> 
> Suddenly, he yelled, "Run!
> 
> Don't just stand there!
> 
> I said run!", with the ferocity of a drill sergeant.
> 
> They all just stood there, fingers in each others' noses.

Would be parsed as:

```
[Document.new()] 
  [Paragraph.new()] 
    [Token("He"] 
    [Token(" "] 
    [Token("turned"] 
    [Token(" "] 
    [Token("to"] 
    [Token(" "] 
    [Token("face"] 
    [Token(" "] 
    [Token("them"] 
    [Token("."] 
  [Paragraph.end("\n")]
  [Paragraph.new("\n")] 
    [Token("Suddenly"] 
    [Token(","] 
    [Token(" "] 
    [Token("he"] 
    [Token(" "] 
    [Token("yelled"] 
    [Token(","] 
  [Quote.new('"')] 
    [Token("Run"] 
    [Token("!"] 
  [Paragraph.end("\n")]
  [Paragraph.new("\n")] 
    [Token("Don't"] 
    [Token(" "] 
    [Token("just"]  
    [Token(" "] 
    [Token("stand"] 
    [Token(" "] 
    [Token("there"] 
    [Token("!"] 
  [Paragraph.end("\n")]
  [Paragraph.new("\n")]
    [Token("I"] 
    [Token(" "] 
    [Token("said"] 
    [Token(" "] 
    [Token("run"] 
    [Token("!"]  
  [Quote.end('"')] 
    [Token(","] 
    [Token(" "] 
    [Token("with"]
    [Token(" "] 
    [Token("the"] 
    [Token(" "] 
    [Token("ferocity"] 
    [Token(" "] 
    [Token("of"] 
    [Token(" "] 
    [Token("a"] 
    [Token(" "] 
    [Token("drill"]
    [Token(" "] 
    [Token("sergeant"] 
    [Token("."] 
  [Paragraph.end("\n")]
  [Paragraph.new("\n")]
    [Token("They"] 
    [Token(" "] 
    [Token("all"] 
    [Token(" "] 
    [Token("just"] 
    [Token(" "] 
    [Token("stood"] 
    [Token(" "] 
    [Token("there"] 
    [Token(","] 
    [Token(" "] 
    [Token("fingers"] 
    [Token(" "] 
    [Token("in"] 
    [Token(" "] 
    [Token("each"] 
    [Token(" "] 
    [Token("others"] 
    [Token("'"] 
    [Token(" "] 
    [Token("noses"] 
    [Token("."] 
  [Paragraph.end()]
[Document.end()] 
```

## Features

- **Flat Architecture**: Zero recursive tree traversal required to read or manipulate the document timeline.
- **Overlapping Support**: Natively handles quotes, formatting, or annotations that cross paragraph or sentence boundaries.
- **Simple Stream Processing**: Ideal for pipe-based transformations, rendering engines, and linear text analysis.
- **Language Support**: Version 1.0 officially supports English text documents.

This flat/linear stream allows Tendril to easily represent not only nested structures, but also overlapping structures — E.g. quoted text that spans multiple sentences, lines, and/or paragraphs — without the need for hacks and/or workarounds.  
