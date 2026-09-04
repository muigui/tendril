# @muigui/tendril (monorepo)

Tendril is a lightweight parsing library that converts text documents into a flat Abstract Syntax Tree (AST). Unlike traditional parsers that rely heavily on deeply nested trees, Tendril uses a linear stream of nodes to represent document structure and content.

This is a monorepo containing multiple packages:

- [tendril](./workspaces/tendril): The core library for parsing text documents into a flat AST.
- [tendril-mcp](./workspaces/tendril-mcp): A package for managing and processing Tendril ASTs.
- [tendril-site](./workspaces/tendril-site): A package for creating and serving the Tendril website.
